#!/usr/bin/env tsx
// Test the injury tracking functionality

import { InjuryTracker } from './lib/injury-tracker.js';

async function main() {
  console.log('🏥 Testing NFL Injury Tracker...\n');
  
  const injuryTracker = new InjuryTracker();
  
  try {
    // Fetch and save current injury report
    console.log('📋 Fetching current injury data...');
    await injuryTracker.saveInjuryReport(2, 2025);
    
    // Display injury report
    console.log('\n' + injuryTracker.getInjuryReport());
    
    // Test specific player lookups
    console.log('\n🔍 Testing player-specific injury lookups:');
    
    const testPlayers = [
      'Christian McCaffrey',
      'George Kittle', 
      'Derrick Henry',
      'Jalen Hurts'
    ];
    
    testPlayers.forEach(playerName => {
      const injury = injuryTracker.getPlayerInjuryStatus(playerName);
      const adjustmentFactor = injuryTracker.getInjuryAdjustmentFactor(playerName);
      
      console.log(`\n📊 ${playerName}:`);
      if (injury) {
        console.log(`   Status: ${injury.injuryStatus}`);
        console.log(`   Impact Level: ${injury.impactLevel}`);
        console.log(`   Adjustment Factor: ${adjustmentFactor}`);
        if (injury.injuryType) console.log(`   Injury Type: ${injury.injuryType}`);
        if (injury.notes) console.log(`   Notes: ${injury.notes}`);
      } else {
        console.log(`   Status: Not found in injury report (likely healthy)`);
        console.log(`   Adjustment Factor: ${adjustmentFactor}`);
      }
    });
    
    console.log('\n✅ Injury tracker test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing injury tracker:', error);
    process.exit(1);
  }
}

// Run if called directly
main().catch(console.error);