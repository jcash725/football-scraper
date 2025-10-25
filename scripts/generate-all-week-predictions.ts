#!/usr/bin/env tsx
// Generate all prediction models for a given week

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function main() {
  const week = parseInt(process.argv[2]);

  if (!week) {
    console.log('Usage: npx tsx generate-all-week-predictions.ts <week>');
    console.log('Example: npx tsx generate-all-week-predictions.ts 8');
    process.exit(1);
  }

  console.log(`🏈 Generating all predictions for Week ${week}...\n`);

  try {
    console.log('🗓️  Step 0: Fetching latest player stats and matchups...');
    await execAsync(`npx tsx scripts/scrape-teamrankings.ts`);
    await execAsync(`npx tsx scripts/fetch-current-matchups.ts ${week} 2025`);
    console.log('✅ Data fetched\n');

    console.log('📊 Step 1: Generating Current + ML models...');
    await execAsync('npx tsx scripts/analyze-td-bets.ts');
    await execAsync(`npx tsx scripts/generate-weekly-predictions.ts ${week} 2025`);
    console.log('✅ Current + ML models complete\n');

    console.log('📈 Step 2: Generating Volume (Combined) model...');
    await execAsync(`npx tsx scripts/generate-combined-predictions.ts ${week}`);
    console.log('✅ Volume model complete\n');

    console.log('🚀 Step 3: Generating Enhanced model...');
    await execAsync(`npx tsx scripts/generate-enhanced-predictions.ts ${week}`);
    console.log('✅ Enhanced model complete\n');

    console.log('🎯 Step 4: Generating combined interface...');
    await execAsync(`npx tsx scripts/generate-combined-interface.ts ${week}`);
    console.log('✅ Combined interface complete\n');

    console.log('=' .repeat(60));
    console.log('🎉 ALL PREDICTIONS GENERATED!');
    console.log(`📁 View at: data/week${week}-all-predictions.html`);
    console.log('=' .repeat(60));
  } catch (error) {
    console.error('❌ Error generating predictions:', error);
    process.exit(1);
  }
}

main().catch(console.error);
