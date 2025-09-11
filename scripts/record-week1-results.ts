#!/usr/bin/env tsx
// Automatically record Week 1 results from touchdown data

import { PredictionTracker } from './lib/prediction-tracker.js';
import { SimpleTouchdownTracker } from './lib/simple-touchdown-tracker.js';

async function main() {
  console.log('📊 Recording Week 1 results from touchdown data...');
  
  const predictionTracker = new PredictionTracker();
  const touchdownTracker = new SimpleTouchdownTracker();
  
  // Load the actual Week 1 touchdown data
  const touchdownData = touchdownTracker.loadTouchdownDatabase(2025);
  
  if (!touchdownData) {
    console.error('❌ No touchdown data found for 2025');
    process.exit(1);
  }
  
  // Get all Week 1 touchdown scorers (ANY type of touchdown)
  const week1Scorers = touchdownData.playerGameStats
    .filter(stat => stat.week === 1)
    .filter(stat => stat.rushingTouchdowns > 0 || stat.receivingTouchdowns > 0)
    .map(stat => ({
      player: stat.playerName,
      team: stat.team,
      scoredTD: true,
      touchdowns: {
        rushing: stat.rushingTouchdowns,
        receiving: stat.receivingTouchdowns,
        total: stat.rushingTouchdowns + stat.receivingTouchdowns
      }
    }));
  
  console.log(`🎯 Found ${week1Scorers.length} players who scored touchdowns in Week 1:`);
  week1Scorers.forEach(scorer => {
    const tdBreakdown = [];
    if (scorer.touchdowns.rushing > 0) tdBreakdown.push(`${scorer.touchdowns.rushing} rush`);
    if (scorer.touchdowns.receiving > 0) tdBreakdown.push(`${scorer.touchdowns.receiving} rec`);
    console.log(`   • ${scorer.player} (${scorer.team}): ${tdBreakdown.join(', ')}`);
  });
  
  // Also get all predicted players and mark them as NOT scoring if they're not in the scorer list
  const history = predictionTracker.loadHistory();
  const week1Data = history.weeks.find(w => w.week === 1 && w.year === 2025);
  
  if (!week1Data) {
    console.error('❌ No Week 1 prediction data found');
    process.exit(1);
  }
  
  // Get all predicted players
  const allPredictedPlayers = new Set<string>();
  
  week1Data.currentModelPredictions.forEach(pred => {
    allPredictedPlayers.add(pred.player.toLowerCase());
  });
  
  week1Data.mlModelPredictions.forEach(pred => {
    allPredictedPlayers.add(pred.player.toLowerCase());
  });
  
  // Create complete results array - include scorers and non-scorers from predictions
  const completeResults: Array<{player: string, team: string, scoredTD: boolean}> = [];
  
  // Add all actual scorers
  completeResults.push(...week1Scorers);
  
  // Add predicted players who didn't score
  allPredictedPlayers.forEach(playerName => {
    const scored = week1Scorers.some(scorer => 
      scorer.player.toLowerCase().includes(playerName) ||
      playerName.includes(scorer.player.toLowerCase())
    );
    
    if (!scored) {
      // Find the team from predictions (use first match)
      let team = 'Unknown';
      const currentPred = week1Data.currentModelPredictions.find(p => 
        p.player.toLowerCase().includes(playerName) ||
        playerName.includes(p.player.toLowerCase())
      );
      const mlPred = week1Data.mlModelPredictions.find(p => 
        p.player.toLowerCase().includes(playerName) ||
        playerName.includes(p.player.toLowerCase())
      );
      
      if (currentPred) team = currentPred.team;
      else if (mlPred) team = mlPred.team;
      
      completeResults.push({
        player: playerName,
        team: team,
        scoredTD: false
      });
    }
  });
  
  console.log(`\n📝 Recording results for ${completeResults.length} total players...`);
  
  // Record the results
  predictionTracker.recordActualResults(1, 2025, completeResults);
  
  console.log('\n✅ Week 1 results recorded successfully!');
  
  // Show final report
  const report = predictionTracker.getWeeklyReport(1, 2025);
  console.log(report);
}

// Run if called directly
main().catch(console.error);