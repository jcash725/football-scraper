// Core recommendation generation logic
import { Player, TeamStat, Matchup, TDRecommendation } from './types.js';
import { getShortTeamName } from './team-mappings.js';

export function isPrimaryPlayer(player: Player, allPlayers: Player[]): boolean {
  const teamPlayers = allPlayers.filter(p => getShortTeamName(p.Team) === getShortTeamName(player.Team));
  const sortedTeamPlayers = teamPlayers.sort((a, b) => b.Value - a.Value);
  
  // Consider top 2 TD scorers per team as primary
  const playerRank = sortedTeamPlayers.findIndex(p => p.Player === player.Player) + 1;
  return playerRank <= 2;
}

export function getOpponent(team: string, matchups: Matchup[]): string | null {
  for (const matchup of matchups) {
    if (matchup.home_team === team) {
      return matchup.away_team;
    }
    if (matchup.away_team === team) {
      return matchup.home_team;
    }
  }
  return null;
}

export function getOpponentStat(opponent: string, stats: TeamStat[]): number {
  const stat = stats.find(s => s.Team === opponent);
  return stat ? stat["2024"] : 0;
}

export function generateBasicRecommendations(
  rushingPlayers: Player[],
  receivingPlayers: Player[],
  opponentRushTDs: TeamStat[],
  opponentPassTDs: TeamStat[],
  matchups: Matchup[]
): TDRecommendation[] {
  const recommendations: TDRecommendation[] = [];
  
  // Enhanced filtering for rushers
  const eligibleRushers = rushingPlayers
    .filter(p => p.Value >= 5) // Minimum 5 TDs
    .filter(p => isPrimaryPlayer(p, rushingPlayers)); // Only primary players
    
  for (const player of eligibleRushers) {
    const shortTeamName = getShortTeamName(player.Team);
    const opponent = getOpponent(shortTeamName, matchups);
    if (!opponent) continue;
    
    const opponentStatValue = getOpponentStat(opponent, opponentRushTDs);
    
    recommendations.push({
      Player: player.Player,
      Team: shortTeamName,
      Opponent: opponent,
      Basis: "Opp Rush TD/G",
      "Opponent Stat Value": opponentStatValue,
      "Player TDs YTD": player.Value,
      "TDs vs Opponent Last Year (2024)": "N/A — not verifiable",
      Reason: `${shortTeamName} vs ${opponent} - opponent allows ${opponentStatValue} rush TDs/game`
    });
  }
  
  // Enhanced filtering for receivers
  const eligibleReceivers = receivingPlayers
    .filter(p => p.Value >= 4) // Minimum 4 TDs for receivers
    .filter(p => isPrimaryPlayer(p, receivingPlayers)); // Only primary players
    
  for (const player of eligibleReceivers) {
    const shortTeamName = getShortTeamName(player.Team);
    const opponent = getOpponent(shortTeamName, matchups);
    if (!opponent) continue;
    
    const opponentStatValue = getOpponentStat(opponent, opponentPassTDs);
    
    recommendations.push({
      Player: player.Player,
      Team: shortTeamName,
      Opponent: opponent,
      Basis: "Opp Pass TD/G",
      "Opponent Stat Value": opponentStatValue,
      "Player TDs YTD": player.Value,
      "TDs vs Opponent Last Year (2024)": "N/A — not verifiable",
      Reason: `${shortTeamName} vs ${opponent} - opponent allows ${opponentStatValue} pass TDs/game`
    });
  }
  
  return recommendations;
}