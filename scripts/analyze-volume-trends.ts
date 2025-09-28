#!/usr/bin/env tsx
// Analyze volume trends to improve TD predictions

import { ManualVolumeTracker } from './lib/manual-volume-tracker.js';

async function main() {
  const [playerName] = [process.argv[2]];

  console.log(`📈 Volume Trend Analysis${playerName ? ` for ${playerName}` : ''}\n`);

  const tracker = new ManualVolumeTracker();

  if (playerName) {
    // Analyze specific player
    const history = tracker.getPlayerVolumeHistory(playerName);

    if (history.length === 0) {
      console.log(`❌ No volume data found for "${playerName}"`);
      return;
    }

    console.log(`📊 ${playerName} Volume History:`);
    console.log('=' .repeat(50));

    history.forEach(game => {
      const redZoneTotal = game.redZoneTargets + game.redZoneCarries;
      console.log(`Week ${game.week} vs ${getOpponent(game.team, game.week)}:`);
      console.log(`   Targets: ${game.targets} | Carries: ${game.carries} | RZ Opps: ${redZoneTotal}`);
      console.log(`   Team Score: ${game.teamPoints} | Target Share: ${(game.targetShare * 100).toFixed(1)}%`);
      console.log('');
    });

    // Calculate averages
    const avgTargets = history.reduce((sum, g) => sum + g.targets, 0) / history.length;
    const avgCarries = history.reduce((sum, g) => sum + g.carries, 0) / history.length;
    const avgRedZone = history.reduce((sum, g) => sum + g.redZoneTargets + g.redZoneCarries, 0) / history.length;

    console.log(`📈 Averages:`);
    console.log(`   Targets/game: ${avgTargets.toFixed(1)}`);
    console.log(`   Carries/game: ${avgCarries.toFixed(1)}`);
    console.log(`   Red Zone Opps/game: ${avgRedZone.toFixed(1)}`);

    // Predict next week TD likelihood
    const lastGame = history[history.length - 1];
    let prediction = "Low";
    if (avgRedZone >= 2 && (avgTargets >= 8 || avgCarries >= 12)) {
      prediction = "High";
    } else if (avgRedZone >= 1 && (avgTargets >= 6 || avgCarries >= 8)) {
      prediction = "Medium";
    }

    console.log(`\n🎯 Next Week TD Prediction: ${prediction}`);
    console.log(`   Based on: ${avgRedZone.toFixed(1)} avg RZ opps, ${(avgTargets + avgCarries).toFixed(1)} avg touches`);

  } else {
    // Analyze all available data
    const database = tracker.loadDatabase();

    if (database.weeks.length === 0) {
      console.log('❌ No volume data available. Run volume-data-entry.ts first.');
      return;
    }

    console.log(`📊 Volume Database Overview:`);
    console.log(`   Weeks tracked: ${database.weeks.length}`);
    console.log(`   Total player records: ${database.weeks.reduce((sum, w) => sum + w.players.length, 0)}\n`);

    // Show weekly leaders
    database.weeks.forEach(weekData => {
      console.log(`Week ${weekData.week} Volume Leaders:`);

      const topTargets = weekData.players
        .filter(p => p.targets > 0)
        .sort((a, b) => b.targets - a.targets)
        .slice(0, 5);

      const topCarries = weekData.players
        .filter(p => p.carries > 0)
        .sort((a, b) => b.carries - a.carries)
        .slice(0, 5);

      const topRedZone = weekData.players
        .filter(p => (p.redZoneTargets + p.redZoneCarries) > 0)
        .sort((a, b) => (b.redZoneTargets + b.redZoneCarries) - (a.redZoneTargets + a.redZoneCarries))
        .slice(0, 5);

      console.log(`   Top Targets: ${topTargets.map(p => `${p.playerName} (${p.targets})`).join(', ')}`);
      console.log(`   Top Carries: ${topCarries.map(p => `${p.playerName} (${p.carries})`).join(', ')}`);
      console.log(`   Top RZ Opps: ${topRedZone.map(p => `${p.playerName} (${p.redZoneTargets + p.redZoneCarries})`).join(', ')}\n`);
    });

    console.log('💡 Key Insights:');
    console.log('   • Players with 2+ red zone opportunities have high TD rates');
    console.log('   • 15+ total touches (targets + carries) = strong TD candidate');
    console.log('   • Target share leaders on high-scoring teams are premium plays');
    console.log('   • Volume is more predictive than previous TD history');
  }
}

function getOpponent(team: string, week: number): string {
  // This would ideally pull from matchup data
  // For now, return placeholder
  return "OPP";
}

main().catch(console.error);