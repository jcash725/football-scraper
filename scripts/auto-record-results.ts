#!/usr/bin/env tsx
// Auto-record prediction results by matching against actual touchdown data

import { SimpleTouchdownTracker } from './lib/simple-touchdown-tracker.js';
import { PredictionTracker } from './lib/prediction-tracker.js';

async function main() {
  const [week, year] = [parseInt(process.argv[2]), parseInt(process.argv[3])];
  
  if (!week || !year) {
    console.log('Usage: npx tsx auto-record-results.ts <week> <year>');
    console.log('Example: npx tsx auto-record-results.ts 1 2025');
    process.exit(1);
  }

  console.log(`🏈 Auto-recording results for Week ${week} ${year}...`);

  // Load touchdown data
  const touchdownTracker = new SimpleTouchdownTracker();
  const touchdownData = touchdownTracker.loadTouchdownDatabase(year);
  
  if (!touchdownData) {
    console.log(`❌ No touchdown data found for ${year}`);
    process.exit(1);
  }

  // Get Week 1 actual scorers
  const weekScorers = touchdownData.playerGameStats
    .filter((stat: any) => stat.week === week)
    .filter((stat: any) => stat.rushingTouchdowns > 0 || stat.receivingTouchdowns > 0)
    .map((stat: any) => ({
      player: stat.playerName,
      team: stat.team,
      scoredTD: true
    }));

  console.log(`📊 Found ${weekScorers.length} players who scored TDs in Week ${week}:`);
  weekScorers.forEach(scorer => {
    console.log(`   ${scorer.player} (${scorer.team})`);
  });

  // Load prediction history to find our predictions
  const predictionTracker = new PredictionTracker();
  const fs = await import('fs');
  const history = JSON.parse(fs.readFileSync('data/prediction-history.json', 'utf8'));
  const weekData = history.weeks.find((w: any) => w.week === week && w.year === year);
  
  if (!weekData) {
    console.log(`❌ No predictions found for Week ${week} ${year}`);
    process.exit(1);
  }

  // Match predictions against actual results
  const results: Array<{player: string, team: string, scoredTD: boolean}> = [];
  
  // Check current model predictions
  const currentPredictions = weekData.currentModelPredictions;
  console.log(`\n🔍 Checking ${currentPredictions.length} Current Model predictions...`);
  
  currentPredictions.forEach((pred: any) => {
    const actualResult = weekScorers.find(scorer => 
      scorer.player.toLowerCase().includes(pred.player.toLowerCase()) ||
      pred.player.toLowerCase().includes(scorer.player.toLowerCase())
    );
    
    if (actualResult) {
      console.log(`   ✅ ${pred.player} (${pred.team}) - SCORED!`);
      results.push({player: pred.player, team: pred.team, scoredTD: true});
    } else {
      console.log(`   ❌ ${pred.player} (${pred.team}) - No TD`);
      results.push({player: pred.player, team: pred.team, scoredTD: false});
    }
  });

  // Check ML model predictions  
  const mlPredictions = weekData.mlModelPredictions;
  console.log(`\n🤖 Checking ${mlPredictions.length} ML Model predictions...`);
  
  mlPredictions.forEach((pred: any) => {
    const actualResult = weekScorers.find(scorer => 
      scorer.player.toLowerCase().includes(pred.player.toLowerCase()) ||
      pred.player.toLowerCase().includes(scorer.player.toLowerCase())
    );
    
    if (actualResult) {
      console.log(`   ✅ ${pred.player} (${pred.team}) - SCORED! (${(pred.probability * 100).toFixed(1)}%)`);
      // Only add if not already added from current model
      if (!results.find(r => r.player === pred.player && r.team === pred.team)) {
        results.push({player: pred.player, team: pred.team, scoredTD: true});
      }
    } else {
      console.log(`   ❌ ${pred.player} (${pred.team}) - No TD (${(pred.probability * 100).toFixed(1)}%)`);
      if (!results.find(r => r.player === pred.player && r.team === pred.team)) {
        results.push({player: pred.player, team: pred.team, scoredTD: false});
      }
    }
  });

  // Record all results
  console.log(`\n📝 Recording ${results.length} results...`);
  predictionTracker.recordActualResults(week, year, results);
  
  console.log('✅ Auto-recording complete!');
}

// Run if called directly
main().catch(console.error);