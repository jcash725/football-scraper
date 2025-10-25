#!/usr/bin/env tsx
// Enhanced results processor that automatically prepares data for the next week

import { SimpleTouchdownTracker } from './lib/simple-touchdown-tracker.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function main() {
  const [week, year] = [parseInt(process.argv[2]), parseInt(process.argv[3])];

  if (!week || !year) {
    console.log('Usage: npx tsx process-weekly-results.ts <week> <year>');
    console.log('Example: npx tsx process-weekly-results.ts 5 2025');
    process.exit(1);
  }

  const nextWeek = week + 1;

  console.log(`🏈 Processing Week ${week} ${year} results and preparing Week ${nextWeek} data...`);
  console.log('=' .repeat(80));

  // Step 1: Record results for the completed week
  console.log(`\n📊 STEP 1: Recording results for Week ${week}...`);
  try {
    await execAsync(`npx tsx scripts/auto-record-results.ts ${week} ${year}`);
    console.log(`✅ Week ${week} results recorded successfully`);
  } catch (error) {
    console.error(`❌ Failed to record Week ${week} results:`, error);
    console.log('Continuing with next week preparation...');
  }

  // Step 2: Update the all-predictions.html file with results
  console.log(`\n📝 STEP 2: Updating all-predictions interface with Week ${week} results...`);
  try {
    const fs = await import('fs');
    const allPredictionsFile = `data/week${week}-all-predictions.html`;

    if (fs.existsSync(allPredictionsFile)) {
      // Load touchdown data to get actual scorers
      const touchdownTracker = new SimpleTouchdownTracker();
      const touchdownData = touchdownTracker.loadTouchdownDatabase(year);

      if (touchdownData) {
        const allWeekStats = touchdownData.playerGameStats
          .filter((stat: any) => stat.week === week);

        const weekScorers = allWeekStats
          .filter((stat: any) => stat.rushingTouchdowns > 0 || stat.receivingTouchdowns > 0)
          .map((stat: any) => ({
            player: stat.playerName,
            team: stat.team,
            scoredTD: true
          }));

        let htmlContent = fs.readFileSync(allPredictionsFile, 'utf8');

        // Clean up existing marks and percentages
        htmlContent = htmlContent.replace(/( ✅)+/g, '');
        htmlContent = htmlContent.replace(/( ❌)+/g, '');
        htmlContent = htmlContent.replace(/ - \d+%/g, ''); // Remove old percentages from tabs
        htmlContent = htmlContent.replace(/<p><strong>Accuracy:<\/strong>.*?<\/p>\n?/g, ''); // Remove old accuracy lines
        // Remove ALL results headers from the top (we show results in each tab instead)
        htmlContent = htmlContent.replace(/<div style="background-color: #2d5a3d[^>]*>[\s\S]*?📊 Week \d+ Final Results[\s\S]*?<\/div>/g, '');

        // Add checkmarks and X marks
        weekScorers.forEach(scorer => {
          const playerRegex = new RegExp(`(<td class="player-name">)([^<]*${scorer.player}[^<]*)(<\/td>)`, 'gi');
          htmlContent = htmlContent.replace(playerRegex, `$1$2 ✅$3`);
        });

        // Mark all players who didn't score (simplified - you could make this more precise)
        const playerMatches = htmlContent.match(/<td class="player-name">([^<]+)<\/td>/g);
        if (playerMatches) {
          playerMatches.forEach(match => {
            const fullMatch = match;
            const playerName = match.replace(/<td class="player-name">([^<]+)<\/td>/, '$1');

            // Skip players who already have checkmarks
            if (playerName.includes('✅')) return;

            // If player doesn't have a checkmark, add X mark
            const scoredPlayer = weekScorers.find(scorer =>
              playerName.toLowerCase().includes(scorer.player.toLowerCase()) ||
              scorer.player.toLowerCase().includes(playerName.toLowerCase())
            );

            if (!scoredPlayer) {
              const updatedMatch = fullMatch.replace(playerName, `${playerName} ❌`);
              htmlContent = htmlContent.replace(fullMatch, updatedMatch);
            }
          });
        }

        // Calculate accuracy per tab
        const calculateTabAccuracy = (tabId: string): { correct: number, total: number, percentage: string } => {
          // Find the start of this tab
          const tabStart = htmlContent.indexOf(`<div id="${tabId}"`);
          if (tabStart === -1) return { correct: 0, total: 0, percentage: '0' };

          // Find the end (next tab or script section)
          let tabEnd = htmlContent.indexOf('<div id="', tabStart + 10);
          if (tabEnd === -1) {
            tabEnd = htmlContent.indexOf('<script>', tabStart);
          }
          if (tabEnd === -1) tabEnd = htmlContent.length;

          const tabContent = htmlContent.substring(tabStart, tabEnd);
          const total = (tabContent.match(/<td class="player-name">/g) || []).length;
          const correct = (tabContent.match(/✅/g) || []).length;
          const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

          return { correct, total, percentage: percentage.toString() };
        };

        // Calculate accuracy for each tab
        const currentStats = calculateTabAccuracy('traditional');
        const mlStats = calculateTabAccuracy('ml');
        const volumeStats = calculateTabAccuracy('volume');
        const combinedStats = calculateTabAccuracy('combined');
        const enhancedStats = calculateTabAccuracy('enhanced');

        // Add accuracy to each tab's model-info section
        // Traditional tab
        htmlContent = htmlContent.replace(
          /(<div id="traditional"[^>]*>[\s\S]*?<div class="model-info">[\s\S]*?<p><strong>Total Predictions:<\/strong> \d+<\/p>)/,
          `$1\n            <p><strong>Accuracy:</strong> ${currentStats.correct}/${currentStats.total} correct (${currentStats.percentage}%)</p>`
        );

        // ML tab
        htmlContent = htmlContent.replace(
          /(<div id="ml"[^>]*>[\s\S]*?<div class="model-info">[\s\S]*?<p><strong>Total Predictions:<\/strong> \d+<\/p>)/,
          `$1\n            <p><strong>Accuracy:</strong> ${mlStats.correct}/${mlStats.total} correct (${mlStats.percentage}%)</p>`
        );

        // Volume tab
        htmlContent = htmlContent.replace(
          /(<div id="volume"[^>]*>[\s\S]*?<div class="model-info">[\s\S]*?<p><strong>Total Predictions:<\/strong> \d+<\/p>)/,
          `$1\n            <p><strong>Accuracy:</strong> ${volumeStats.correct}/${volumeStats.total} correct (${volumeStats.percentage}%)</p>`
        );

        // Combined tab
        htmlContent = htmlContent.replace(
          /(<div id="combined"[^>]*>[\s\S]*?<div class="model-info">[\s\S]*?<p><strong>Total Predictions:<\/strong> \d+<\/p>)/,
          `$1\n            <p><strong>Accuracy:</strong> ${combinedStats.correct}/${combinedStats.total} correct (${combinedStats.percentage}%)</p>`
        );

        // Enhanced tab
        htmlContent = htmlContent.replace(
          /(<div id="enhanced"[^>]*>[\s\S]*?<div class="model-info">[\s\S]*?<p><strong>Total Predictions:<\/strong> \d+<\/p>)/,
          `$1\n            <p><strong>Accuracy:</strong> ${enhancedStats.correct}/${enhancedStats.total} correct (${enhancedStats.percentage}%)</p>`
        );

        // Don't add a global results header - results are shown in each tab instead

        fs.writeFileSync(allPredictionsFile, htmlContent);
        console.log(`✅ Updated ${allPredictionsFile} with results`);
      }
    }
  } catch (error) {
    console.error(`❌ Failed to update all-predictions file:`, error);
  }

  // Step 3: Auto-scrape volume data for next week
  console.log(`\n🤖 STEP 3: Auto-scraping volume data for Week ${nextWeek}...`);
  try {
    await execAsync(`npx tsx scripts/auto-scrape-volume-data.ts ${nextWeek}`);
    console.log(`✅ Week ${nextWeek} volume data auto-scraped successfully`);
  } catch (error) {
    console.error(`❌ Failed to auto-scrape Week ${nextWeek} volume data:`, error);
    console.log('You may need to run volume data entry manually for next week');
  }

  // Step 4: Generate predictions for next week (optional)
  console.log(`\n🔮 STEP 4: Generating predictions for Week ${nextWeek}...`);
  try {
    console.log('Generating Current model predictions...');
    await execAsync(`npx tsx scripts/generate-weekly-predictions.ts ${nextWeek} ${year}`);

    console.log('Generating ML model predictions...');
    await execAsync(`npx tsx scripts/generate-ml-predictions.ts ${nextWeek}`);

    console.log('Generating Volume model predictions...');
    await execAsync(`npx tsx scripts/generate-combined-predictions.ts ${nextWeek}`);

    console.log('Generating Enhanced model predictions...');
    await execAsync(`npx tsx scripts/generate-enhanced-predictions.ts ${nextWeek}`);

    console.log('Generating combined interface...');
    await execAsync(`npx tsx scripts/generate-combined-interface.ts ${nextWeek}`);

    console.log(`✅ Week ${nextWeek} predictions generated successfully`);
  } catch (error) {
    console.error(`❌ Failed to generate Week ${nextWeek} predictions:`, error);
    console.log('You can generate predictions manually later');
  }

  console.log('\n' + '=' .repeat(80));
  console.log('🎉 WORKFLOW COMPLETE!');
  console.log(`📊 Week ${week} results have been recorded with ✅/❌ marks`);
  console.log(`🤖 Week ${nextWeek} volume data has been auto-scraped`);
  console.log(`🔮 Week ${nextWeek} predictions are ready`);
  console.log(`📁 Check: data/week${nextWeek}-all-predictions.html`);
  console.log('=' .repeat(80));
}

main().catch(console.error);