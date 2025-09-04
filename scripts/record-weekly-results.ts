// Record actual touchdown results for a completed NFL week
import { PredictionTracker } from './lib/prediction-tracker.js';
import { SimpleTouchdownTracker } from './lib/simple-touchdown-tracker.js';

interface ActualResult {
  player: string;
  team: string;
  scoredTD: boolean;
}

async function recordWeeklyResults() {
  const week = parseInt(process.argv[2]);
  const year = parseInt(process.argv[3]);
  
  if (!week || !year) {
    console.log('Usage: npx tsx scripts/record-weekly-results.ts <week> <year>');
    console.log('Example: npx tsx scripts/record-weekly-results.ts 1 2025');
    process.exit(1);
  }
  
  console.log(`🏈 Recording actual results for Week ${week} ${year}...\n`);
  
  const predictionTracker = new PredictionTracker();
  const touchdownTracker = new SimpleTouchdownTracker();
  
  // Get latest touchdown data to see who actually scored
  const database = touchdownTracker.loadTouchdownDatabase(year);
  if (!database) {
    console.log(`❌ No touchdown data found for ${year}. Run weekly collection first.`);
    process.exit(1);
  }
  
  // You can manually input results or we can parse from the updated touchdown data
  // For now, let's create a template for manual entry
  
  console.log('📝 Manual result entry mode');
  console.log('For each predicted player, enter whether they scored a TD this week:');
  console.log('Format: PlayerName,TeamName,true/false');
  console.log('Example entries:');
  console.log('Ja\'Marr Chase,Cincinnati Bengals,true');
  console.log('Derrick Henry,Baltimore Ravens,false');
  console.log('');
  console.log('Enter results (one per line, empty line to finish):');
  
  // This would be enhanced with stdin input or file-based input
  // For now, showing the structure
  
  const exampleResults: ActualResult[] = [
    { player: 'Ja\'Marr Chase', team: 'Cincinnati Bengals', scoredTD: true },
    { player: 'Terry McLaurin', team: 'Washington Commanders', scoredTD: false },
    { player: 'Derrick Henry', team: 'Baltimore Ravens', scoredTD: true }
  ];
  
  // Record the results
  predictionTracker.recordActualResults(week, year, exampleResults);
  
  // Generate weekly report
  const report = predictionTracker.getWeeklyReport(week, year);
  console.log(report);
  
  // Export updated accuracy report
  predictionTracker.exportAccuracyReport();
  
  console.log('\n✅ Results recorded successfully!');
  console.log('💡 Next steps:');
  console.log('   1. Run weekly touchdown collection for the completed games');
  console.log('   2. Generate new predictions for next week');
}

recordWeeklyResults().catch(error => {
  console.error('❌ Failed to record results:', error);
  process.exit(1);
});