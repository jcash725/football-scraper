#!/usr/bin/env tsx
// Combined Volume + Defense Predictor
// Combines volume analysis (60%) with current defensive matchup data (30%) and historical performance (10%)

import { ManualVolumeTracker } from './manual-volume-tracker.js';
import { SimpleTouchdownTracker } from './simple-touchdown-tracker.js';
import { InjuryChecker } from './injury-checker.js';
import { ByeWeekFilter } from './bye-week-filter.js';
import { TeamNameStandardizer } from './team-name-standardizer.js';
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

interface CombinedPrediction {
  playerName: string;
  team: string;
  position: string;
  opponent: string;
  targets: number;
  carries: number;
  redZoneOpportunities: number;
  volumeScore: number;
  defenseScore: number;
  historicalScore: number;
  finalScore: number;
  prediction: string;
  injuryStatus: string;
  reasoning: string[];
}

export class VolumeDefensePredictor {
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

  private calculateHistoricalScore(playerName: string, week: number): { score: number, reasoning: string } {
    const historicalDatabase = this.touchdownTracker.loadTouchdownDatabase(2025);

    if (!historicalDatabase) {
      return { score: 0, reasoning: 'No historical data' };
    }

    const playerHistory = historicalDatabase.playerGameStats.filter(stat =>
      stat.playerName.toLowerCase().includes(playerName.toLowerCase())
    );

    const recentTDs = playerHistory
      .filter(stat => stat.week >= week - 3 && stat.week < week)
      .reduce((sum, stat) => sum + stat.rushingTouchdowns + stat.receivingTouchdowns, 0);

    let score = 0;
    let reasoning = '';

    if (recentTDs >= 3) {
      score = 5;
      reasoning = `Hot recent form (${recentTDs} TDs in last 3 games)`;
    } else if (recentTDs >= 2) {
      score = 3;
      reasoning = `Good recent form (${recentTDs} TDs in last 3 games)`;
    } else if (recentTDs >= 1) {
      score = 1;
      reasoning = `Some recent production (${recentTDs} TD in last 3 games)`;
    } else {
      score = 0;
      reasoning = 'No recent TDs';
    }

    return { score, reasoning };
  }

  public generatePredictions(week: number): CombinedPrediction[] {
    console.log(`🏈 Generating Combined Volume + Defense Predictions for Week ${week}...\n`);

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

    // Generate combined predictions
    const predictions: CombinedPrediction[] = volumeCandidates.map(player => {
      const opponent = this.getOpponent(player.team, week, touchdownData);
      // Calculate volume score (60% weight)
      const volumeAnalysis = this.calculateVolumeScore(
        player.targets,
        player.carries,
        player.redZoneTargets + player.redZoneCarries
      );

      // Calculate defense score (30% weight)
      const defenseAnalysis = this.getDefenseScore(opponent, player.position);

      // Calculate historical score (10% weight)
      const historicalAnalysis = this.calculateHistoricalScore(player.playerName, week);

      // Calculate final weighted score
      const finalScore = Math.round(
        (volumeAnalysis.score * 0.6) +
        (defenseAnalysis.score * 0.3) +
        (historicalAnalysis.score * 0.1)
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

      // Combine reasoning
      const reasoning = [
        ...volumeAnalysis.reasoning,
        defenseAnalysis.reasoning,
        historicalAnalysis.reasoning
      ].filter(r => r !== 'No historical data' && r !== 'No recent TDs');

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
        historicalScore: historicalAnalysis.score,
        finalScore,
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
    console.log(`📊 Generated ${filteredPredictions.length} combined predictions`);

    return filteredPredictions;
  }
}