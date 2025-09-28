#!/usr/bin/env tsx
// Week 4 2025 Volume Data Template - Input REAL game data here

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
    console.log('Usage: npx tsx week4-volume-template.ts <week>');
    console.log('Example: npx tsx week4-volume-template.ts 4');
    process.exit(1);
  }

  console.log(`📊 Week ${week} Volume Data Template - INPUT REAL 2025 DATA ONLY\n`);

  console.log('⚠️  IMPORTANT: Replace template data below with actual 2025 Week 4 stats');
  console.log('   Get data from ESPN game centers, Pro Football Reference, or NFL.com');
  console.log('   Only include players who actually played in Week 4 2025\n');

  // TEMPLATE - REPLACE WITH REAL 2025 WEEK 4 DATA
  const realWeek4Data: PlayerEntry[] = [
    // ===== REPLACE THESE WITH REAL STATS =====
    // Example format:
    // { name: "Player Name", team: "Team Name", position: "RB/WR/TE", targets: X, carries: Y, redZoneTargets: A, redZoneCarries: B, teamScore: Z },

    // RBs - Week 4 2025 (REPLACE WITH ACTUAL STATS)
    { name: "TEMPLATE - Replace with real player", team: "TEMPLATE", position: "RB", targets: 0, carries: 0, redZoneTargets: 0, redZoneCarries: 0, teamScore: 0 },

    // WRs - Week 4 2025 (REPLACE WITH ACTUAL STATS)
    { name: "TEMPLATE - Replace with real player", team: "TEMPLATE", position: "WR", targets: 0, carries: 0, redZoneTargets: 0, redZoneCarries: 0, teamScore: 0 },

    // TEs - Week 4 2025 (REPLACE WITH ACTUAL STATS)
    { name: "TEMPLATE - Replace with real player", team: "TEMPLATE", position: "TE", targets: 0, carries: 0, redZoneTargets: 0, redZoneCarries: 0, teamScore: 0 },
  ];

  if (realWeek4Data[0].name === "TEMPLATE - Replace with real player") {
    console.log('❌ This is template data - you need to replace with REAL 2025 Week 4 stats');
    console.log('');
    console.log('📖 How to get real data:');
    console.log('   1. Go to ESPN.com NFL scores for Week 4 2025');
    console.log('   2. Click on individual games → Stats → Player Stats');
    console.log('   3. Look for: Targets, Carries, Red Zone opportunities');
    console.log('   4. Focus on players with 6+ targets OR 10+ carries');
    console.log('   5. Replace template entries above with real numbers');
    console.log('');
    console.log('💡 Key players to track:');
    console.log('   - Primary RBs: McCaffrey, Henry, Barkley, Cook, Jacobs');
    console.log('   - High-target WRs: Lamb, Jefferson, Chase, Hill, ARSB');
    console.log('   - Target-heavy TEs: Kelce, Andrews, Kittle, LaPorta');
    console.log('');
    return;
  }

  const tracker = new ManualVolumeTracker();

  // Convert to full volume data format
  const volumeData = realWeek4Data.map(player => ({
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
    snapCount: Math.max(player.targets + player.carries + 8, 25), // Estimate

    // Team context
    teamPoints: player.teamScore,
    teamPassingAttempts: 32, // 2025 NFL average
    teamRushingAttempts: 26, // 2025 NFL average

    // Derived metrics
    targetShare: player.targets / 32,
    touchShare: player.carries / 26,
    redZoneShare: (player.redZoneTargets + player.redZoneCarries) / 5
  }));

  // Add the real data
  tracker.addWeeklyData(week, volumeData);

  console.log(`✅ Added REAL volume data for ${volumeData.length} players\n`);

  // Show top candidates
  const candidates = tracker.predictTouchdownCandidates(week);

  console.log('🏆 Top TD Candidates by Volume Score:');
  candidates.slice(0, 15).forEach((player: any, i) => {
    const redZoneTotal = player.redZoneTargets + player.redZoneCarries;
    const totalTouches = player.targets + player.carries;
    console.log(`   ${i + 1}. ${player.playerName} (${player.team}) - Score: ${player.tdPredictionScore}`);
    console.log(`      ${totalTouches} touches (${player.targets} tgt, ${player.carries} car) | ${redZoneTotal} RZ opps`);
  });

  console.log(`\n💡 Next steps:`);
  console.log(`   1. Run: npx tsx setup-injury-data.ts ${week}`);
  console.log(`   2. Run: npx tsx generate-volume-html.ts ${week}`);
}

main().catch(console.error);