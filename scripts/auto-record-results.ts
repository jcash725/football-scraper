#!/usr/bin/env tsx
// Auto-record prediction results by matching against actual touchdown data

import { SimpleTouchdownTracker } from './lib/simple-touchdown-tracker.js';

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

  // Load current week predictions
  const fs = await import('fs');
  const predictionFile = `data/week${week}-predictions.json`;

  if (!fs.existsSync(predictionFile)) {
    console.log(`❌ No predictions found for Week ${week} ${year} at ${predictionFile}`);
    process.exit(1);
  }

  const predictions = JSON.parse(fs.readFileSync(predictionFile, 'utf8'));

  if (predictions.week !== week || predictions.season !== year) {
    console.log(`❌ Prediction file mismatch: expected Week ${week} ${year}, found Week ${predictions.week} ${predictions.season}`);
    process.exit(1);
  }

  // Match predictions against actual results
  const results: Array<{player: string, team: string, scoredTD: boolean}> = [];

  // Check current model predictions
  const currentPredictions = predictions.currentModel.predictions;
  console.log(`\n🔍 Checking ${currentPredictions.length} Current Model predictions...`);

  currentPredictions.forEach((pred: any) => {
    const actualResult = weekScorers.find(scorer =>
      scorer.player.toLowerCase().includes(pred.Player.toLowerCase()) ||
      pred.Player.toLowerCase().includes(scorer.player.toLowerCase())
    );

    if (actualResult) {
      console.log(`   ✅ ${pred.Player} (${pred.Team}) - SCORED!`);
      results.push({player: pred.Player, team: pred.Team, scoredTD: true});
    } else {
      console.log(`   ❌ ${pred.Player} (${pred.Team}) - No TD`);
      results.push({player: pred.Player, team: pred.Team, scoredTD: false});
    }
  });

  // Check ML model predictions
  const mlPredictions = predictions.mlModel.predictions;
  console.log(`\n🤖 Checking ${mlPredictions.length} ML Model predictions...`);
  
  mlPredictions.forEach((pred: any) => {
    const actualResult = weekScorers.find(scorer =>
      scorer.player.toLowerCase().includes(pred.player.toLowerCase()) ||
      pred.player.toLowerCase().includes(scorer.player.toLowerCase())
    );

    if (actualResult) {
      console.log(`   ✅ ${pred.player} (${pred.team}) - SCORED! (${(pred.mlProbability * 100).toFixed(1)}%)`);
      // Only add if not already added from current model
      if (!results.find(r => r.player === pred.player && r.team === pred.team)) {
        results.push({player: pred.player, team: pred.team, scoredTD: true});
      }
    } else {
      console.log(`   ❌ ${pred.player} (${pred.team}) - No TD (${(pred.mlProbability * 100).toFixed(1)}%)`);
      if (!results.find(r => r.player === pred.player && r.team === pred.team)) {
        results.push({player: pred.player, team: pred.team, scoredTD: false});
      }
    }
  });

  // Update prediction files with results
  console.log(`\n📝 Updating prediction files with results...`);

  // Update JSON file with actual results
  currentPredictions.forEach((pred: any, index: number) => {
    const result = results.find(r => r.player === pred.Player && r.team === pred.Team);
    if (result) {
      pred.actualResult = result.scoredTD;
    }
  });

  mlPredictions.forEach((pred: any, index: number) => {
    const result = results.find(r => r.player === pred.player && r.team === pred.team);
    if (result) {
      pred.actualResult = result.scoredTD;
    }
  });

  // Save updated JSON
  fs.writeFileSync(predictionFile, JSON.stringify(predictions, null, 2));

  // Update HTML file with checkmarks
  const htmlFile = `data/week${week}-predictions.html`;
  if (fs.existsSync(htmlFile)) {
    let htmlContent = fs.readFileSync(htmlFile, 'utf8');

    results.forEach(result => {
      if (result.scoredTD) {
        // Add checkmark to player name
        const playerRegex = new RegExp(`<strong>${result.player}</strong>`, 'g');
        htmlContent = htmlContent.replace(playerRegex, `<strong>${result.player} ✅</strong>`);
      }
    });

    fs.writeFileSync(htmlFile, htmlContent);
    console.log(`✅ Updated ${htmlFile} with checkmarks`);
  }

  console.log('✅ Auto-recording complete!');
}

// Run if called directly
main().catch(console.error);