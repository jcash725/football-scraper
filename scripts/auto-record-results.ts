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

  // Get actual scorers and determine which games have been played
  const allWeekStats = touchdownData.playerGameStats
    .filter((stat: any) => stat.week === week);

  const weekScorers = allWeekStats
    .filter((stat: any) => stat.rushingTouchdowns > 0 || stat.receivingTouchdowns > 0)
    .map((stat: any) => ({
      player: stat.playerName,
      team: stat.team,
      scoredTD: true
    }));

  // Get all teams that have played games this week
  // Note: touchdown database only includes players who scored, so we need to also check
  // opponent teams to catch teams that scored 0 TDs
  const teamsWithCompletedGames = new Set<string>();

  allWeekStats.forEach((stat: any) => {
    teamsWithCompletedGames.add(stat.team);
    teamsWithCompletedGames.add(stat.opponent);
  });

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

    // Only add result if the team's game has been played
    if (teamsWithCompletedGames.has(pred.Team)) {
      if (actualResult) {
        console.log(`   ✅ ${pred.Player} (${pred.Team}) - SCORED!`);
        results.push({player: pred.Player, team: pred.Team, scoredTD: true});
      } else {
        console.log(`   ❌ ${pred.Player} (${pred.Team}) - No TD`);
        results.push({player: pred.Player, team: pred.Team, scoredTD: false});
      }
    } else {
      console.log(`   ⏳ ${pred.Player} (${pred.Team}) - Game not yet played`);
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

    // Only add result if the team's game has been played
    if (teamsWithCompletedGames.has(pred.team)) {
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
    } else {
      console.log(`   ⏳ ${pred.player} (${pred.team}) - Game not yet played`);
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

  // Update HTML files with checkmarks and X marks
  const htmlFile = `data/week${week}-predictions.html`;
  if (fs.existsSync(htmlFile)) {
    let htmlContent = fs.readFileSync(htmlFile, 'utf8');

    // Clean up existing marks and duplicate summary boxes first
    htmlContent = htmlContent.replace(/( ✅)+/g, '');
    htmlContent = htmlContent.replace(/( ❌)+/g, '');
    htmlContent = htmlContent.replace(/<div style="background-color: #2d5a3d; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #90EE90;">[\s\S]*?<\/div>/g, '');

    results.forEach(result => {
      if (result.scoredTD) {
        // Add checkmark to player name
        const playerRegex = new RegExp(`<strong>${result.player}</strong>`, 'g');
        htmlContent = htmlContent.replace(playerRegex, `<strong>${result.player} ✅</strong>`);
      } else {
        // Add X mark to player name for games that have been played
        const playerRegex = new RegExp(`<strong>${result.player}</strong>`, 'g');
        htmlContent = htmlContent.replace(playerRegex, `<strong>${result.player} ❌</strong>`);
      }
    });

    // Add accuracy summary at the top
    const currentModelHits = currentPredictions.filter((pred: any) => pred.actualResult === true).length;
    const mlModelHits = mlPredictions.filter((pred: any) => pred.actualResult === true).length;
    const currentModelTotal = currentPredictions.length;
    const mlModelTotal = mlPredictions.length;

    const accuracySummary = `
    <div style="background-color: #2d5a3d; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #90EE90;">
      <h3 style="color: #90EE90; margin: 0 0 10px 0;">📊 Week ${week} Results Summary</h3>
      <p style="margin: 5px 0; color: white;"><strong>Current Model:</strong> ${currentModelHits}/${currentModelTotal} correct (${((currentModelHits/currentModelTotal)*100).toFixed(1)}%)</p>
      <p style="margin: 5px 0; color: white;"><strong>ML Model:</strong> ${mlModelHits}/${mlModelTotal} correct (${((mlModelHits/mlModelTotal)*100).toFixed(1)}%)</p>
    </div>`;

    // Insert after the first h1 tag
    htmlContent = htmlContent.replace(/(<h1[^>]*>.*?<\/h1>)/i, '$1' + accuracySummary);

    fs.writeFileSync(htmlFile, htmlContent);
    console.log(`✅ Updated ${htmlFile} with checkmarks, X marks, and accuracy summary`);
  }

  // Update volume analysis HTML file
  const volumeHtmlFile = `data/week${week}-volume-analysis.html`;
  if (fs.existsSync(volumeHtmlFile)) {
    let volumeHtmlContent = fs.readFileSync(volumeHtmlFile, 'utf8');

    // Clean up existing marks and duplicate summary boxes first
    volumeHtmlContent = volumeHtmlContent.replace(/( ✅)+/g, '');
    volumeHtmlContent = volumeHtmlContent.replace(/( ❌)+/g, '');
    volumeHtmlContent = volumeHtmlContent.replace(/<div style="background-color: #2d5a3d; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FFD700;">[\s\S]*?<\/div>/g, '');

    // Check volume predictions against actual results
    const volumeResults: Array<{player: string, team: string, scoredTD: boolean}> = [];

    console.log(`\n🔍 Checking Volume-Based predictions...`);

    // Extract player names from volume HTML and check against actual results
    const playerMatches = volumeHtmlContent.match(/<td><strong>([^<]+)<\/strong><\/td>/g);
    if (playerMatches) {
      playerMatches.forEach(match => {
        const playerName = match.replace(/<td><strong>([^<]+)<\/strong><\/td>/, '$1');

        // Skip rank entries like "#1", "#2", etc.
        if (playerName.startsWith('#')) return;

        const actualResult = weekScorers.find(scorer =>
          scorer.player.toLowerCase().includes(playerName.toLowerCase()) ||
          playerName.toLowerCase().includes(scorer.player.toLowerCase())
        );

        if (actualResult) {
          console.log(`   ✅ ${playerName} - SCORED!`);
          volumeResults.push({player: playerName, team: actualResult.team, scoredTD: true});

          // Add checkmark to player name in volume HTML
          const playerRegex = new RegExp(`<strong>${playerName}</strong>`, 'g');
          volumeHtmlContent = volumeHtmlContent.replace(playerRegex, `<strong>${playerName} ✅</strong>`);
        } else {
          console.log(`   ❌ ${playerName} - No TD`);
          volumeResults.push({player: playerName, team: '', scoredTD: false});

          // Add X mark to player name in volume HTML
          const playerRegex = new RegExp(`<strong>${playerName}</strong>`, 'g');
          volumeHtmlContent = volumeHtmlContent.replace(playerRegex, `<strong>${playerName} ❌</strong>`);
        }
      });
    }

    // Add accuracy summary at the top of volume analysis
    const volumeHits = volumeResults.filter(r => r.scoredTD).length;
    const volumeTotal = volumeResults.length;
    const volumeHitRate = volumeTotal > 0 ? ((volumeHits / volumeTotal) * 100).toFixed(1) : '0.0';

    const volumeAccuracySummary = `
    <div style="background-color: #2d5a3d; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FFD700;">
      <h3 style="color: #FFD700; margin: 0 0 10px 0;">📊 Week ${week} Volume Model Results</h3>
      <p style="margin: 5px 0; color: white;"><strong>Volume-Based Predictions:</strong> ${volumeHits}/${volumeTotal} correct (${volumeHitRate}%)</p>
    </div>`;

    // Insert after the first h1 tag
    volumeHtmlContent = volumeHtmlContent.replace(/(<h1[^>]*>.*?<\/h1>)/i, '$1' + volumeAccuracySummary);

    fs.writeFileSync(volumeHtmlFile, volumeHtmlContent);
    console.log(`✅ Updated ${volumeHtmlFile} with checkmarks, X marks, and accuracy summary`);
    console.log(`📊 Volume Model Results: ${volumeHits}/${volumeTotal} (${volumeHitRate}%)`);
  }

  console.log('✅ Auto-recording complete!');
}

// Run if called directly
main().catch(console.error);