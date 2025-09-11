// Type definitions for the TD analysis system

export interface Player {
  Player: string;
  Team: string;
  Value: number;
  season2025Value?: number;
}

export interface TeamStat {
  Team: string;
  "2024": number;
  Rank: number;
}

export interface Matchup {
  away_team: string;
  home_team: string;
  date: string;
  time: string;
}

export interface TDRecommendation {
  Player: string;
  Team: string;
  Opponent: string;
  Basis: string;
  "Opponent Stat Value": number;
  "Player TDs YTD": number;
  "Player 2025 TDs": number;
  "TDs vs Opponent Last Year (2024)": string;
  Reason: string;
}

export interface AnalysisData {
  rushingPlayers: Player[];
  receivingPlayers: Player[];
  opponentRushTDs: TeamStat[];
  opponentPassTDs: TeamStat[];
  matchups: Matchup[];
}