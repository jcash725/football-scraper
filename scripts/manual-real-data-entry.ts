#!/usr/bin/env tsx
// Manual entry for real 2025 targets/volume data

import { ManualVolumeTracker } from './lib/manual-volume-tracker.js';

async function main() {
  const [week] = [parseInt(process.argv[2])];

  if (!week) {
    console.log('Usage: npx tsx manual-real-data-entry.ts <week>');
    console.log('Example: npx tsx manual-real-data-entry.ts 4');
    process.exit(1);
  }

  console.log(`📊 Manual Real Data Entry for Week ${week}\n`);
  console.log('💡 Instructions:');
  console.log('   1. Go to https://www.teamrankings.com/nfl/player-stat/receiving-targeted');
  console.log('   2. Copy the top target leaders and their target numbers');
  console.log('   3. Update the realTargetLeaders array below with actual data\n');

  // MANUAL DATA ENTRY - Update with real data from TeamRankings
  const realTargetLeaders = [
    // Format: { name: "Player Name", team: "Team", seasonTargets: X }
    // UPDATE THESE WITH REAL DATA FROM TEAMRANKINGS:
    { name: "PLACEHOLDER", team: "TEAM", seasonTargets: 0 },
  ];

  if (realTargetLeaders[0].name === "PLACEHOLDER") {
    console.log('❌ Please update the realTargetLeaders array with real data from:');
    console.log('   https://www.teamrankings.com/nfl/player-stat/receiving-targeted');
    console.log('');
    console.log('📝 Example format:');
    console.log('   { name: "CeeDee Lamb", team: "Dallas Cowboys", seasonTargets: 45 },');
    console.log('   { name: "Tyreek Hill", team: "Miami Dolphins", seasonTargets: 42 },');
    console.log('');
    return;
  }

  const tracker = new ManualVolumeTracker();

  // Convert season targets to weekly estimates
  const volumeData = realTargetLeaders.map(player => {
    const weeklyTargets = Math.ceil(player.seasonTargets / 4); // 4 weeks played so far
    const estimatedCarries = 0; // Most are WRs/TEs
    const redZoneTargets = Math.ceil(weeklyTargets * 0.2); // 20% of targets in red zone

    return {
      playerName: player.name,
      team: player.team,
      position: 'WR', // Mostly WRs in target leaders
      week: week,
      season: 2025,

      // Core volume metrics
      carries: estimatedCarries,
      targets: weeklyTargets,
      receptions: Math.ceil(weeklyTargets * 0.7), // 70% catch rate
      redZoneTargets: redZoneTargets,
      redZoneCarries: 0,
      snapCount: Math.max(weeklyTargets + 20, 40),

      // Team context
      teamPoints: 24, // NFL average
      teamPassingAttempts: 32,
      teamRushingAttempts: 26,

      // Derived metrics
      targetShare: weeklyTargets / 32,
      touchShare: 0,
      redZoneShare: redZoneTargets / 5
    };
  });

  // Add the data
  tracker.addWeeklyData(week, volumeData);

  console.log(`✅ Added real 2025 target data for ${volumeData.length} players\n`);

  // Show predictions
  const candidates = tracker.predictTouchdownCandidates(week);

  console.log('🏆 Top TD Candidates (Real 2025 Target Data):');
  candidates.slice(0, 10).forEach((player: any, i) => {
    console.log(`   ${i + 1}. ${player.playerName} (${player.team}) - Score: ${player.tdPredictionScore}`);
    console.log(`      ${player.targets} targets/week | ${player.redZoneTargets} RZ targets`);
  });

  console.log(`\n💡 Next: Run 'npx tsx generate-volume-html.ts ${week}' for HTML report`);
}

main().catch(console.error);