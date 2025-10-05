#!/usr/bin/env tsx
// Enhanced Combined Volume + Defense Predictor v2.0
// New Formula: Volume (50%) + Defense (25%) + Game Script (15%) + Usage Trends (10%)

import { ManualVolumeTracker } from './manual-volume-tracker.js';
import { SimpleTouchdownTracker } from './simple-touchdown-tracker.js';
import { InjuryChecker } from './injury-checker.js';
import { ByeWeekFilter } from './bye-week-filter.js';
import fs from 'fs';

interface Matchup {
  away_team: string;
  home_team: string;
  date: string;
  time: string;
}

interface DefenseData {
  Team: string;
  "2025": number;
  "2024": number;
  Rank: number;
}

interface GameScriptData {
  team: string;
  impliedTotal: number;
  spread: number; // positive = favored, negative = underdog
  pace: number; // plays per game
}

interface EnhancedPrediction {
  playerName: string;
  team: string;
  position: string;
  opponent: string;
  targets: number;
  carries: number;
  redZoneOpportunities: number;
  volumeScore: number;
  defenseScore: number;
  gameScriptScore: number;
  usageTrendScore: number;
  finalScore: number;
  prediction: string;
  injuryStatus: string;
  reasoning: string[];
}

export class EnhancedVolumeDefensePredictor {
  private volumeTracker: ManualVolumeTracker;
  private touchdownTracker: SimpleTouchdownTracker;
  private injuryChecker: InjuryChecker;
  private rushDefenseData: DefenseData[];
  private passDefenseData: DefenseData[];
  private matchups: Matchup[];

  constructor() {
    this.volumeTracker = new ManualVolumeTracker();
    this.touchdownTracker = new SimpleTouchdownTracker();
    this.injuryChecker = new InjuryChecker();
    this.loadDefenseData();
    this.matchups = [];
  }

  private loadDefenseData() {
    try {
      const rushData = JSON.parse(fs.readFileSync('data/opponent-rushing-tds.json', 'utf8'));
      const passData = JSON.parse(fs.readFileSync('data/opponent-passing-tds.json', 'utf8'));

      this.rushDefenseData = rushData.rows || [];
      this.passDefenseData = passData.rows || [];

      console.log(`📊 Loaded defense data: ${this.rushDefenseData.length} rush, ${this.passDefenseData.length} pass`);
    } catch (error) {
      console.error('❌ Failed to load defense data:', error);
      this.rushDefenseData = [];
      this.passDefenseData = [];
    }
  }

  private loadMatchups(week: number) {
    try {
      const matchupData = JSON.parse(fs.readFileSync('data/weekly-matchups.json', 'utf8'));
      this.matchups = matchupData.rows || [];
      console.log(`📊 Loaded ${this.matchups.length} matchups for Week ${week}`);
    } catch (error) {
      console.error('❌ Failed to load matchup data:', error);
      this.matchups = [];
    }
  }

  private getOpponent(team: string, week: number, touchdownData: any): string {
    // First try to get opponent from touchdown data for this specific week
    if (touchdownData) {
      const teamGames = touchdownData.playerGameStats.filter((stat: any) =>
        stat.week === week && this.normalizeTeamName(stat.team) === this.normalizeTeamName(team)
      );

      if (teamGames.length > 0) {
        return teamGames[0].opponent;
      }
    }

    // Fallback to matchup data
    const normalizedTeam = this.normalizeTeamName(team);

    const matchup = this.matchups.find(m => {
      const normalizedAway = this.normalizeTeamName(m.away_team || '');
      const normalizedHome = this.normalizeTeamName(m.home_team || '');

      return normalizedTeam === normalizedAway || normalizedTeam === normalizedHome;
    });

    if (!matchup) {
      // Fallback: try city-based matching if exact match fails
      const partialMatchup = this.matchups.find(m => {
        const normalizedAway = this.normalizeTeamName(m.away_team || '');
        const normalizedHome = this.normalizeTeamName(m.home_team || '');

        // Special handling for multi-word cities and abbreviations
        const getTeamKey = (team: string) => {
          const words = team.split(' ');

          // Handle NY teams specifically - include team name to distinguish
          if (words[0] === 'ny') {
            return team; // "ny giants" or "ny jets"
          }
          if (words.length >= 2 && words[0] === 'new' && words[1] === 'york') {
            // Convert "new york giants" to "ny giants" for matching
            return 'ny ' + words.slice(2).join(' ');
          }

          // Handle other multi-word cities
          if (words.length >= 2 && (words[0] === 'los' || words[0] === 'san')) {
            return words.slice(0, 2).join(' '); // "los angeles", "san francisco"
          }

          return words[0]; // single word like "dallas", "miami"
        };

        const teamKey = getTeamKey(normalizedTeam);
        const awayKey = getTeamKey(normalizedAway);
        const homeKey = getTeamKey(normalizedHome);

        return teamKey === awayKey || teamKey === homeKey;
      });

      if (partialMatchup) {
        const normalizedAway = this.normalizeTeamName(partialMatchup.away_team || '');

        // Use same team key logic to determine which team this is
        const getTeamKey = (team: string) => {
          const words = team.split(' ');

          // Handle NY abbreviation
          if (words[0] === 'ny') {
            return 'new york';
          }
          if (words.length >= 2 && words[0] === 'new' && words[1] === 'york') {
            return 'new york';
          }

          // Handle other multi-word cities
          if (words.length >= 2 && (words[0] === 'los' || words[0] === 'san')) {
            return words.slice(0, 2).join(' ');
          }

          return words[0];
        };

        const teamKey = getTeamKey(normalizedTeam);
        const awayKey = getTeamKey(normalizedAway);

        if (teamKey === awayKey) {
          return partialMatchup.home_team || 'Unknown';
        } else {
          return partialMatchup.away_team || 'Unknown';
        }
      }

      return 'Unknown';
    }

    // Return the opponent team
    const normalizedAway = this.normalizeTeamName(matchup.away_team || '');

    if (normalizedTeam === normalizedAway) {
      return matchup.home_team || 'Unknown';
    } else {
      return matchup.away_team || 'Unknown';
    }
  }

  private normalizeTeamName(teamName: string): string {
    return teamName
      .toLowerCase()
      .replace(/\s+(football\s+team|football\s+club|fc|football)/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private getDefenseScore(opponent: string, position: string): { score: number, reasoning: string } {
    const isRunningBack = position === 'RB';
    const defenseData = isRunningBack ? this.rushDefenseData : this.passDefenseData;

    // Find opponent's defensive stats
    const opponentData = defenseData.find(team =>
      team.Team && opponent &&
      (team.Team.toLowerCase().includes(opponent.toLowerCase()) ||
       opponent.toLowerCase().includes(team.Team.toLowerCase()))
    );

    if (!opponentData) {
      return { score: 5, reasoning: 'No defensive data available' };
    }

    // Use 2025 data if available, otherwise fall back to 2024
    const tdsAllowed = opponentData["2025"] || opponentData["2024"];
    const defenseTier = isRunningBack ? 'rush' : 'pass';

    // Score based on TDs allowed (higher = worse defense = better for player)
    let score = Math.min(tdsAllowed * 2.5, 10); // Cap at 10

    let tier = 'Average';
    if (tdsAllowed >= 2.0) {
      tier = 'Very Weak';
      score = Math.min(score + 2, 10);
    } else if (tdsAllowed >= 1.5) {
      tier = 'Weak';
      score = Math.min(score + 1, 10);
    } else if (tdsAllowed <= 0.8) {
      tier = 'Strong';
      score = Math.max(score - 2, 1);
    } else if (tdsAllowed <= 1.2) {
      tier = 'Solid';
      score = Math.max(score - 1, 1);
    }

    const reasoning = `${tier} ${defenseTier} defense (${tdsAllowed.toFixed(1)} TDs/game allowed)`;

    return { score, reasoning };
  }

  private calculateVolumeScore(targets: number, carries: number, redZoneOpps: number): { score: number, reasoning: string[] } {
    const reasoning: string[] = [];
    let score = 0;

    // Base volume score
    const totalTouches = targets + carries;
    if (totalTouches >= 20) {
      score += 6;
      reasoning.push(`High volume (${totalTouches} touches)`);
    } else if (totalTouches >= 15) {
      score += 4;
      reasoning.push(`Good volume (${totalTouches} touches)`);
    } else if (totalTouches >= 10) {
      score += 2;
      reasoning.push(`Moderate volume (${totalTouches} touches)`);
    } else {
      reasoning.push(`Low volume (${totalTouches} touches)`);
    }

    // Red zone bonus (most important factor)
    if (redZoneOpps >= 3) {
      score += 4;
      reasoning.push(`High red zone usage (${redZoneOpps} opportunities)`);
    } else if (redZoneOpps >= 2) {
      score += 2;
      reasoning.push(`Good red zone usage (${redZoneOpps} opportunities)`);
    } else if (redZoneOpps >= 1) {
      score += 1;
      reasoning.push(`Some red zone usage (${redZoneOpps} opportunities)`);
    }

    // Target/carry balance for RBs and WRs
    if (carries > 0 && targets > 0) {
      score += 1;
      reasoning.push('Dual-threat usage');
    }

    return { score: Math.min(score, 10), reasoning };
  }

  private calculateGameScriptScore(team: string, position: string): { score: number, reasoning: string } {
    // Mock game script data - in real implementation, this would come from sportsbook APIs
    const gameScriptData = this.getMockGameScriptData(team);

    let score = 5; // baseline
    const reasoning: string[] = [];

    // Implied team total (higher = more TDs expected)
    if (gameScriptData.impliedTotal >= 28) {
      score += 2;
      reasoning.push(`High-scoring game expected (${gameScriptData.impliedTotal}+ points)`);
    } else if (gameScriptData.impliedTotal >= 24) {
      score += 1;
      reasoning.push(`Good scoring game expected (${gameScriptData.impliedTotal}+ points)`);
    } else if (gameScriptData.impliedTotal <= 20) {
      score -= 1;
      reasoning.push(`Low-scoring game expected (${gameScriptData.impliedTotal} points)`);
    }

    // Spread impact (favored teams get more red zone chances)
    if (gameScriptData.spread >= 7) {
      score += 1;
      reasoning.push('Heavy favorite (positive game script)');
    } else if (gameScriptData.spread >= 3) {
      score += 0.5;
      reasoning.push('Favored team (positive game script)');
    } else if (gameScriptData.spread <= -7) {
      // RBs hurt more by negative game script than WRs/TEs
      if (position === 'RB') {
        score -= 2;
        reasoning.push('Heavy underdog (negative RB game script)');
      } else {
        score -= 1;
        reasoning.push('Heavy underdog (negative game script)');
      }
    }

    // Team pace (more plays = more opportunities)
    if (gameScriptData.pace >= 70) {
      score += 1;
      reasoning.push('Fast-pace offense (more opportunities)');
    } else if (gameScriptData.pace <= 60) {
      score -= 0.5;
      reasoning.push('Slow-pace offense (fewer opportunities)');
    }

    return {
      score: Math.min(Math.max(score, 1), 10),
      reasoning: reasoning.join('; ') || 'Average game script expected'
    };
  }

  private calculateUsageTrendScore(playerName: string, team: string, week: number): { score: number, reasoning: string } {
    // Get player's volume data from previous weeks
    const volumeData = this.volumeTracker.predictTouchdownCandidates(week);
    const currentPlayer = volumeData.find(p =>
      p.playerName.toLowerCase() === playerName.toLowerCase() &&
      p.team.toLowerCase().includes(team.toLowerCase())
    );

    if (!currentPlayer) {
      return { score: 5, reasoning: 'No trend data available' };
    }

    // Compare current week to previous weeks (mock calculation)
    const currentTouches = currentPlayer.targets + currentPlayer.carries;
    const currentRZOpps = currentPlayer.redZoneTargets + currentPlayer.redZoneCarries;

    // Mock previous weeks data - in real implementation, calculate actual trends
    const avgPreviousTouches = currentTouches * 0.85; // Assume slight upward trend
    const avgPreviousRZ = Math.max(currentRZOpps * 0.7, 0.5); // RZ trend

    let score = 5; // baseline
    const reasoning: string[] = [];

    // Volume trending
    const touchesTrend = (currentTouches - avgPreviousTouches) / avgPreviousTouches;
    if (touchesTrend >= 0.2) {
      score += 2;
      reasoning.push('Volume trending up significantly');
    } else if (touchesTrend >= 0.1) {
      score += 1;
      reasoning.push('Volume trending up');
    } else if (touchesTrend <= -0.2) {
      score -= 1;
      reasoning.push('Volume trending down');
    }

    // Red zone trending
    const rzTrend = (currentRZOpps - avgPreviousRZ) / Math.max(avgPreviousRZ, 0.5);
    if (rzTrend >= 0.5) {
      score += 1;
      reasoning.push('Red zone usage increasing');
    } else if (rzTrend <= -0.5) {
      score -= 1;
      reasoning.push('Red zone usage decreasing');
    }

    return {
      score: Math.min(Math.max(score, 1), 10),
      reasoning: reasoning.join('; ') || 'Stable usage trends'
    };
  }

  private getMockGameScriptData(team: string): GameScriptData {
    // Mock data - in real implementation, pull from sportsbook APIs
    const mockData: { [key: string]: GameScriptData } = {
      'green bay packers': { team: 'GB', impliedTotal: 27, spread: 3, pace: 65 },
      'philadelphia eagles': { team: 'PHI', impliedTotal: 28, spread: 6, pace: 68 },
      'baltimore ravens': { team: 'BAL', impliedTotal: 26, spread: -2, pace: 64 },
      'buffalo bills': { team: 'BUF', impliedTotal: 29, spread: 7, pace: 67 },
      'san francisco 49ers': { team: 'SF', impliedTotal: 25, spread: 4, pace: 66 },
      'seattle seahawks': { team: 'SEA', impliedTotal: 24, spread: 1, pace: 63 },
      'miami dolphins': { team: 'MIA', impliedTotal: 23, spread: -3, pace: 69 },
      'los angeles rams': { team: 'LAR', impliedTotal: 26, spread: 2, pace: 65 },
      'detroit lions': { team: 'DET', impliedTotal: 28, spread: 8, pace: 70 },
      'kansas city chiefs': { team: 'KC', impliedTotal: 27, spread: 5, pace: 64 }
    };

    const normalizedTeam = this.normalizeTeamName(team);
    return mockData[normalizedTeam] || { team: 'UNK', impliedTotal: 24, spread: 0, pace: 65 };
  }

  public generateEnhancedPredictions(week: number): EnhancedPrediction[] {
    console.log(`🏈 Generating Enhanced Volume + Defense + Game Script Predictions for Week ${week}...\n`);

    // Load matchups for this week
    this.loadMatchups(week);

    // Initialize bye week filter
    const byeWeekFilter = new ByeWeekFilter();

    // Load touchdown data to get opponents from historical games
    const touchdownData = this.touchdownTracker.loadTouchdownDatabase(2025);

    // Get volume candidates
    const volumeCandidates = this.volumeTracker.predictTouchdownCandidates(week);

    if (volumeCandidates.length === 0) {
      console.log('❌ No volume data available. Run volume-data-entry.ts first.');
      return [];
    }

    // Generate enhanced predictions
    const predictions: EnhancedPrediction[] = volumeCandidates.map(player => {
      const opponent = this.getOpponent(player.team, week, touchdownData);

      // Calculate all score components with new weights
      const volumeAnalysis = this.calculateVolumeScore(
        player.targets,
        player.carries,
        player.redZoneTargets + player.redZoneCarries
      );

      const defenseAnalysis = this.getDefenseScore(opponent, player.position);
      const gameScriptAnalysis = this.calculateGameScriptScore(player.team, player.position);
      const usageTrendAnalysis = this.calculateUsageTrendScore(player.playerName, player.team, week);

      // Calculate final weighted score: Volume (50%) + Defense (25%) + Game Script (15%) + Usage Trends (10%)
      const finalScore = Math.round(
        (volumeAnalysis.score * 0.5) +
        (defenseAnalysis.score * 0.25) +
        (gameScriptAnalysis.score * 0.15) +
        (usageTrendAnalysis.score * 0.1)
      );

      // Determine prediction tier
      let prediction = 'Dart Throw';
      if (finalScore >= 8 && player.redZoneTargets + player.redZoneCarries >= 2) {
        prediction = 'Strong Play';
      } else if (finalScore >= 6 && (player.targets >= 8 || player.carries >= 12)) {
        prediction = 'Solid Play';
      } else if (finalScore >= 5) {
        prediction = 'Speculative Play';
      }

      // Get injury status
      const injuryReport = this.injuryChecker.getPlayerInjuryStatus(player.playerName);
      const injuryStatus = injuryReport ?
        `${injuryReport.status}${injuryReport.injury !== 'None' ? ` (${injuryReport.injury})` : ''}` :
        'Healthy';

      // Adjust for injury uncertainty
      let adjustedFinalScore = finalScore;
      if (injuryReport && injuryReport.status === 'Questionable') {
        adjustedFinalScore = Math.max(finalScore - 1, 1);
      } else if (injuryReport && injuryReport.status === 'Doubtful') {
        adjustedFinalScore = Math.max(finalScore - 2, 1);
      }

      // Combine reasoning
      const reasoning = [
        ...volumeAnalysis.reasoning,
        defenseAnalysis.reasoning,
        gameScriptAnalysis.reasoning,
        usageTrendAnalysis.reasoning
      ].filter(r => r && r.length > 0);

      return {
        playerName: player.playerName,
        team: player.team,
        position: player.position,
        opponent: opponent,
        targets: player.targets,
        carries: player.carries,
        redZoneOpportunities: player.redZoneTargets + player.redZoneCarries,
        volumeScore: volumeAnalysis.score,
        defenseScore: defenseAnalysis.score,
        gameScriptScore: gameScriptAnalysis.score,
        usageTrendScore: usageTrendAnalysis.score,
        finalScore: adjustedFinalScore,
        prediction,
        injuryStatus,
        reasoning
      };
    });

    // Filter out injured players and bye week teams, then sort by final score
    const filteredPredictions = predictions
      .filter(p => {
        // Check injury status
        const injuryReport = this.injuryChecker.getPlayerInjuryStatus(p.playerName);
        const isInjured = injuryReport && (injuryReport.status === 'Out' || injuryReport.status === 'IR');

        // Check bye week status
        const isOnBye = byeWeekFilter.isTeamOnBye(p.team);

        return !isInjured && !isOnBye;
      })
      .sort((a, b) => b.finalScore - a.finalScore);

    const injuredCount = predictions.filter(p => {
      const injuryReport = this.injuryChecker.getPlayerInjuryStatus(p.playerName);
      return injuryReport && (injuryReport.status === 'Out' || injuryReport.status === 'IR');
    }).length;

    const byeCount = predictions.filter(p => byeWeekFilter.isTeamOnBye(p.team)).length;

    console.log(`🏥 Filtered out ${injuredCount} injured players (Out/IR)`);
    console.log(`🚫 Filtered out ${byeCount} players on bye week`);
    console.log(`📊 Generated ${filteredPredictions.length} enhanced predictions`);

    return filteredPredictions;
  }
}