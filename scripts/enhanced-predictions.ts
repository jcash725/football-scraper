#!/usr/bin/env tsx
// Enhanced TD predictions combining historical data with volume metrics

import { ManualVolumeTracker } from './lib/manual-volume-tracker.js';
import { SimpleTouchdownTracker } from './lib/simple-touchdown-tracker.js';

interface EnhancedPrediction {
  playerName: string;
  team: string;
  opponent: string;
  position: string;

  // Historical factors
  recentTDs: number;
  seasonTDs: number;
  historicalScore: number;

  // Volume factors
  avgTargets: number;
  avgCarries: number;
  avgRedZoneOpps: number;
  volumeScore: number;

  // Combined score
  enhancedScore: number;
  confidence: 'High' | 'Medium' | 'Low';
  prediction: 'Strong' | 'Solid' | 'Dart Throw';
}

async function main() {
  const [week] = [parseInt(process.argv[2])];

  if (!week) {
    console.log('Usage: npx tsx enhanced-predictions.ts <week>');
    console.log('Example: npx tsx enhanced-predictions.ts 5');
    process.exit(1);
  }

  console.log(`🎯 Enhanced TD Predictions for Week ${week}`);
  console.log('=' .repeat(50));
  console.log('Combining historical performance + volume metrics\n');

  const volumeTracker = new ManualVolumeTracker();
  const statsCollector = new SimpleTouchdownTracker();

  // Get volume-based candidates
  const volumeCandidates = volumeTracker.predictTouchdownCandidates(week);

  if (volumeCandidates.length === 0) {
    console.log('❌ No volume data available for this week.');
    console.log('   Run: npx tsx volume-data-entry.ts ${week}');
    return;
  }

  console.log('📊 Volume-Based Analysis:');
  volumeCandidates.slice(0, 10).forEach((player, i) => {
    const redZoneTotal = player.redZoneTargets + player.redZoneCarries;
    console.log(`   ${i + 1}. ${player.playerName} (${player.team})`);
    console.log(`      Volume Score: ${player.tdPredictionScore} | Targets: ${player.targets} | Carries: ${player.carries} | RZ: ${redZoneTotal}`);
  });

  // Load historical data
  try {
    const historicalDatabase = statsCollector.loadTouchdownDatabase(2025);

    if (!historicalDatabase) {
      console.log('\n⚠️  No historical TD data available.');
      console.log('   Volume predictions only:\n');

      // Show volume-only predictions
      showVolumeOnlyPredictions(volumeCandidates);
      return;
    }

    console.log('\n🔄 Combining with Historical Data...\n');

    // Create enhanced predictions
    const enhancedPredictions: EnhancedPrediction[] = [];

    volumeCandidates.forEach(volumePlayer => {
      // Find historical performance
      const playerHistory = historicalDatabase.playerGameStats.filter(stat =>
        stat.playerName.toLowerCase().includes(volumePlayer.playerName.toLowerCase())
      );

      const recentTDs = playerHistory
        .filter(stat => stat.week >= week - 3 && stat.week < week)
        .reduce((sum, stat) => sum + stat.rushingTouchdowns + stat.receivingTouchdowns, 0);

      const seasonTDs = playerHistory.reduce((sum, stat) => sum + stat.rushingTouchdowns + stat.receivingTouchdowns, 0);

      // Historical score (based on recent performance)
      let historicalScore = 0;
      if (recentTDs >= 3) historicalScore = 5;
      else if (recentTDs >= 2) historicalScore = 3;
      else if (recentTDs >= 1) historicalScore = 2;
      else if (seasonTDs >= 3) historicalScore = 1;

      // Get volume averages
      const playerVolumeHistory = volumeTracker.getPlayerVolumeHistory(volumePlayer.playerName);
      const avgTargets = playerVolumeHistory.length > 0
        ? playerVolumeHistory.reduce((sum, g) => sum + g.targets, 0) / playerVolumeHistory.length
        : volumePlayer.targets;

      const avgCarries = playerVolumeHistory.length > 0
        ? playerVolumeHistory.reduce((sum, g) => sum + g.carries, 0) / playerVolumeHistory.length
        : volumePlayer.carries;

      const avgRedZoneOpps = playerVolumeHistory.length > 0
        ? playerVolumeHistory.reduce((sum, g) => sum + g.redZoneTargets + g.redZoneCarries, 0) / playerVolumeHistory.length
        : volumePlayer.redZoneTargets + volumePlayer.redZoneCarries;

      // Enhanced scoring (70% volume, 30% historical)
      const enhancedScore = Math.round(
        (volumePlayer.tdPredictionScore * 0.7) + (historicalScore * 0.3)
      );

      // Determine confidence and prediction level
      let confidence: 'High' | 'Medium' | 'Low' = 'Low';
      let prediction: 'Strong' | 'Solid' | 'Dart Throw' = 'Dart Throw';

      if (enhancedScore >= 12 && avgRedZoneOpps >= 2) {
        confidence = 'High';
        prediction = 'Strong';
      } else if (enhancedScore >= 8 && (avgTargets >= 8 || avgCarries >= 12)) {
        confidence = 'Medium';
        prediction = 'Solid';
      } else if (enhancedScore >= 5) {
        confidence = 'Low';
        prediction = 'Dart Throw';
      }

      enhancedPredictions.push({
        playerName: volumePlayer.playerName,
        team: volumePlayer.team,
        opponent: "TBD", // Would need matchup data
        position: volumePlayer.position,
        recentTDs,
        seasonTDs,
        historicalScore,
        avgTargets,
        avgCarries,
        avgRedZoneOpps,
        volumeScore: volumePlayer.tdPredictionScore,
        enhancedScore,
        confidence,
        prediction
      });
    });

    // Sort by enhanced score
    enhancedPredictions.sort((a, b) => b.enhancedScore - a.enhancedScore);

    // Display results
    console.log('🏆 Enhanced TD Predictions (Volume + Historical):');
    console.log('=' .repeat(65));

    const strongPlays = enhancedPredictions.filter(p => p.prediction === 'Strong');
    const solidPlays = enhancedPredictions.filter(p => p.prediction === 'Solid');
    const dartThrows = enhancedPredictions.filter(p => p.prediction === 'Dart Throw');

    if (strongPlays.length > 0) {
      console.log('\n💎 STRONG PLAYS (High Confidence):');
      strongPlays.forEach((player, i) => {
        console.log(`   ${i + 1}. ${player.playerName} (${player.team}) - Score: ${player.enhancedScore}`);
        console.log(`      Volume: ${player.avgTargets.toFixed(1)} tgt, ${player.avgCarries.toFixed(1)} car, ${player.avgRedZoneOpps.toFixed(1)} RZ`);
        console.log(`      Recent: ${player.recentTDs} TDs last 3 weeks`);
      });
    }

    if (solidPlays.length > 0) {
      console.log('\n⚡ SOLID PLAYS (Medium Confidence):');
      solidPlays.slice(0, 8).forEach((player, i) => {
        console.log(`   ${i + 1}. ${player.playerName} (${player.team}) - Score: ${player.enhancedScore}`);
        console.log(`      Volume: ${player.avgTargets.toFixed(1)} tgt, ${player.avgCarries.toFixed(1)} car, ${player.avgRedZoneOpps.toFixed(1)} RZ`);
      });
    }

    if (dartThrows.length > 0) {
      console.log('\n🎯 DART THROWS (Lower Volume):');
      dartThrows.slice(0, 5).forEach((player, i) => {
        console.log(`   ${i + 1}. ${player.playerName} (${player.team}) - Score: ${player.enhancedScore}`);
      });
    }

    console.log('\n📈 Methodology:');
    console.log('   • Enhanced Score = 70% Volume Metrics + 30% Historical TDs');
    console.log('   • Volume factors: targets, carries, red zone opportunities');
    console.log('   • Strong plays: 12+ score with 2+ avg red zone touches');
    console.log('   • Solid plays: 8+ score with 8+ targets OR 12+ carries');

  } catch (error) {
    console.error('❌ Error loading historical data:', error);
    console.log('\n📊 Showing volume-only predictions:\n');
    showVolumeOnlyPredictions(volumeCandidates);
  }
}

function showVolumeOnlyPredictions(candidates: any[]): void {
  console.log('🎯 Volume-Based TD Predictions:');
  candidates.slice(0, 15).forEach((player, i) => {
    const redZoneTotal = player.redZoneTargets + player.redZoneCarries;
    let tier = '🎯 Dart Throw';
    if (player.tdPredictionScore >= 12) tier = '💎 Strong Play';
    else if (player.tdPredictionScore >= 8) tier = '⚡ Solid Play';

    console.log(`   ${i + 1}. ${player.playerName} (${player.team}) - ${tier}`);
    console.log(`      Score: ${player.tdPredictionScore} | Volume: ${player.targets} tgt, ${player.carries} car, ${redZoneTotal} RZ`);
  });
}

main().catch(console.error);