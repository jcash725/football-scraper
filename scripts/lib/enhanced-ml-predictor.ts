// Enhanced ML TD Prediction System using actual 2024 touchdown data
import { TDRecommendation } from './types.js';
import { SimpleTouchdownTracker } from './simple-touchdown-tracker.js';

export interface MLFeatures {
  // Player performance features (from actual data)
  playerTotalTDs2024: number;
  playerRushingTDs2024: number; 
  playerReceivingTDs2024: number;
  playerTDsVsOpponent: number;
  playerHomeAwayTDs: number;
  
  // Opponent defensive features (calculated from actual data)
  oppTotalTDsAllowed: number;
  oppRushTDsAllowed: number; 
  oppPassTDsAllowed: number;
  
  // Game context features (from actual data)
  homeGame: number; // 1 if home, 0 if away
  playerGamesPlayed: number;
  
  // Recent performance (from actual data)
  playerLast5GameTDs: number;
  playerSeasonTrend: number;
}

export interface MLPrediction {
  player: string;
  team: string;
  opponent: string;
  position: string;
  mlProbability: number;
  mlConfidence: number;
  keyFactors: string[];
  historicalData: {
    totalTDs2024: number;
    rushingTDs: number;
    receivingTDs: number;
    vsOpponent: number;
    games: number;
  };
  mlRank: number;
}

export class EnhancedMLTDPredictor {
  private model: any = null;
  private isInitialized = false;
  private touchdownTracker: SimpleTouchdownTracker;
  private touchdownData: any = null;
  
  constructor() {
    this.touchdownTracker = new SimpleTouchdownTracker();
  }
  
  async initialize(): Promise<void> {
    console.log("Initializing Enhanced ML TD Predictor with 2024 data...");
    
    // Load actual 2024 touchdown data
    this.touchdownData = this.touchdownTracker.loadTouchdownDatabase(2024);
    
    if (!this.touchdownData) {
      throw new Error("No 2024 touchdown data found. Run touchdown collection first.");
    }
    
    console.log(`Loaded ${this.touchdownData.playerGameStats.length} player performances from ${this.touchdownData.totalGames} games`);
    
    // Enhanced model with actual data weights
    this.model = {
      weights: {
        actualPlayerTDs: 0.30,        // Historical TD performance
        vsOpponentHistory: 0.20,      // Head-to-head success
        oppDefenseWeakness: 0.18,     // How many TDs opponent allows
        recentForm: 0.12,             // Last 5 games performance  
        homeFieldAdvantage: 0.08,     // Home vs away splits
        gamesPlayed: 0.07,            // Availability factor
        positionTrend: 0.05           // Position-specific trends
      }
    };
    
    this.isInitialized = true;
    console.log("Enhanced ML model initialized with actual 2024 touchdown data");
  }
  
  predictForPlayer(playerName: string, team: string, opponent: string, isHome: boolean, position: string = 'WR'): MLPrediction {
    if (!this.isInitialized || !this.touchdownData) {
      throw new Error("Enhanced ML model not initialized");
    }
    
    const features = this.extractActualFeatures(playerName, team, opponent, isHome);
    const prediction = this.predictFromActualData(features, position);
    
    return {
      player: playerName,
      team,
      opponent, 
      position,
      mlProbability: prediction.probability,
      mlConfidence: prediction.confidence,
      keyFactors: prediction.factors,
      historicalData: {
        totalTDs2024: features.playerTotalTDs2024,
        rushingTDs: features.playerRushingTDs2024,
        receivingTDs: features.playerReceivingTDs2024,
        vsOpponent: features.playerTDsVsOpponent,
        games: features.playerGamesPlayed
      },
      mlRank: 0 // Will be set when ranking predictions
    };
  }
  
  extractActualFeatures(playerName: string, team: string, opponent: string, isHome: boolean): MLFeatures {
    const playerStats = this.getPlayerStats(playerName, team);
    const opponentStats = this.getOpponentDefenseStats(opponent);
    const vsOpponentHistory = this.getHeadToHeadStats(playerName, opponent);
    const recentForm = this.getRecentForm(playerName, team);
    
    return {
      // Actual player performance from 2024
      playerTotalTDs2024: playerStats.totalTDs,
      playerRushingTDs2024: playerStats.rushingTDs,
      playerReceivingTDs2024: playerStats.receivingTDs,
      playerTDsVsOpponent: vsOpponentHistory,
      playerHomeAwayTDs: this.getHomeAwayTDs(playerName, team, isHome),
      
      // Actual opponent defense from 2024
      oppTotalTDsAllowed: opponentStats.totalAllowed,
      oppRushTDsAllowed: opponentStats.rushingAllowed,
      oppPassTDsAllowed: opponentStats.passingAllowed,
      
      // Game context
      homeGame: isHome ? 1 : 0,
      playerGamesPlayed: playerStats.games,
      
      // Recent trends
      playerLast5GameTDs: recentForm,
      playerSeasonTrend: this.calculateSeasonTrend(playerName, team)
    };
  }
  
  private getPlayerStats(playerName: string, team: string) {
    const playerGames = this.touchdownData.playerGameStats.filter((stat: any) => 
      stat.playerName.toLowerCase().includes(playerName.toLowerCase()) &&
      stat.team.toLowerCase().includes(team.toLowerCase())
    );
    
    const totalTDs = playerGames.reduce((sum: number, game: any) => 
      sum + game.rushingTouchdowns + game.receivingTouchdowns, 0);
    const rushingTDs = playerGames.reduce((sum: number, game: any) => 
      sum + game.rushingTouchdowns, 0);
    const receivingTDs = playerGames.reduce((sum: number, game: any) => 
      sum + game.receivingTouchdowns, 0);
    
    return {
      totalTDs,
      rushingTDs,
      receivingTDs,
      games: playerGames.length
    };
  }
  
  private getOpponentDefenseStats(opponent: string) {
    // Calculate how many TDs this opponent allowed in 2024
    const allowedStats = this.touchdownData.playerGameStats.filter((stat: any) =>
      stat.opponent.toLowerCase().includes(opponent.toLowerCase())
    );
    
    const totalAllowed = allowedStats.length;
    const rushingAllowed = allowedStats.filter((stat: any) => stat.rushingTouchdowns > 0).length;
    const passingAllowed = allowedStats.filter((stat: any) => stat.receivingTouchdowns > 0).length;
    
    // Convert to per-game averages (approximate)
    const estimatedGames = this.touchdownData.totalGames / 32; // ~games per team
    
    return {
      totalAllowed: totalAllowed / estimatedGames,
      rushingAllowed: rushingAllowed / estimatedGames,
      passingAllowed: passingAllowed / estimatedGames
    };
  }
  
  private getHeadToHeadStats(playerName: string, opponent: string): number {
    const h2hGames = this.touchdownData.playerGameStats.filter((stat: any) =>
      stat.playerName.toLowerCase().includes(playerName.toLowerCase()) &&
      stat.opponent.toLowerCase().includes(opponent.toLowerCase())
    );
    
    return h2hGames.reduce((sum: number, game: any) => 
      sum + game.rushingTouchdowns + game.receivingTouchdowns, 0);
  }
  
  private getHomeAwayTDs(playerName: string, team: string, isHome: boolean): number {
    const homeAway = isHome ? 'home' : 'away';
    const games = this.touchdownData.playerGameStats.filter((stat: any) =>
      stat.playerName.toLowerCase().includes(playerName.toLowerCase()) &&
      stat.team.toLowerCase().includes(team.toLowerCase()) &&
      stat.homeAway === homeAway
    );
    
    return games.reduce((sum: number, game: any) => 
      sum + game.rushingTouchdowns + game.receivingTouchdowns, 0);
  }
  
  private getRecentForm(playerName: string, team: string): number {
    // Get last 5 games (simplified - would need actual date sorting)
    const playerGames = this.touchdownData.playerGameStats
      .filter((stat: any) => 
        stat.playerName.toLowerCase().includes(playerName.toLowerCase()) &&
        stat.team.toLowerCase().includes(team.toLowerCase())
      )
      .slice(-5); // Last 5 games
    
    return playerGames.reduce((sum: number, game: any) => 
      sum + game.rushingTouchdowns + game.receivingTouchdowns, 0);
  }
  
  private calculateSeasonTrend(playerName: string, team: string): number {
    const playerGames = this.touchdownData.playerGameStats.filter((stat: any) =>
      stat.playerName.toLowerCase().includes(playerName.toLowerCase()) &&
      stat.team.toLowerCase().includes(team.toLowerCase())
    );
    
    if (playerGames.length < 6) return 0; // Need enough games for trend
    
    // Compare first half vs second half of season
    const mid = Math.floor(playerGames.length / 2);
    const firstHalf = playerGames.slice(0, mid);
    const secondHalf = playerGames.slice(mid);
    
    const firstHalfTDs = firstHalf.reduce((sum: number, game: any) => 
      sum + game.rushingTouchdowns + game.receivingTouchdowns, 0) / firstHalf.length;
    const secondHalfTDs = secondHalf.reduce((sum: number, game: any) => 
      sum + game.rushingTouchdowns + game.receivingTouchdowns, 0) / secondHalf.length;
    
    if (secondHalfTDs > firstHalfTDs * 1.2) return 1; // Trending up
    if (secondHalfTDs < firstHalfTDs * 0.8) return -1; // Trending down
    return 0; // Stable
  }
  
  predictFromActualData(features: MLFeatures, position: string): { probability: number; confidence: number; factors: string[] } {
    let score = 0;
    const factors: string[] = [];
    
    // Actual TD production (most important factor)
    const tdScore = Math.min(features.playerTotalTDs2024 / 15, 1); // Normalize by ~15 max TDs
    score += tdScore * this.model.weights.actualPlayerTDs;
    
    if (features.playerTotalTDs2024 >= 8) {
      factors.push(`Strong 2024 production (${features.playerTotalTDs2024} TDs)`);
    } else if (features.playerTotalTDs2024 >= 4) {
      factors.push(`Moderate 2024 production (${features.playerTotalTDs2024} TDs)`);
    }
    
    // Head-to-head history
    if (features.playerTDsVsOpponent > 0) {
      score += Math.min(features.playerTDsVsOpponent / 3, 1) * this.model.weights.vsOpponentHistory;
      factors.push(`Previous success vs opponent (${features.playerTDsVsOpponent} TDs)`);
    }
    
    // Opponent defensive weakness
    const oppScore = Math.min(features.oppTotalTDsAllowed / 3, 1);
    score += oppScore * this.model.weights.oppDefenseWeakness;
    
    if (features.oppTotalTDsAllowed > 2) {
      factors.push(`Weak opponent defense (${features.oppTotalTDsAllowed.toFixed(1)} TDs/game allowed)`);
    }
    
    // Recent form
    if (features.playerLast5GameTDs > 2) {
      score += 0.1;
      factors.push(`Hot recent form (${features.playerLast5GameTDs} TDs in recent games)`);
    }
    
    // Home field advantage
    if (features.homeGame && features.playerHomeAwayTDs > 0) {
      score += 0.06;
      factors.push("Home field advantage");
    }
    
    // Season trend
    if (features.playerSeasonTrend > 0) {
      score += 0.05;
      factors.push("Trending upward");
    } else if (features.playerSeasonTrend < 0) {
      score -= 0.05;
    }
    
    // Games played reliability
    if (features.playerGamesPlayed > 12) {
      score += 0.03; // Healthy/reliable player
    }
    
    // Convert to probability
    const probability = Math.min(Math.max(score, 0.01), 0.85);
    
    // Confidence based on data quality
    let confidence = 0.6; // Base confidence
    if (features.playerTotalTDs2024 > 0) confidence += 0.15; // Has actual data
    if (features.playerTDsVsOpponent > 0) confidence += 0.1;  // H2H history
    if (features.playerGamesPlayed > 10) confidence += 0.1;   // Sufficient sample
    if (features.oppTotalTDsAllowed > 1.5) confidence += 0.05; // Clear matchup data
    
    confidence = Math.min(confidence, 0.95);
    
    return {
      probability,
      confidence,
      factors: factors.slice(0, 3) // Top 3 factors
    };
  }
  
  // Get top touchdown scorers from 2024 for reference
  getTopScorers(limit: number = 20): Array<{ player: string; team: string; totalTDs: number; rushing: number; receiving: number; games: number }> {
    const playerTotals = new Map();
    
    this.touchdownData.playerGameStats.forEach((stat: any) => {
      const key = `${stat.playerName}|${stat.team}`;
      if (!playerTotals.has(key)) {
        playerTotals.set(key, { 
          player: stat.playerName,
          team: stat.team,
          rushing: 0, 
          receiving: 0,
          games: new Set()
        });
      }
      
      const totals = playerTotals.get(key);
      totals.rushing += stat.rushingTouchdowns;
      totals.receiving += stat.receivingTouchdowns;
      totals.games.add(stat.gameId);
    });
    
    return Array.from(playerTotals.values())
      .map(p => ({
        player: p.player,
        team: p.team,
        totalTDs: p.rushing + p.receiving,
        rushing: p.rushing,
        receiving: p.receiving,
        games: p.games.size
      }))
      .sort((a, b) => b.totalTDs - a.totalTDs)
      .slice(0, limit);
  }
}