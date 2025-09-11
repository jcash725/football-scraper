#!/usr/bin/env tsx
// Fetch current week's NFL matchups from ESPN API

import fs from 'fs';
import path from 'path';

interface ESPNGame {
  id: string;
  date: string;
  competitions: Array<{
    competitors: Array<{
      team: {
        displayName: string;
        abbreviation: string;
      };
      homeAway: 'home' | 'away';
    }>;
  }>;
}

interface Matchup {
  away_team: string;
  home_team: string;
  date: string;
  time: string;
  gameId: string;
}

async function fetchWeekMatchups(week: number, year: number): Promise<Matchup[]> {
  console.log(`🏈 Fetching Week ${week} ${year} matchups from ESPN...`);
  
  const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week=${week}&year=${year}`;
  console.log(`📡 URL: ${url}`);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.events || !Array.isArray(data.events)) {
      throw new Error('No events found in ESPN response');
    }
    
    console.log(`📅 Found ${data.events.length} games for Week ${week}`);
    
    const matchups: Matchup[] = data.events.map((event: ESPNGame) => {
      const competition = event.competitions[0];
      const competitors = competition.competitors;
      
      const homeTeam = competitors.find(c => c.homeAway === 'home');
      const awayTeam = competitors.find(c => c.homeAway === 'away');
      
      if (!homeTeam || !awayTeam) {
        throw new Error(`Invalid game data for game ${event.id}`);
      }
      
      // Parse date for display
      const gameDate = new Date(event.date);
      const dateStr = gameDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
      const timeStr = gameDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        timeZoneName: 'short'
      });
      
      return {
        away_team: awayTeam.team.displayName,
        home_team: homeTeam.team.displayName,
        date: dateStr,
        time: timeStr,
        gameId: event.id
      };
    });
    
    return matchups;
    
  } catch (error) {
    console.error('Error fetching matchups:', error);
    throw error;
  }
}

async function main() {
  const [week, year] = [parseInt(process.argv[2]) || 2, parseInt(process.argv[3]) || 2025];
  
  console.log(`🔄 Fetching current Week ${week} ${year} matchups...`);
  
  try {
    const matchups = await fetchWeekMatchups(week, year);
    
    const outputData = {
      url: `ESPN API Week ${week} ${year}`,
      scrapedAt: new Date().toISOString(),
      note: `Found ${matchups.length} matchups for Week ${week} ${year}`,
      week,
      year,
      columns: ['away_team', 'home_team', 'date', 'time', 'gameId'],
      rows: matchups
    };
    
    // Save to data directory
    const outputPath = path.join(process.cwd(), 'data', 'weekly-matchups.json');
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    
    console.log(`✅ Saved ${matchups.length} Week ${week} matchups to ${outputPath}`);
    console.log('\\n📊 Matchups:');
    matchups.forEach((matchup, i) => {
      console.log(`   ${i + 1}. ${matchup.away_team} @ ${matchup.home_team} (${matchup.date} ${matchup.time})`);
    });
    
  } catch (error) {
    console.error('❌ Failed to fetch matchups:', error);
    process.exit(1);
  }
}

// Run if called directly
main().catch(console.error);