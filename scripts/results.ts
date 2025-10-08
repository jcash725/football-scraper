#!/usr/bin/env tsx
// Simple results command - just run "npx tsx scripts/results.ts 5" for Week 5 results

import { exec } from 'child_process';

const week = parseInt(process.argv[2]);
const year = 2025; // Default to current season

if (!week) {
  console.log('Usage: npx tsx scripts/results.ts <week>');
  console.log('Example: npx tsx scripts/results.ts 5');
  console.log('');
  console.log('This will:');
  console.log('1. Record Week 5 results with ✅/❌ marks');
  console.log('2. Auto-scrape volume data for Week 6');
  console.log('3. Generate Week 6 predictions');
  process.exit(1);
}

console.log(`🚀 Processing Week ${week} results and preparing Week ${week + 1}...`);

// Run the comprehensive results processor
exec(`npx tsx scripts/process-weekly-results.ts ${week} ${year}`, (error, stdout, stderr) => {
  if (stdout) console.log(stdout);
  if (stderr) console.error(stderr);
  if (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
});