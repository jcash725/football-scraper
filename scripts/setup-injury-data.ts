#!/usr/bin/env tsx
// Setup injury data for testing

import { InjuryChecker } from './lib/injury-checker.js';

async function main() {
  const [week] = [parseInt(process.argv[2])];

  if (!week) {
    console.log('Usage: npx tsx setup-injury-data.ts <week>');
    console.log('Example: npx tsx setup-injury-data.ts 4');
    process.exit(1);
  }

  console.log(`🏥 Setting up injury data for Week ${week}...\n`);

  const injuryChecker = new InjuryChecker();

  // Add mock injury data
  const mockReports = injuryChecker.getMockInjuryReports(week);
  injuryChecker.addInjuryReports(week, mockReports);

  // Generate injury report
  injuryChecker.generateInjuryReport(week);

  console.log(`\n💡 Injury data is now available for volume analysis`);
  console.log(`   Run: npx tsx generate-volume-html.ts ${week}`);
}

main().catch(console.error);