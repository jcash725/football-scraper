#!/usr/bin/env tsx
// Enhanced player stats collector - captures volume metrics beyond just TDs

import fs from 'fs';
import path from 'path';

interface EnhancedPlayerStats {
  playerName: string;
  team: string;
  opponent: string;
  gameId: string;
  week: number;
  season: number;
  position: string;
  homeAway: 'home' | 'away';
  date: string;

  // Volume metrics
  rushingAttempts: number;
  rushingYards: number;
  rushingTouchdowns: number;
  targets: number;
  receptions: number;
  receivingYards: number;
  receivingTouchdowns: number;

  // Situational data
  redZoneTargets: number;
  redZoneCarries: number;
  goalLineTargets: number;
  goalLineCarries: number;
  snapCount: number;
  snapPercentage: number;

  // Team context
  teamPoints: number;
  teamTotalPlays: number;
  teamPassAttempts: number;
  teamRushAttempts: number;
  gameScript: 'leading' | 'trailing' | 'tied' | 'blowout';
}

interface EnhancedStatsDatabase {
  generatedAt: string;
  season: number;
  totalGames: number;
  playerGameStats: EnhancedPlayerStats[];
}

export class EnhancedPlayerStatsCollector {
  private baseUrl = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary';
  private dataDir = path.join(process.cwd(), 'data');

  constructor() {
    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  async fetchGameData(gameId: string): Promise<any> {
    const url = `${this.baseUrl}?event=${gameId}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch game ${gameId}:`, error);
      throw error;
    }
  }

  extractEnhancedPlayerStats(gameData: any): EnhancedPlayerStats[] {
    const stats: EnhancedPlayerStats[] = [];

    // Get game metadata
    const header = gameData.header;
    const competitions = header.competitions[0];
    const gameId = header.id;
    const season = header.season.year;
    const week = header.week;
    const date = competitions.date;

    // Get team info
    const homeTeamData = competitions.competitors.find((c: any) => c.homeAway === 'home');
    const awayTeamData = competitions.competitors.find((c: any) => c.homeAway === 'away');
    const homeTeam = homeTeamData?.team?.displayName || '';
    const awayTeam = awayTeamData?.team?.displayName || '';
    const homeScore = parseInt(homeTeamData?.score || '0');
    const awayScore = parseInt(awayTeamData?.score || '0');

    // Process both teams
    [homeTeamData, awayTeamData].forEach(teamData => {
      if (!teamData) return;

      const team = teamData.team.displayName;
      const opponent = team === homeTeam ? awayTeam : homeTeam;
      const homeAway = teamData.homeAway as 'home' | 'away';
      const teamScore = parseInt(teamData.score || '0');
      const opponentScore = team === homeTeam ? awayScore : homeScore;

      // Determine game script
      let gameScript: 'leading' | 'trailing' | 'tied' | 'blowout';
      const scoreDiff = teamScore - opponentScore;
      if (Math.abs(scoreDiff) >= 21) {
        gameScript = 'blowout';
      } else if (scoreDiff > 0) {
        gameScript = 'leading';
      } else if (scoreDiff < 0) {
        gameScript = 'trailing';
      } else {
        gameScript = 'tied';
      }

      // Get team statistics from ESPN API
      const teamStats = teamData.statistics || [];
      const teamPassAttempts = this.findStatValue(teamStats, 'passingAttempts') || 0;
      const teamRushAttempts = this.findStatValue(teamStats, 'rushingAttempts') || 0;
      const teamTotalPlays = teamPassAttempts + teamRushAttempts;

      // Process individual players (this is where we'd need to enhance ESPN API calls)
      // For now, we'll create a framework and populate with available data

      // Note: ESPN's summary endpoint may not have detailed player stats
      // We might need to use ESPN's detailed game endpoints or alternative sources

      // Placeholder for when we get access to detailed player stats
      // This would need to be populated from ESPN's roster/statistics endpoints
    });

    return stats;
  }

  private findStatValue(stats: any[], statName: string): number {
    const stat = stats.find(s => s.name === statName);
    return stat ? parseFloat(stat.displayValue) : 0;
  }

  async processGame(gameId: string): Promise<EnhancedPlayerStats[]> {
    console.log(`📊 Processing enhanced stats for game ${gameId}`);

    try {
      const gameData = await this.fetchGameData(gameId);
      const stats = this.extractEnhancedPlayerStats(gameData);

      // Display game info
      const header = gameData.header;
      const competitions = header.competitions[0];
      const homeTeam = competitions.competitors.find((c: any) => c.homeAway === 'home')?.team?.displayName || '';
      const awayTeam = competitions.competitors.find((c: any) => c.homeAway === 'away')?.team?.displayName || '';
      const homeScore = parseInt(competitions.competitors.find((c: any) => c.homeAway === 'home')?.score || '0');
      const awayScore = parseInt(competitions.competitors.find((c: any) => c.homeAway === 'away')?.score || '0');

      console.log(`   ${awayTeam} ${awayScore} - ${homeScore} ${homeTeam}`);
      console.log(`   📊 Enhanced stats for ${stats.length} players`);

      return stats;

    } catch (error) {
      console.error(`Failed to process enhanced stats for game ${gameId}:`, error);
      return [];
    }
  }

  async processMultipleGames(gameIds: string[]): Promise<void> {
    console.log(`🏈 Processing enhanced stats for ${gameIds.length} games\n`);

    const allStats: EnhancedPlayerStats[] = [];
    let season = 0;

    for (let i = 0; i < gameIds.length; i++) {
      const gameId = gameIds[i];
      console.log(`\n[${i + 1}/${gameIds.length}] Processing enhanced stats for game ${gameId}`);

      try {
        const stats = await this.processGame(gameId);
        allStats.push(...stats);

        if (stats.length > 0) {
          season = stats[0].season;
        }

        // Rate limiting
        if (i < gameIds.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

      } catch (error) {
        console.error(`❌ Failed to process enhanced stats for game ${gameId}`);
      }
    }

    // Save to database
    if (season > 0) {
      await this.saveEnhancedStatsDatabase(season, allStats);
    }

    console.log(`\n✅ Processed enhanced stats for ${gameIds.length} games with ${allStats.length} player records`);
  }

  async saveEnhancedStatsDatabase(season: number, newStats: EnhancedPlayerStats[]): Promise<void> {
    const fileName = `enhanced-player-stats-${season}.json`;
    const filePath = path.join(this.dataDir, fileName);

    let database: EnhancedStatsDatabase;

    // Load existing data or create new
    if (fs.existsSync(filePath)) {
      database = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } else {
      database = {
        generatedAt: new Date().toISOString(),
        season,
        totalGames: 0,
        playerGameStats: []
      };
    }

    // Add new stats (avoid duplicates)
    const existingGameIds = new Set(database.playerGameStats.map(s => s.gameId));
    const newGameStats = newStats.filter(stat => !existingGameIds.has(stat.gameId));

    database.playerGameStats.push(...newGameStats);
    database.generatedAt = new Date().toISOString();
    database.totalGames = new Set(database.playerGameStats.map(s => s.gameId)).size;

    // Write to file
    fs.writeFileSync(filePath, JSON.stringify(database, null, 2));

    console.log(`💾 Saved enhanced stats for ${newGameStats.length} new player records to ${fileName}`);
    console.log(`\n📊 Updated ${season} Enhanced Stats Database:`);
    console.log(`   Total Games: ${database.totalGames}`);
    console.log(`   Total Player Records: ${database.playerGameStats.length}`);
  }

  loadEnhancedStatsDatabase(season: number): EnhancedStatsDatabase | null {
    const fileName = `enhanced-player-stats-${season}.json`;
    const filePath = path.join(this.dataDir, fileName);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  getPlayerVolumeStats(playerName: string, week: number, season: number): EnhancedPlayerStats | null {
    const database = this.loadEnhancedStatsDatabase(season);
    if (!database) return null;

    return database.playerGameStats.find(stat => {
      const nameMatch = stat.playerName.toLowerCase().includes(playerName.toLowerCase());
      const weekMatch = stat.week === week;
      return nameMatch && weekMatch;
    }) || null;
  }

  getPlayerWeeklyTrends(playerName: string, season: number): EnhancedPlayerStats[] {
    const database = this.loadEnhancedStatsDatabase(season);
    if (!database) return [];

    return database.playerGameStats
      .filter(stat => stat.playerName.toLowerCase().includes(playerName.toLowerCase()))
      .sort((a, b) => a.week - b.week);
  }
}