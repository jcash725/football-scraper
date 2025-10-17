#!/usr/bin/env tsx
// Scrape Pro Football Reference red zone data
import * as cheerio from 'cheerio';

interface RedZoneData {
  playerName: string;
  team: string;
  redZoneTargets?: number;
  redZoneCarries?: number;
}

export async function scrapeRedZoneData(): Promise<RedZoneData[]> {
  console.log('🔴 Using current 2025 red zone data from Pro Football Reference...\n');

  // Current Week 6 data (manually updated from PFR)
  // URLs: https://www.pro-football-reference.com/years/2025/redzone-receiving.htm
  //       https://www.pro-football-reference.com/years/2025/redzone-rushing.htm

  const receivingData: RedZoneData[] = [
    { playerName: "Amon-Ra St. Brown", team: "DET", redZoneTargets: 10 },
    { playerName: "Davante Adams", team: "LAR", redZoneTargets: 9 },
    { playerName: "Christian McCaffrey", team: "SFO", redZoneTargets: 9 },
    { playerName: "Theo Johnson", team: "NYG", redZoneTargets: 8 },
    { playerName: "George Pickens", team: "DAL", redZoneTargets: 8 },
    { playerName: "Keenan Allen", team: "LAC", redZoneTargets: 7 },
    { playerName: "Troy Franklin", team: "DEN", redZoneTargets: 7 },
    { playerName: "Hunter Henry", team: "NWE", redZoneTargets: 7 },
    { playerName: "Khalil Shakir", team: "BUF", redZoneTargets: 7 },
    { playerName: "Jaylen Waddle", team: "MIA", redZoneTargets: 7 },
    { playerName: "Romeo Doubs", team: "GNB", redZoneTargets: 6 },
    { playerName: "Ashton Jeanty", team: "LVR", redZoneTargets: 6 },
    { playerName: "Jalen Nailor", team: "MIN", redZoneTargets: 6 },
    { playerName: "Rome Odunze", team: "CHI", redZoneTargets: 6 },
    { playerName: "Chris Olave", team: "NOR", redZoneTargets: 6 },
    { playerName: "Hunter Renfrow", team: "CAR", redZoneTargets: 6 }
  ];

  const rushingData: RedZoneData[] = [
    { playerName: "Jonathan Taylor", team: "IND", redZoneCarries: 26 },
    { playerName: "Jahmyr Gibbs", team: "DET", redZoneCarries: 23 },
    { playerName: "Cam Skattebo", team: "NYG", redZoneCarries: 22 },
    { playerName: "Christian McCaffrey", team: "SFO", redZoneCarries: 21 },
    { playerName: "James Cook", team: "BUF", redZoneCarries: 19 },
    { playerName: "Josh Jacobs", team: "GNB", redZoneCarries: 19 },
    { playerName: "David Montgomery", team: "DET", redZoneCarries: 17 },
    { playerName: "Jalen Hurts", team: "PHI", redZoneCarries: 15 },
    { playerName: "Saquon Barkley", team: "PHI", redZoneCarries: 14 },
    { playerName: "Quinshon Judkins", team: "CLE", redZoneCarries: 14 },
    { playerName: "Kyren Williams", team: "LAR", redZoneCarries: 14 },
    { playerName: "Zach Charbonnet", team: "SEA", redZoneCarries: 13 },
    { playerName: "Travis Etienne", team: "JAX", redZoneCarries: 13 },
    { playerName: "Javonte Williams", team: "DAL", redZoneCarries: 13 },
    { playerName: "Josh Allen", team: "BUF", redZoneCarries: 12 },
    { playerName: "J.K. Dobbins", team: "DEN", redZoneCarries: 12 },
    { playerName: "Kenneth Walker", team: "SEA", redZoneCarries: 12 },
    { playerName: "Jaylen Warren", team: "PIT", redZoneCarries: 12 }
  ];

  // Merge players with both targets and carries
  const playerMap = new Map<string, RedZoneData>();

  [...receivingData, ...rushingData].forEach(player => {
    const key = player.playerName.toLowerCase();
    const existing = playerMap.get(key);

    if (existing) {
      // Merge data
      if (player.redZoneTargets) existing.redZoneTargets = player.redZoneTargets;
      if (player.redZoneCarries) existing.redZoneCarries = player.redZoneCarries;
    } else {
      playerMap.set(key, { ...player });
    }
  });

  const finalData = Array.from(playerMap.values());
  console.log(`✅ Loaded ${finalData.length} players with red zone data (manually updated from PFR)`);
  console.log(`   ${receivingData.length} with RZ targets, ${rushingData.length} with RZ carries\n`);

  return finalData;
}

function parseRedZoneReceiving(html: string): RedZoneData[] {
  const players: RedZoneData[] = [];
  const $ = cheerio.load(html);

  // Try multiple selectors for the table
  let $table = $('table#redzone-receiving');

  if ($table.length === 0) {
    $table = $('table.stats_table').first();
  }

  if ($table.length === 0) {
    $table = $('table').first();
  }

  // Find all table rows
  $table.find('tbody tr').each((_, row) => {
    const $row = $(row);

    // Skip header rows
    if ($row.hasClass('thead') || $row.hasClass('over_header')) return;

    const playerName = $row.find('td[data-stat="player"] a').text().trim();
    const team = $row.find('td[data-stat="team"] a').text().trim();
    const targetsText = $row.find('td[data-stat="rec_tgt"]').text().trim();

    if (playerName && team && targetsText) {
      const targets = parseInt(targetsText);
      if (!isNaN(targets) && targets > 0) {
        players.push({
          playerName,
          team,
          redZoneTargets: targets
        });
      }
    }
  });

  return players;
}

function parseRedZoneRushing(html: string): RedZoneData[] {
  const players: RedZoneData[] = [];
  const $ = cheerio.load(html);

  // Try multiple selectors for the table
  let $table = $('table#redzone-rushing');

  if ($table.length === 0) {
    $table = $('table.stats_table').first();
  }

  if ($table.length === 0) {
    $table = $('table').first();
  }

  // Find all table rows
  $table.find('tbody tr').each((_, row) => {
    const $row = $(row);

    // Skip header rows
    if ($row.hasClass('thead') || $row.hasClass('over_header')) return;

    const playerName = $row.find('td[data-stat="player"] a').text().trim();
    const team = $row.find('td[data-stat="team"] a').text().trim();
    const carriesText = $row.find('td[data-stat="rush_att"]').text().trim();

    if (playerName && team && carriesText) {
      const carries = parseInt(carriesText);
      if (!isNaN(carries) && carries > 0) {
        players.push({
          playerName,
          team,
          redZoneCarries: carries
        });
      }
    }
  });

  return players;
}

async function main() {
  const redZoneData = await scrapeRedZoneData();

  console.log('\n🏆 Top Red Zone Players:');

  // Show top receiving targets
  const topTargets = redZoneData
    .filter(p => p.redZoneTargets && p.redZoneTargets > 0)
    .sort((a, b) => (b.redZoneTargets || 0) - (a.redZoneTargets || 0))
    .slice(0, 10);

  console.log('\n🎯 Red Zone Targets:');
  topTargets.forEach((player, i) => {
    console.log(`   ${i + 1}. ${player.playerName} (${player.team}): ${player.redZoneTargets} targets`);
  });

  // Show top carries
  const topCarries = redZoneData
    .filter(p => p.redZoneCarries && p.redZoneCarries > 0)
    .sort((a, b) => (b.redZoneCarries || 0) - (a.redZoneCarries || 0))
    .slice(0, 10);

  console.log('\n🏃 Red Zone Carries:');
  topCarries.forEach((player, i) => {
    console.log(`   ${i + 1}. ${player.playerName} (${player.team}): ${player.redZoneCarries} carries`);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}