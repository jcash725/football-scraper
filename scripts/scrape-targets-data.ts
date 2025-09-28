#!/usr/bin/env tsx
// Scrape real 2025 receiving targets data from TeamRankings

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { ManualVolumeTracker } from './lib/manual-volume-tracker.js';

interface TargetData {
  playerName: string;
  team: string;
  targets: number;
  position: string;
}

async function scrapeTargetsData(): Promise<TargetData[]> {
  console.log('🔄 Scraping receiving targets from TeamRankings...\n');

  try {
    const response = await fetch('https://www.teamrankings.com/nfl/player-stat/receiving-targeted');
    const html = await response.text();
    const $ = cheerio.load(html);

    const players: TargetData[] = [];

    // Look for the data table - TeamRankings typically uses a table with class 'datatable'
    $('table.datatable tbody tr, table tbody tr, .data-table tbody tr').each((index, element) => {
      const row = $(element);
      const cells = row.find('td');

      if (cells.length >= 3) {
        // Extract player name (usually first column)
        const playerCell = cells.eq(0).text().trim();
        const targetsCell = cells.eq(1).text().trim();
        const teamCell = cells.eq(2).text().trim();

        // Clean up player name (remove any extra text)
        const playerName = playerCell.replace(/\s+/g, ' ').trim();
        const targets = parseInt(targetsCell);
        const team = teamCell.trim();

        if (playerName && !isNaN(targets) && team && targets > 0) {
          players.push({
            playerName,
            team,
            targets,
            position: 'WR' // Default, would need to determine actual position
          });
        }
      }
    });

    // If the above didn't work, try alternative table structures
    if (players.length === 0) {
      console.log('🔍 Trying alternative table structure...');

      $('tr').each((index, element) => {
        const row = $(element);
        const cells = row.find('td');

        if (cells.length >= 2) {
          const text = row.text();
          // Look for patterns like "Player Name 45 Team"
          const match = text.match(/([A-Za-z\s\.\-\']+)\s+(\d+)\s+([A-Z]{2,3})/);

          if (match) {
            const [, playerName, targets, team] = match;
            const targetNum = parseInt(targets);

            if (targetNum > 5) { // Only include players with meaningful targets
              players.push({
                playerName: playerName.trim(),
                team: team.trim(),
                targets: targetNum,
                position: 'WR'
              });
            }
          }
        }
      });
    }

    console.log(`✅ Found ${players.length} players with target data`);
    return players.slice(0, 30); // Top 30 target leaders

  } catch (error) {
    console.error('❌ Error scraping targets data:', error);
    return [];
  }
}

async function main() {
  const [week] = [parseInt(process.argv[2])];

  if (!week) {
    console.log('Usage: npx tsx scrape-targets-data.ts <week>');
    console.log('Example: npx tsx scrape-targets-data.ts 4');
    process.exit(1);
  }

  const targetsData = await scrapeTargetsData();

  if (targetsData.length === 0) {
    console.log('❌ No target data found. The website structure may have changed.');
    console.log('💡 Try manually checking: https://www.teamrankings.com/nfl/player-stat/receiving-targeted');
    return;
  }

  console.log('\n📊 Top Receiving Target Leaders (2025 Season):');
  targetsData.slice(0, 15).forEach((player, i) => {
    console.log(`   ${i + 1}. ${player.playerName} (${player.team}): ${player.targets} targets`);
  });

  // Convert to volume data format (with estimated carries and red zone data)
  const tracker = new ManualVolumeTracker();

  const volumeData = targetsData.map(player => ({
    playerName: player.playerName,
    team: player.team,
    position: player.position,
    week: week,
    season: 2025,

    // Core volume metrics
    carries: 0, // WRs/TEs don't carry
    targets: Math.ceil(player.targets / 4), // Convert season total to per-game average
    receptions: Math.ceil(player.targets * 0.68 / 4), // NFL average catch rate
    redZoneTargets: Math.ceil(player.targets * 0.15 / 4), // Estimate 15% of targets in red zone
    redZoneCarries: 0,
    snapCount: Math.max(player.targets + 15, 40), // Estimate

    // Team context (estimates)
    teamPoints: 24, // NFL average
    teamPassingAttempts: 32,
    teamRushingAttempts: 26,

    // Derived metrics
    targetShare: (player.targets / 4) / 32, // Per game target share
    touchShare: 0,
    redZoneShare: (player.targets * 0.15 / 4) / 5
  }));

  // Add the scraped data
  tracker.addWeeklyData(week, volumeData);

  console.log(`\n✅ Added volume data for ${volumeData.length} target leaders\n`);

  // Show top TD candidates
  const candidates = tracker.predictTouchdownCandidates(week);

  console.log('🏆 Top TD Candidates by Volume Score (Real 2025 Targets):');
  candidates.slice(0, 10).forEach((player: any, i) => {
    console.log(`   ${i + 1}. ${player.playerName} (${player.team}) - Score: ${player.tdPredictionScore}`);
    console.log(`      ${player.targets} avg targets | ${player.redZoneTargets} RZ targets`);
  });

  console.log(`\n💡 Next: Run 'npx tsx generate-volume-html.ts ${week}' for full report`);
}

main().catch(console.error);