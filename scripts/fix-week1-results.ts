#!/usr/bin/env tsx
// Fix Week 1 results by manually correcting based on actual touchdown scorers

import { PredictionTracker } from './lib/prediction-tracker.js';

async function main() {
  console.log('🔧 Fixing Week 1 results with correct touchdown scorers...');
  
  // Based on actual Week 1 games, these players scored TDs:
  const week1ActualScorers = [
    // Eagles vs Cowboys
    { player: 'Jalen Hurts', team: 'Philadelphia Eagles', scoredTD: true }, // 2 rushing TDs
    { player: 'Saquon Barkley', team: 'Philadelphia Eagles', scoredTD: true }, // 1 rushing TD
    
    // Ravens vs Bills  
    { player: 'Derrick Henry', team: 'Baltimore Ravens', scoredTD: true }, // 2 rushing TDs
    { player: 'Lamar Jackson', team: 'Baltimore Ravens', scoredTD: true }, // 1 rushing TD
    { player: 'Zay Flowers', team: 'Baltimore Ravens', scoredTD: true }, // 1 receiving TD
    { player: 'DeAndre Hopkins', team: 'Baltimore Ravens', scoredTD: true }, // 1 receiving TD (KC now)
    { player: 'Josh Allen', team: 'Buffalo Bills', scoredTD: true }, // 2 rushing TDs
    { player: 'James Cook', team: 'Buffalo Bills', scoredTD: true }, // 1 rushing TD
    { player: 'Dalton Kincaid', team: 'Buffalo Bills', scoredTD: true }, // 1 receiving TD
    { player: 'Keon Coleman', team: 'Buffalo Bills', scoredTD: true }, // 1 receiving TD
    
    // Other confirmed scorers from existing data
    { player: 'Keenan Allen', team: 'Los Angeles Chargers', scoredTD: true },
    { player: 'Justin Jefferson', team: 'Minnesota Vikings', scoredTD: true },
    { player: 'Courtland Sutton', team: 'Denver Broncos', scoredTD: true },
    { player: 'Zach Ertz', team: 'Washington Commanders', scoredTD: true },
    { player: 'Jonnu Smith', team: 'Pittsburgh Steelers', scoredTD: true }, // Note: Was on Steelers, not Miami
    
    // Players who did NOT score (examples from our predictions)
    { player: 'Brian Thomas Jr.', team: 'Jacksonville Jaguars', scoredTD: false },
    { player: 'Mike Evans', team: 'Tampa Bay Buccaneers', scoredTD: false },
    { player: 'Terry McLaurin', team: 'Washington Commanders', scoredTD: false },
    { player: "Ja'Marr Chase", team: 'Cincinnati Bengals', scoredTD: false },
    { player: 'DeVonta Smith', team: 'Philadelphia Eagles', scoredTD: false },
    { player: 'A.J. Brown', team: 'Philadelphia Eagles', scoredTD: false },
    { player: 'Drake London', team: 'Atlanta Falcons', scoredTD: false },
    { player: 'Mark Andrews', team: 'Baltimore Ravens', scoredTD: false },
    { player: 'Rashod Bateman', team: 'Baltimore Ravens', scoredTD: false },
    { player: 'Amon-Ra St. Brown', team: 'Detroit Lions', scoredTD: false },
    { player: 'Jahmyr Gibbs', team: 'Detroit Lions', scoredTD: false },
    { player: 'Kyren Williams', team: 'Los Angeles Rams', scoredTD: false }
  ];
  
  console.log(`📝 Correcting results for ${week1ActualScorers.length} players...`);
  
  const predictionTracker = new PredictionTracker();
  
  // Record corrected results
  predictionTracker.recordActualResults(1, 2025, week1ActualScorers);
  
  console.log('✅ Week 1 results corrected!');
  console.log('📊 Updated accuracy should now reflect actual touchdown scorers');
  
  // Show corrected summary
  const report = predictionTracker.getWeeklyReport(1, 2025);
  console.log(report);
}

// Run if called directly
main().catch(console.error);