#!/usr/bin/env tsx
// Complete prediction workflow with automated data scraping

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runCommand(command: string, description: string): Promise<void> {
  console.log(`🔄 ${description}...`);
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    console.log(`✅ ${description} complete\n`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error);
    throw error;
  }
}

async function main() {
  const [week] = [parseInt(process.argv[2])];

  if (!week) {
    console.log('Usage: npx tsx generate-predictions-with-auto-scraping.ts <week>');
    console.log('Example: npx tsx generate-predictions-with-auto-scraping.ts 4');
    process.exit(1);
  }

  console.log(`🏈 Complete Prediction Workflow for Week ${week}`);
  console.log('=' .repeat(60));
  console.log('🤖 Automated: Scraping → Injury Check → Predictions → HTML\n');

  try {
    // Step 1: Auto-scrape current volume data
    await runCommand(
      `npx tsx scripts/auto-scrape-volume-data.ts ${week}`,
      'Auto-scraping volume data'
    );

    // Step 2: Update injury reports
    await runCommand(
      `npx tsx scripts/setup-injury-data.ts ${week}`,
      'Updating injury reports'
    );

    // Step 3: Generate enhanced predictions
    await runCommand(
      `npx tsx scripts/enhanced-predictions.ts ${week}`,
      'Generating enhanced predictions'
    );

    // Step 4: Create HTML report
    await runCommand(
      `npx tsx scripts/generate-volume-html.ts ${week}`,
      'Creating HTML report'
    );

    console.log('🎉 COMPLETE PREDICTION WORKFLOW FINISHED!');
    console.log('=' .repeat(60));
    console.log(`📊 Results available in: data/week${week}-volume-analysis.html`);
    console.log(`🤖 Data was automatically scraped from live sources`);
    console.log(`🏥 Injury status checked and filtered`);
    console.log(`🎯 Volume-based predictions generated`);

  } catch (error) {
    console.error('❌ Workflow failed:', error);
    console.log('\n💡 You can run individual steps manually:');
    console.log(`   1. npx tsx scripts/auto-scrape-volume-data.ts ${week}`);
    console.log(`   2. npx tsx scripts/setup-injury-data.ts ${week}`);
    console.log(`   3. npx tsx scripts/enhanced-predictions.ts ${week}`);
    console.log(`   4. npx tsx scripts/generate-volume-html.ts ${week}`);
    process.exit(1);
  }
}

main().catch(console.error);