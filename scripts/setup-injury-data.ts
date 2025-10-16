#!/usr/bin/env tsx
// Setup injury data by fetching live data from ESPN API

import { InjuryTracker } from './lib/injury-tracker.js';

async function main() {
  const [week] = [parseInt(process.argv[2])];
  const season = 2025;

  if (!week) {
    console.log('Usage: npx tsx setup-injury-data.ts <week>');
    console.log('Example: npx tsx setup-injury-data.ts 4');
    process.exit(1);
  }

  console.log(`🏥 Fetching live injury data for Week ${week}...\n`);

  const injuryTracker = new InjuryTracker();

  try {
    // Fetch and save current injury data from ESPN API
    await injuryTracker.saveInjuryReport(week, season);

    console.log(`\n✅ Injury data successfully updated from ESPN API`);
    console.log(`   Week: ${week}`);
    console.log(`   Season: ${season}`);

    // Display injury report summary
    console.log(injuryTracker.getInjuryReport());

  } catch (error) {
    console.error('❌ Failed to fetch injury data:', error);
    console.log('\n⚠️ Consider using mock data as fallback');
    process.exit(1);
  }
}

main().catch(console.error);