#!/usr/bin/env tsx
// Collect weekly volume statistics for players

import { EnhancedPlayerStatsCollector } from './lib/enhanced-player-stats-collector.js';

async function main() {
  const [week, year] = [parseInt(process.argv[2]), parseInt(process.argv[3])];

  if (!week || !year) {
    console.log('Usage: npx tsx collect-weekly-volume-stats.ts <week> <year>');
    console.log('Example: npx tsx collect-weekly-volume-stats.ts 3 2025');
    process.exit(1);
  }

  console.log(`🏈 Collecting volume stats for Week ${week} ${year}...\n`);

  try {
    // Fetch games for the week
    const scoreBoardUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week=${week}&year=${year}`;
    console.log(`📡 Fetching games from: ${scoreBoardUrl}`);

    const response = await fetch(scoreBoardUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch games: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.events || !Array.isArray(data.events)) {
      throw new Error('No games found for this week');
    }

    console.log(`📅 Found ${data.events.length} games for Week ${week}`);

    // Extract game IDs
    const gameIds = data.events.map((event: any) => event.id);

    // Collect enhanced stats
    const collector = new EnhancedPlayerStatsCollector();
    await collector.processMultipleGames(gameIds);

    console.log(`\n✅ Volume stats collection complete for Week ${week} ${year}!`);
    console.log(`💡 Data saved to: data/enhanced-player-stats-${year}.json`);

  } catch (error) {
    console.error('❌ Failed to collect volume stats:', error);
    process.exit(1);
  }
}

main().catch(console.error);