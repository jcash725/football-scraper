#!/usr/bin/env tsx
// Interactive volume data entry helper
// Guides through collecting the most important volume metrics

import { ManualVolumeTracker } from './lib/manual-volume-tracker.js';

interface PlayerEntry {
  name: string;
  team: string;
  position: string;
  targets: number;
  carries: number;
  redZoneTargets: number;
  redZoneCarries: number;
  teamScore: number;
}

async function main() {
  const [week] = [parseInt(process.argv[2])];

  if (!week) {
    console.log('Usage: npx tsx volume-data-entry.ts <week>');
    console.log('Example: npx tsx volume-data-entry.ts 4');
    process.exit(1);
  }

  console.log(`📊 Volume Data Entry for Week ${week}`);
  console.log('=' .repeat(40));
  console.log('\n💡 Focus on players with:');
  console.log('   • 6+ targets (WR/TE)');
  console.log('   • 10+ carries (RB)');
  console.log('   • Any red zone opportunities');
  console.log('   • Players from high-scoring teams\n');

  // Template for easy copy-paste data entry
  const templateData: PlayerEntry[] = [
    // Copy this template and fill with real data
    // { name: "Player Name", team: "Team Name", position: "WR/RB/TE", targets: 0, carries: 0, redZoneTargets: 0, redZoneCarries: 0, teamScore: 0 },

    // Week 4 template entries - replace with actual data
    { name: "CeeDee Lamb", team: "Dallas Cowboys", position: "WR", targets: 12, carries: 0, redZoneTargets: 2, redZoneCarries: 0, teamScore: 24 },
    { name: "Christian McCaffrey", team: "San Francisco 49ers", position: "RB", targets: 5, carries: 18, redZoneTargets: 1, redZoneCarries: 3, teamScore: 28 },
    { name: "Travis Kelce", team: "Kansas City Chiefs", position: "TE", targets: 8, carries: 0, redZoneTargets: 2, redZoneCarries: 0, teamScore: 27 },
  ];

  console.log('📝 Current data template:');
  console.log('   (Edit the templateData array above with real numbers)\n');

  const tracker = new ManualVolumeTracker();

  // Convert template to full volume data
  const volumeData = templateData.map(player => ({
    playerName: player.name,
    team: player.team,
    position: player.position,
    week: week,
    season: 2025,

    // Core volume metrics
    carries: player.carries,
    targets: player.targets,
    receptions: Math.floor(player.targets * 0.68), // NFL average catch rate
    redZoneTargets: player.redZoneTargets,
    redZoneCarries: player.redZoneCarries,
    snapCount: Math.max(player.targets + player.carries + 5, 20), // Estimate

    // Team context
    teamPoints: player.teamScore,
    teamPassingAttempts: 32, // 2025 NFL average
    teamRushingAttempts: 26, // 2025 NFL average

    // Derived metrics
    targetShare: player.targets / 32,
    touchShare: player.carries / 26,
    redZoneShare: (player.redZoneTargets + player.redZoneCarries) / 5 // Estimate 5 RZ opportunities per team
  }));

  // Add the data
  tracker.addWeeklyData(week, volumeData);

  // Show the results
  console.log(`✅ Added volume data for ${volumeData.length} players\n`);

  // Generate predictions based on volume
  const candidates = tracker.predictTouchdownCandidates(week);

  console.log('🏆 Top TD Candidates (by volume metrics):');
  candidates.slice(0, 10).forEach((player, i) => {
    const redZoneTotal = player.redZoneTargets + player.redZoneCarries;
    console.log(`   ${i + 1}. ${player.playerName} (${player.team})`);
    console.log(`      Score: ${player.tdPredictionScore} | Targets: ${player.targets} | Carries: ${player.carries} | RZ: ${redZoneTotal}`);
  });

  console.log('\n📊 Volume Report:');
  tracker.generateVolumeReport(week);

  console.log('\n💡 Data Collection Tips:');
  console.log('   • Get data from ESPN game centers or Pro Football Reference');
  console.log('   • Focus on target share leaders and red zone touches');
  console.log('   • Players with 15+ total touches have highest TD rates');
  console.log('   • Red zone opportunities are the #1 TD predictor');
}

main().catch(console.error);