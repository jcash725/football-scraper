#!/usr/bin/env tsx
// Test player team change tracking

import { PlayerTeamTracker } from './lib/player-team-tracker.js';
import { SimpleTouchdownTracker } from './lib/simple-touchdown-tracker.js';

async function main() {
  console.log('🔄 Testing Player Team Change Tracking...\n');
  
  const teamTracker = new PlayerTeamTracker();
  const tdTracker = new SimpleTouchdownTracker();
  
  try {
    // Add known team changes first
    console.log('📝 Adding known significant team changes for 2025...');
    teamTracker.addKnownTeamChanges();
    
    // Test specific player lookups for known changes
    console.log('\n🔍 Testing lookups for players with known team changes:\n');
    
    const testPlayers = [
      'Keenan Allen',
      'DeAndre Hopkins', 
      'Saquon Barkley',
      'Calvin Ridley', // Another potential change
      'Mike Evans' // Should stay with same team
    ];
    
    testPlayers.forEach(playerName => {
      const teamForPrediction = teamTracker.getPlayerTeamForPrediction(playerName);
      console.log(`📊 ${playerName}: Currently assigned to ${teamForPrediction}`);
    });
    
    // Try to detect changes from historical data
    console.log('\n📋 Loading 2024 touchdown data for comparison...');
    const historicalData = tdTracker.loadTouchdownDatabase(2024);
    
    if (historicalData) {
      console.log('🔍 Detecting team changes from 2024 to 2025...');
      const detectedChanges = teamTracker.detectTeamChanges(historicalData);
      
      if (detectedChanges.length > 0) {
        console.log(`\n📊 Detected ${detectedChanges.length} potential team changes:`);
        detectedChanges.slice(0, 10).forEach(change => {
          console.log(`   ${change.playerName}: ${change.previousTeam} → ${change.currentTeam}`);
        });
        
        // Save detected changes
        teamTracker.saveTeamChanges(detectedChanges);
      } else {
        console.log('No team changes detected from historical data comparison.');
      }
    }
    
    // Show team changes report
    console.log('\n' + teamTracker.getTeamChangesReport());
    
    console.log('\n✅ Team change tracking test completed successfully!');
    console.log('\n💡 Benefits for prediction accuracy:');
    console.log('   • Historical stats are contextualized with current team');
    console.log('   • Opponent matchups use correct current team assignments');
    console.log('   • Head-to-head data accounts for team changes');
    console.log('   • Prevents predictions using outdated team information');
    
  } catch (error) {
    console.error('❌ Error testing team changes:', error);
    process.exit(1);
  }
}

// Run if called directly
main().catch(console.error);