// ESPN Game Data Fetcher and Touchdown Parser
import fetch from 'node-fetch';

export interface TouchdownPlay {
  gameId: string;
  season: number;
  week: number;
  gameType: 'regular' | 'postseason';
  date: string;
  homeTeam: string;
  awayTeam: string;
  quarter: number;
  timeRemaining: string;
  playerId: string;
  playerName: string;
  playerPosition: string;
  team: string;
  touchdownType: 'rushing' | 'receiving' | 'passing';
  yards: number;
  playDescription: string;
  homeScore: number;
  awayScore: number;
}

export interface GameMetadata {
  gameId: string;
  season: number;
  week: number;
  gameType: 'regular' | 'postseason';
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  venue: string;
}

export class ESPNGameFetcher {
  private readonly baseUrl = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary';
  
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
  
  extractGameMetadata(gameData: any): GameMetadata {
    const header = gameData.header;
    const competitions = header.competitions[0];
    
    return {
      gameId: gameData.header.id,
      season: header.season.year,
      week: header.week,
      gameType: header.season.type === 2 ? 'regular' : 'postseason',
      date: competitions.date,
      homeTeam: competitions.competitors.find((c: any) => c.homeAway === 'home')?.team?.displayName || '',
      awayTeam: competitions.competitors.find((c: any) => c.homeAway === 'away')?.team?.displayName || '',
      homeScore: parseInt(competitions.competitors.find((c: any) => c.homeAway === 'home')?.score || '0'),
      awayScore: parseInt(competitions.competitors.find((c: any) => c.homeAway === 'away')?.score || '0'),
      venue: competitions.venue?.fullName || ''
    };
  }
  
  extractTouchdownPlays(gameData: any): TouchdownPlay[] {
    const touchdowns: TouchdownPlay[] = [];
    const metadata = this.extractGameMetadata(gameData);
    
    // Check if scoringPlays exist in the data
    if (!gameData.scoringPlays || !Array.isArray(gameData.scoringPlays)) {
      return touchdowns;
    }
    
    // Process each scoring play
    gameData.scoringPlays.forEach((play: any) => {
      if (this.isTouchdownPlay(play)) {
        const touchdown = this.parseTouchdownPlay(play, metadata);
        if (touchdown) {
          touchdowns.push(touchdown);
        }
      }
    });
    
    return touchdowns;
  }
  
  private isTouchdownPlay(play: any): boolean {
    return play.scoringType?.name?.toLowerCase() === 'touchdown';
  }
  
  private parseTouchdownPlay(play: any, metadata: GameMetadata): TouchdownPlay | null {
    try {
      const playText = play.text || '';
      const touchdownType = this.determineTouchdownType(playText, play);
      
      // Extract player information from play text
      let playerName = '';
      let playerId = play.id || '';
      let playerPosition = '';
      let team = play.team?.displayName || '';
      
      // Parse player name from various touchdown text formats
      if (touchdownType === 'receiving') {
        // Format: "PlayerName X Yd pass from QB (Kicker Kick)"
        const receivingMatch = playText.match(/^([^0-9]+?)\s+\d+\s+Yd\s+pass/);
        if (receivingMatch) {
          playerName = receivingMatch[1].trim();
        }
      } else if (touchdownType === 'rushing') {
        // Format: "PlayerName X Yd Run (Kicker Kick)"
        const rushingMatch = playText.match(/^([^0-9]+?)\s+\d+\s+Yd\s+Run/);
        if (rushingMatch) {
          playerName = rushingMatch[1].trim();
        }
      }
      
      // Extract yards from play text
      const yardsMatch = playText.match(/(\d+)\s+Yd/);
      const yards = yardsMatch ? parseInt(yardsMatch[1]) : 0;
      
      return {
        gameId: metadata.gameId,
        season: metadata.season,
        week: metadata.week,
        gameType: metadata.gameType,
        date: metadata.date,
        homeTeam: metadata.homeTeam,
        awayTeam: metadata.awayTeam,
        quarter: play.period?.number || 0,
        timeRemaining: play.clock?.displayValue || '',
        playerId,
        playerName,
        playerPosition,
        team,
        touchdownType,
        yards,
        playDescription: playText,
        homeScore: play.homeScore || 0,
        awayScore: play.awayScore || 0
      };
      
    } catch (error) {
      console.error('Error parsing touchdown play:', error);
      return null;
    }
  }
  
  private determineTouchdownType(playText: string, play: any): 'rushing' | 'receiving' | 'passing' {
    // Use the type from the API first
    if (play.type?.text) {
      const typeText = play.type.text.toLowerCase();
      if (typeText.includes('passing')) {
        return 'receiving';
      } else if (typeText.includes('rushing')) {
        return 'rushing';
      }
    }
    
    // Fallback to text analysis
    const text = playText.toLowerCase();
    if (text.includes(' run ') || text.includes(' yd run')) {
      return 'rushing';
    } else if (text.includes(' pass ') || text.includes('pass from')) {
      return 'receiving';
    }
    
    // Default fallback
    return 'receiving';
  }
}