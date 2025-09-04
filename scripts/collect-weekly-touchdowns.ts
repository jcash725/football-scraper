// Collect touchdown data from completed NFL week
import { SimpleTouchdownTracker } from './lib/simple-touchdown-tracker.js';

async function collectWeeklyTouchdowns() {
  const week = parseInt(process.argv[2]);
  const year = parseInt(process.argv[3]);
  
  if (!week || !year) {
    console.log('Usage: npx tsx scripts/collect-weekly-touchdowns.ts <week> <year>');
    console.log('Example: npx tsx scripts/collect-weekly-touchdowns.ts 1 2025');
    process.exit(1);
  }
  
  console.log(`🏈 Collecting touchdown data for Week ${week} ${year}...\n`);
  
  // Get game IDs for the specified week from ESPN API
  const gameIds = await getWeekGameIds(week, year);
  
  if (gameIds.length === 0) {
    console.log(`❌ No games found for Week ${week} ${year}`);
    process.exit(1);
  }
  
  console.log(`📅 Found ${gameIds.length} games for Week ${week}`);
  
  // Process the games
  const tracker = new SimpleTouchdownTracker();
  await tracker.processMultipleGames(gameIds);
  
  // Show summary
  const database = tracker.loadTouchdownDatabase(year);
  if (database) {
    console.log(`\n📊 Updated ${year} Database:`);
    console.log(`   Total Games: ${database.totalGames}`);
    console.log(`   Total TD Performances: ${database.playerGameStats.length}`);
    
    // Show this week's TDs
    const thisWeekTDs = database.playerGameStats.filter(stat => 
      gameIds.includes(stat.gameId)
    );
    
    if (thisWeekTDs.length > 0) {
      console.log(`\n🎯 Week ${week} Touchdowns (${thisWeekTDs.length} performances):`);
      thisWeekTDs.forEach(stat => {
        const rushing = stat.rushingTouchdowns > 0 ? `${stat.rushingTouchdowns} rush` : '';
        const receiving = stat.receivingTouchdowns > 0 ? `${stat.receivingTouchdowns} rec` : '';
        const tdString = [rushing, receiving].filter(s => s).join(', ');
        console.log(`   ${stat.playerName} (${stat.team} vs ${stat.opponent}): ${tdString}`);
      });
    }
  }
  
  console.log('\n✅ Weekly touchdown data collection complete!');
  console.log('💡 Next: Record prediction results with record-weekly-results.ts');
}

async function getWeekGameIds(week: number, year: number): Promise<string[]> {
  const baseUrl = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';
  
  try {
    const url = `${baseUrl}?seasontype=2&week=${week}&year=${year}`;
    console.log(`📡 Fetching games from: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data: any = await response.json();
    
    if (!data.events || !Array.isArray(data.events)) {
      return [];
    }
    
    return data.events.map((event: any) => event.id);
    
  } catch (error) {
    console.error(`Error fetching week ${week} games:`, error);
    return [];
  }
}

collectWeeklyTouchdowns().catch(error => {
  console.error('❌ Collection failed:', error);
  process.exit(1);
});