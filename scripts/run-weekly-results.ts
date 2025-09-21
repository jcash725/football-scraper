#!/usr/bin/env tsx
// Command to run complete weekly results pipeline on demand

import { SimpleTouchdownTracker } from './lib/simple-touchdown-tracker.js';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

async function runWeeklyResults() {
  const week = parseInt(process.argv[2]);
  const year = parseInt(process.argv[3]);

  if (!week || !year) {
    console.log('Usage: npx tsx scripts/run-weekly-results.ts <week> <year>');
    console.log('Example: npx tsx scripts/run-weekly-results.ts 2 2025');
    process.exit(1);
  }

  console.log(`🏈 Running complete Weekly ${week} ${year} results pipeline...\n`);

  try {
    // Step 1: Collect touchdown data for the week
    console.log('📊 Step 1: Collecting touchdown data...');
    await runScript('collect-weekly-touchdowns.ts', [week.toString(), year.toString()]);

    // Step 2: Auto-record prediction results
    console.log('\n📝 Step 2: Recording prediction results...');
    await runScript('auto-record-results.ts', [week.toString(), year.toString()]);

    // Step 3: Update HTML predictions file if it exists
    const htmlFile = path.join(process.cwd(), 'data', `week${week}-predictions.html`);
    try {
      await fs.access(htmlFile);
      console.log('\n🎨 Step 3: Updating HTML results...');
      await updateHTMLResults(week, year, htmlFile);
    } catch {
      console.log(`\n⚠️  HTML file not found: ${htmlFile}`);
      console.log('   Skipping HTML update step.');
    }

    // Step 4: Display summary
    console.log('\n📋 Step 4: Results Summary');
    await displayResultsSummary(week, year);

    console.log('\n✅ Weekly results pipeline complete!');
    console.log(`💡 Check data/week${week}-predictions.html for visual results`);

  } catch (error) {
    console.error('❌ Pipeline failed:', error);
    process.exit(1);
  }
}

async function runScript(scriptName: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), 'scripts', scriptName);
    const child = spawn('npx', ['tsx', scriptPath, ...args], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script ${scriptName} exited with code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function updateHTMLResults(week: number, year: number, htmlFile: string): Promise<void> {
  // Load actual touchdown data
  const touchdownTracker = new SimpleTouchdownTracker();
  const touchdownData = touchdownTracker.loadTouchdownDatabase(year);

  if (!touchdownData) {
    console.log(`   ❌ No touchdown data found for ${year}`);
    return;
  }

  // Get week scorers
  const weekScorers = touchdownData.playerGameStats
    .filter((stat: any) => stat.week === week)
    .filter((stat: any) => stat.rushingTouchdowns > 0 || stat.receivingTouchdowns > 0);

  console.log(`   Found ${weekScorers.length} players who scored TDs in Week ${week}`);

  // Read HTML file
  let htmlContent = await fs.readFile(htmlFile, 'utf8');

  // Add results summary if not already present
  if (!htmlContent.includes('Results Summary')) {
    const summaryHTML = `
    <div class="results-summary">
      <h3>Week ${week} Results Summary</h3>
      <p>Updated: ${new Date().toLocaleDateString()}</p>
      <p>Total TD Scorers: ${weekScorers.length}</p>
    </div>`;

    htmlContent = htmlContent.replace('<body>', `<body>${summaryHTML}`);
    await fs.writeFile(htmlFile, htmlContent);
  }

  console.log(`   ✅ Updated ${htmlFile}`);
}

async function displayResultsSummary(week: number, year: number): Promise<void> {
  try {
    // Load prediction history
    const historyPath = path.join(process.cwd(), 'data', 'prediction-history.json');
    const history = JSON.parse(await fs.readFile(historyPath, 'utf8'));
    const weekData = history.weeks.find((w: any) => w.week === week && w.year === year);

    if (!weekData || !weekData.results) {
      console.log('   No recorded results found');
      return;
    }

    const results = weekData.results;
    const hits = results.filter((r: any) => r.scoredTD).length;
    const total = results.length;
    const hitRate = ((hits / total) * 100).toFixed(1);

    console.log(`   📊 Prediction Results: ${hits}/${total} (${hitRate}%)`);
    console.log(`   🎯 Top scorers who were predicted:`);

    results
      .filter((r: any) => r.scoredTD)
      .slice(0, 5)
      .forEach((r: any) => {
        console.log(`      ✅ ${r.player} (${r.team})`);
      });

  } catch (error) {
    console.log('   Could not load results summary');
  }
}

// Run if called directly
runWeeklyResults().catch(console.error);