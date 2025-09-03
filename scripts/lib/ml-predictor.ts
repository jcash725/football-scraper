// Machine Learning TD Prediction System
import { TDRecommendation } from './types.js';

export interface MLFeatures {
  // Player performance features
  playerTDsYTD: number;
  playerTargetsPerGame: number;
  playerRedZoneTargets: number;
  playerYardsPerGame: number;
  
  // Opponent defensive features  
  oppPassTDsAllowed: number;
  oppRushTDsAllowed: number;
  oppYardsAllowedPerGame: number;
  oppRanking: number;
  
  // Game context features
  homeGame: number; // 1 if home, 0 if away
  divisionGame: number; // 1 if divisional, 0 otherwise
  restDays: number;
  
  // Historical features
  historicalTDsVsOpp: number;
  playerLast3GameTDs: number;
  playerSeasonTrend: number; // +1, 0, or -1
}

export interface MLPrediction {
  player: string;
  team: string;
  opponent: string;
  position: string;
  mlProbability: number; // 0-1 probability of scoring TD
  mlConfidence: number; // 0-1 confidence in the prediction
  keyFactors: string[]; // Top 3 factors influencing prediction
  currentModelRank?: number; // For comparison
  mlRank: number;
}

export interface ModelComparison {
  currentModel: TDRecommendation[];
  mlModel: MLPrediction[];
  agreement: number; // Percentage of overlap in top 20
  differences: {
    onlyInCurrent: string[];
    onlyInML: string[];
    rankingDifferences: { player: string; currentRank: number; mlRank: number }[];
  };
}

export class MLTDPredictor {
  private model: any = null;
  private isInitialized = false;
  
  async initialize(): Promise<void> {
    // For now, we'll use a simple weighted scoring system
    // Later we can replace with actual ML model (sklearn, TensorFlow.js, etc.)
    console.log("Initializing ML TD Predictor...");
    
    // Simulate loading a pre-trained model
    this.model = {
      weights: {
        playerTDsYTD: 0.25,
        oppDefenseRank: 0.20,
        historicalSuccess: 0.15,
        redZoneOpportunities: 0.15,
        gameContext: 0.10,
        recentForm: 0.10,
        matchupAdvantage: 0.05
      },
      
      // Position-specific adjustments
      positionFactors: {
        'QB': { rushing: 1.2, redzone: 1.5 },
        'RB': { volume: 1.3, goalline: 1.4 },
        'WR': { targets: 1.2, redzone: 1.1 },
        'TE': { redzone: 1.3, matchup: 1.2 }
      }
    };
    
    this.isInitialized = true;
    console.log("ML model initialized with weighted scoring system");
  }
  
  extractFeatures(player: any, opponent: any, matchup: any, historical?: string): MLFeatures {
    return {
      // Player stats
      playerTDsYTD: player.Value || 0,
      playerTargetsPerGame: this.estimateTargets(player),
      playerRedZoneTargets: this.estimateRedZoneTargets(player),
      playerYardsPerGame: this.estimateYards(player),
      
      // Opponent defense
      oppPassTDsAllowed: opponent.passTDs || 1.5,
      oppRushTDsAllowed: opponent.rushTDs || 1.2,
      oppYardsAllowedPerGame: opponent.yardsAllowed || 350,
      oppRanking: opponent.rank || 16,
      
      // Game context
      homeGame: this.isHomeGame(matchup) ? 1 : 0,
      divisionGame: this.isDivisionalGame(matchup) ? 1 : 0,
      restDays: this.estimateRestDays(),
      
      // Historical
      historicalTDsVsOpp: this.parseHistorical(historical),
      playerLast3GameTDs: this.estimateRecentTDs(player),
      playerSeasonTrend: this.estimateSeasonTrend(player)
    };
  }
  
  predict(features: MLFeatures): { probability: number; confidence: number; factors: string[] } {
    if (!this.isInitialized) {
      throw new Error("ML model not initialized. Call initialize() first.");
    }
    
    // Weighted scoring calculation
    let score = 0;
    const factors: string[] = [];
    
    // Player performance (0-1 normalized)
    const playerScore = Math.min(features.playerTDsYTD / 20, 1); // Normalize by max ~20 TDs
    score += playerScore * this.model.weights.playerTDsYTD;
    
    if (features.playerTDsYTD > 8) {
      factors.push(`High TD production (${features.playerTDsYTD} TDs)`);
    }
    
    // Opponent weakness (higher = more TDs allowed = better for player)
    const oppScore = Math.min(features.oppPassTDsAllowed / 3, 1); // Normalize by ~3 max TDs/game
    score += oppScore * this.model.weights.oppDefenseRank;
    
    if (features.oppPassTDsAllowed > 1.8) {
      factors.push(`Weak opponent defense (${features.oppPassTDsAllowed} TDs/game)`);
    }
    
    // Historical success
    const histScore = features.historicalTDsVsOpp > 0 ? 
      Math.min(features.historicalTDsVsOpp / 3, 1) : 0;
    score += histScore * this.model.weights.historicalSuccess;
    
    if (features.historicalTDsVsOpp > 1) {
      factors.push(`Previous success vs opponent (${features.historicalTDsVsOpp} TDs)`);
    }
    
    // Game context bonuses
    if (features.homeGame) {
      score += 0.05;
      factors.push("Home field advantage");
    }
    
    if (features.divisionGame) {
      score += 0.03; // Divisional games often more competitive
    }
    
    // Season trend
    if (features.playerSeasonTrend > 0) {
      score += 0.04;
      factors.push("Trending upward");
    } else if (features.playerSeasonTrend < 0) {
      score -= 0.04;
      factors.push("Trending downward");
    }
    
    // Convert score to probability (sigmoid-like function)
    const probability = Math.min(Math.max(score, 0), 0.95);
    
    // Confidence based on data quality
    let confidence = 0.7; // Base confidence
    if (features.historicalTDsVsOpp > 0) confidence += 0.1;
    if (features.playerTDsYTD > 5) confidence += 0.1;
    if (features.oppPassTDsAllowed > 1.5) confidence += 0.1;
    
    confidence = Math.min(confidence, 0.95);
    
    return {
      probability,
      confidence,
      factors: factors.slice(0, 3) // Top 3 factors
    };
  }
  
  // Helper methods for feature extraction
  private estimateTargets(player: any): number {
    // Estimate targets based on position and TDs
    const pos = player.Pos?.toUpperCase();
    if (pos === 'WR' || pos === 'TE') {
      return Math.max(player.Value * 8, 3); // Rough estimate: 8 targets per TD
    }
    return 2; // RBs get fewer targets
  }
  
  private estimateRedZoneTargets(player: any): number {
    return Math.max(player.Value * 2, 1); // Rough estimate
  }
  
  private estimateYards(player: any): number {
    const pos = player.Pos?.toUpperCase();
    if (pos === 'WR') return player.Value * 50; // ~50 yards per TD
    if (pos === 'TE') return player.Value * 35;  
    if (pos === 'RB') return player.Value * 30;
    return player.Value * 40;
  }
  
  private isHomeGame(matchup: any): boolean {
    // This would need actual matchup data
    return Math.random() > 0.5; // Placeholder
  }
  
  private isDivisionalGame(matchup: any): boolean {
    // This would need division data
    return Math.random() > 0.75; // ~25% of games are divisional
  }
  
  private estimateRestDays(): number {
    return 7; // Standard week, could be enhanced with actual schedule data
  }
  
  private parseHistorical(historical?: string): number {
    if (!historical || historical.includes("not verifiable")) return 0;
    const match = historical.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }
  
  private estimateRecentTDs(player: any): number {
    // Would need last 3 games data, estimate based on season average
    return Math.round((player.Value || 0) / 5); // Rough weekly average
  }
  
  private estimateSeasonTrend(player: any): number {
    // Would need game-by-game data, random for now
    const trends = [-1, 0, 1];
    return trends[Math.floor(Math.random() * trends.length)];
  }
}