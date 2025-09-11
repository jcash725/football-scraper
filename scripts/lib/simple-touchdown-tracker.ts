// Simplified touchdown tracking for ML predictions
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

export interface PlayerGameStats {
  playerName: string;
  team: string;
  opponent: string;
  gameId: string;
  week: number;
  season: number;
  rushingTouchdowns: number;
  receivingTouchdowns: number;
  homeAway: 'home' | 'away';
  date: string;
}

export interface TouchdownDatabase {
  generatedAt: string;
  season: number;
  totalGames: number;
  playerGameStats: PlayerGameStats[];
}

export class SimpleTouchdownTracker {
  private readonly baseUrl = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary';
  private readonly dataDir: string;
  
  constructor(dataDir: string = 'data') {
    this.dataDir = dataDir;
    this.ensureDataDirectory();
  }
  
  private ensureDataDirectory(): void {
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
      console.error(`Error fetching game ${gameId}:`, error);
      throw error;
    }
  }
  
  extractPlayerStats(gameData: any): PlayerGameStats[] {
    const stats: PlayerGameStats[] = [];
    
    // Get game metadata
    const header = gameData.header;
    const competitions = header.competitions[0];
    const gameId = header.id;
    const season = header.season.year;
    const week = header.week;
    const date = competitions.date;
    
    const homeTeam = competitions.competitors.find((c: any) => c.homeAway === 'home')?.team?.displayName || '';
    const awayTeam = competitions.competitors.find((c: any) => c.homeAway === 'away')?.team?.displayName || '';
    
    if (!gameData.scoringPlays || !Array.isArray(gameData.scoringPlays)) {
      return stats;
    }
    
    // Process each touchdown
    gameData.scoringPlays.forEach((play: any) => {
      if (play.scoringType?.name?.toLowerCase() !== 'touchdown') {
        return;
      }
      
      const playText = play.text || '';
      const scoringTeam = play.team?.displayName || '';
      
      // Determine opponent
      const opponent = scoringTeam === homeTeam ? awayTeam : homeTeam;
      const homeAway = scoringTeam === homeTeam ? 'home' : 'away';
      
      // Extract player and touchdown type
      let playerName = '';
      let isReceiving = false;
      let isRushing = false;
      
      // Check touchdown type
      if (play.type?.text?.toLowerCase().includes('passing')) {
        isReceiving = true;
        // Format: "PlayerName X Yd pass from QB"
        const match = playText.match(/^([^0-9]+?)\s+\d+\s+Yd\s+pass/);
        if (match) {
          playerName = match[1].trim();
        }
      } else if (play.type?.text?.toLowerCase().includes('rushing')) {
        isRushing = true;
        // Format: "PlayerName X Yd Rush" or "PlayerName X Yd Run"
        const match = playText.match(/^([^0-9]+?)\s+\d+\s+Yd\s+(Rush|Run)/);
        if (match) {
          playerName = match[1].trim();
        }
      }
      
      if (playerName) {
        // Find existing player stat or create new one
        let playerStat = stats.find(s => 
          s.playerName === playerName && 
          s.team === scoringTeam && 
          s.opponent === opponent
        );
        
        if (!playerStat) {
          playerStat = {
            playerName,
            team: scoringTeam,
            opponent,
            gameId,
            week,
            season,
            rushingTouchdowns: 0,
            receivingTouchdowns: 0,
            homeAway: homeAway as 'home' | 'away',
            date
          };
          stats.push(playerStat);
        }
        
        // Increment touchdown counts
        if (isReceiving) {
          playerStat.receivingTouchdowns++;
        } else if (isRushing) {
          playerStat.rushingTouchdowns++;
        }
      }
    });
    
    return stats;
  }
  
  async processGame(gameId: string): Promise<PlayerGameStats[]> {
    console.log(`📡 Processing game ${gameId}`);
    
    try {
      const gameData = await this.fetchGameData(gameId);
      const stats = this.extractPlayerStats(gameData);
      
      // Display game info
      const header = gameData.header;
      const competitions = header.competitions[0];
      const homeTeam = competitions.competitors.find((c: any) => c.homeAway === 'home')?.team?.displayName || '';
      const awayTeam = competitions.competitors.find((c: any) => c.homeAway === 'away')?.team?.displayName || '';
      const homeScore = parseInt(competitions.competitors.find((c: any) => c.homeAway === 'home')?.score || '0');
      const awayScore = parseInt(competitions.competitors.find((c: any) => c.homeAway === 'away')?.score || '0');
      
      console.log(`   ${awayTeam} ${awayScore} - ${homeScore} ${homeTeam}`);
      console.log(`   🎯 ${stats.length} players with TDs`);
      
      if (stats.length > 0) {
        stats.forEach(stat => {
          const rushing = stat.rushingTouchdowns > 0 ? `${stat.rushingTouchdowns} rush` : '';
          const receiving = stat.receivingTouchdowns > 0 ? `${stat.receivingTouchdowns} rec` : '';
          const tdString = [rushing, receiving].filter(s => s).join(', ');
          console.log(`      • ${stat.playerName} (${stat.team}): ${tdString}`);
        });
      }
      
      return stats;
      
    } catch (error) {
      console.error(`Failed to process game ${gameId}:`, error);
      return [];
    }
  }
  
  async processMultipleGames(gameIds: string[]): Promise<void> {
    console.log(`🏈 Processing ${gameIds.length} games for touchdown data\n`);
    
    const allStats: PlayerGameStats[] = [];
    let season = 0;
    
    for (let i = 0; i < gameIds.length; i++) {
      const gameId = gameIds[i];
      console.log(`\n[${i + 1}/${gameIds.length}] Processing game ${gameId}`);
      
      try {
        const stats = await this.processGame(gameId);
        allStats.push(...stats);
        
        if (stats.length > 0) {
          season = stats[0].season; // Get season from first stat
        }
        
        // Rate limiting - wait between requests
        if (i < gameIds.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.error(`❌ Failed to process game ${gameId}`);
      }
    }
    
    // Save to database
    if (allStats.length > 0 && season > 0) {
      await this.saveTouchdownDatabase(season, allStats);
    }
    
    console.log(`\n✅ Processed ${gameIds.length} games with ${allStats.length} touchdown performances`);
  }
  
  async saveTouchdownDatabase(season: number, newStats: PlayerGameStats[]): Promise<void> {
    const fileName = `touchdown-history-${season}.json`;
    const filePath = path.join(this.dataDir, fileName);
    
    let database: TouchdownDatabase;
    
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
    
    // Remove duplicates and add new stats
    const existingPlayerGameKeys = new Set(
      database.playerGameStats.map(s => `${s.playerName}|${s.gameId}|${s.team}`)
    );
    const newGameStats = newStats.filter(s => 
      !existingPlayerGameKeys.has(`${s.playerName}|${s.gameId}|${s.team}`)
    );
    
    database.playerGameStats.push(...newGameStats);
    database.totalGames = new Set(database.playerGameStats.map(s => s.gameId)).size;
    database.generatedAt = new Date().toISOString();
    
    // Save to file
    fs.writeFileSync(filePath, JSON.stringify(database, null, 2));
    
    console.log(`💾 Saved ${newGameStats.length} new touchdown performances to ${fileName}`);
  }
  
  loadTouchdownDatabase(season: number): TouchdownDatabase | null {
    const fileName = `touchdown-history-${season}.json`;
    const filePath = path.join(this.dataDir, fileName);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  
  getPlayerTouchdownsVsOpponent(playerName: string, opponent: string, season: number): PlayerGameStats[] {
    const database = this.loadTouchdownDatabase(season);
    if (!database) return [];
    
    return database.playerGameStats.filter(stat => {
      const nameMatch = stat.playerName.toLowerCase().includes(playerName.toLowerCase());
      const opponentMatch = stat.opponent.toLowerCase().includes(opponent.toLowerCase());
      return nameMatch && opponentMatch;
    });
  }
  
}