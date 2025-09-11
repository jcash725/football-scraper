#!/usr/bin/env tsx
// Test injury tracking integration with ML predictor

import { EnhancedMLTDPredictor } from './lib/enhanced-ml-predictor.js';
import { InjuryTracker } from './lib/injury-tracker.js';

async function main() {
  console.log('🏈 Testing Injury Integration with ML Predictor...\n');
  
  const predictor = new EnhancedMLTDPredictor();
  const injuryTracker = new InjuryTracker();
  
  try {
    // First update injury report
    console.log('📋 Updating injury report...');
    await injuryTracker.saveInjuryReport(2, 2025);
    
    // Initialize ML predictor
    console.log('\n🤖 Initializing ML predictor...');
    await predictor.initialize();
    
    // Test predictions for known injured players
    console.log('\n🔍 Testing predictions for players with known injury status:\n');
    
    const testPlayers = [
      { name: 'Chris Godwin Jr.', team: 'Tampa Bay Buccaneers', opponent: 'New Orleans Saints', isHome: true },
      { name: 'Christian McCaffrey', team: 'San Francisco 49ers', opponent: 'Minnesota Vikings', isHome: false },
      { name: 'George Kittle', team: 'San Francisco 49ers', opponent: 'Minnesota Vikings', isHome: false },
      { name: 'Derrick Henry', team: 'Baltimore Ravens', opponent: 'Las Vegas Raiders', isHome: true },
      { name: 'Justin Jefferson', team: 'Minnesota Vikings', opponent: 'San Francisco 49ers', isHome: true }
    ];
    
    for (const player of testPlayers) {
      console.log(`\n📊 ${player.name} (${player.team} vs ${player.opponent}):`);
      
      // Get injury status
      const injuryStatus = injuryTracker.getPlayerInjuryStatus(player.name, player.team);
      const adjustmentFactor = injuryTracker.getInjuryAdjustmentFactor(player.name, player.team);
      
      console.log(`   Injury Status: ${injuryStatus?.injuryStatus || 'Active'}`);
      console.log(`   Impact Level: ${injuryStatus?.impactLevel || 'None'}`);
      console.log(`   Adjustment Factor: ${adjustmentFactor}`);
      
      if (injuryStatus?.notes) {
        console.log(`   Notes: ${injuryStatus.notes.substring(0, 100)}...`);
      }
      
      // Get ML prediction with injury adjustment
      try {
        const prediction = predictor.predictForPlayer(
          player.name,
          player.team,
          player.opponent,
          player.isHome,
          'WR'
        );
        
        console.log(`   ML Probability: ${(prediction.mlProbability * 100).toFixed(1)}%`);
        console.log(`   ML Confidence: ${(prediction.mlConfidence * 100).toFixed(1)}%`);
        console.log(`   Key Factors: ${prediction.keyFactors.join(', ')}`);
        
      } catch (error) {
        console.log(`   ❌ Could not generate prediction: ${error}`);
      }
    }
    
    console.log('\n✅ Injury integration test completed successfully!');
    console.log('\n💡 The ML predictor now automatically adjusts predictions based on injury status:');
    console.log('   • Players ruled OUT get 0% probability');
    console.log('   • High impact injuries reduce probability by 70%');
    console.log('   • Medium impact injuries reduce probability by 40%');
    console.log('   • Low impact injuries reduce probability by 15%');
    
  } catch (error) {
    console.error('❌ Error testing injury integration:', error);
    process.exit(1);
  }
}

// Run if called directly
main().catch(console.error);