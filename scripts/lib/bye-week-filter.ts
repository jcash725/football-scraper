#!/usr/bin/env tsx
// Bye week filtering utility

import fs from 'fs';
import path from 'path';

interface Matchup {
  away_team: string;
  home_team: string;
  date: string;
  time: string;
}

interface WeeklyMatchups {
  rows: Matchup[];
}

export class ByeWeekFilter {
  private playingTeams: Set<string> = new Set();
  private byeTeams: Set<string> = new Set();

  constructor() {
    this.loadMatchups();
  }

  private loadMatchups() {
    try {
      const matchupsFile = path.join(process.cwd(), 'data', 'weekly-matchups.json');
      if (fs.existsSync(matchupsFile)) {
        const data: WeeklyMatchups = JSON.parse(fs.readFileSync(matchupsFile, 'utf8'));

        // Extract all teams playing this week
        data.rows.forEach(matchup => {
          this.playingTeams.add(this.normalizeTeamName(matchup.away_team));
          this.playingTeams.add(this.normalizeTeamName(matchup.home_team));
        });

        // Identify bye week teams (all 32 teams minus playing teams)
        const allTeams = [
          'Arizona Cardinals', 'Atlanta Falcons', 'Baltimore Ravens', 'Buffalo Bills',
          'Carolina Panthers', 'Chicago Bears', 'Cincinnati Bengals', 'Cleveland Browns',
          'Dallas Cowboys', 'Denver Broncos', 'Detroit Lions', 'Green Bay Packers',
          'Houston Texans', 'Indianapolis Colts', 'Jacksonville Jaguars', 'Kansas City Chiefs',
          'Las Vegas Raiders', 'Los Angeles Chargers', 'Los Angeles Rams', 'Miami Dolphins',
          'Minnesota Vikings', 'New England Patriots', 'New Orleans Saints', 'New York Giants',
          'New York Jets', 'Philadelphia Eagles', 'Pittsburgh Steelers', 'San Francisco 49ers',
          'Seattle Seahawks', 'Tampa Bay Buccaneers', 'Tennessee Titans', 'Washington Commanders'
        ];

        allTeams.forEach(team => {
          if (!this.playingTeams.has(team)) {
            this.byeTeams.add(team);
          }
        });

        console.log(`🏈 Bye Week Filter loaded:`);
        console.log(`   • Playing teams: ${this.playingTeams.size}`);
        console.log(`   • Bye week teams: ${Array.from(this.byeTeams).join(', ')}`);
      }
    } catch (error) {
      console.warn('Could not load matchups for bye week filtering:', error);
    }
  }

  private normalizeTeamName(teamName: string): string {
    // Normalize team names to match various formats
    const teamMappings: { [key: string]: string } = {
      'Arizona': 'Arizona Cardinals',
      'Atlanta': 'Atlanta Falcons',
      'Baltimore': 'Baltimore Ravens',
      'Buffalo': 'Buffalo Bills',
      'Carolina': 'Carolina Panthers',
      'Chicago': 'Chicago Bears',
      'Cincinnati': 'Cincinnati Bengals',
      'Cleveland': 'Cleveland Browns',
      'Dallas': 'Dallas Cowboys',
      'Denver': 'Denver Broncos',
      'Detroit': 'Detroit Lions',
      'Green Bay': 'Green Bay Packers',
      'Houston': 'Houston Texans',
      'Indianapolis': 'Indianapolis Colts',
      'Jacksonville': 'Jacksonville Jaguars',
      'Kansas City': 'Kansas City Chiefs',
      'Las Vegas': 'Las Vegas Raiders',
      'LA Chargers': 'Los Angeles Chargers',
      'LA Rams': 'Los Angeles Rams',
      'Miami': 'Miami Dolphins',
      'Minnesota': 'Minnesota Vikings',
      'New England': 'New England Patriots',
      'New Orleans': 'New Orleans Saints',
      'NY Giants': 'New York Giants',
      'NY Jets': 'New York Jets',
      'Philadelphia': 'Philadelphia Eagles',
      'Pittsburgh': 'Pittsburgh Steelers',
      'San Francisco': 'San Francisco 49ers',
      'Seattle': 'Seattle Seahawks',
      'Tampa Bay': 'Tampa Bay Buccaneers',
      'Tennessee': 'Tennessee Titans',
      'Washington': 'Washington Commanders'
    };

    return teamMappings[teamName] || teamName;
  }

  isTeamOnBye(teamName: string): boolean {
    const normalizedName = this.normalizeTeamName(teamName);
    return this.byeTeams.has(normalizedName);
  }

  isTeamPlaying(teamName: string): boolean {
    const normalizedName = this.normalizeTeamName(teamName);
    return this.playingTeams.has(normalizedName);
  }

  getByeTeams(): string[] {
    return Array.from(this.byeTeams);
  }

  getPlayingTeams(): string[] {
    return Array.from(this.playingTeams);
  }

  filterPlayers<T extends { team?: string; Team?: string }>(players: T[]): T[] {
    return players.filter(player => {
      const teamName = player.team || player.Team || '';
      if (!teamName) return true; // Keep players without team info

      const isPlaying = this.isTeamPlaying(teamName);
      if (!isPlaying) {
        console.log(`🚫 Filtered out ${(player as any).playerName || (player as any).Player || 'Unknown'} (${teamName}) - on bye week`);
      }
      return isPlaying;
    });
  }
}