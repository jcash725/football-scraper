// Dynamic recommendation engine that handles full team names directly
import { Player, TeamStat, Matchup, TDRecommendation } from './types.js';

export function isPrimaryPlayer(player: Player, allPlayers: Player[]): boolean {
  const teamPlayers = allPlayers.filter(p => p.Team === player.Team);
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
  // Try exact match first
  let stat = stats.find(s => s.Team === opponent);
  if (stat) return stat["2024"];
  
  // Try partial match (team name mapping)
  stat = stats.find(s => {
    const statTeamWords = s.Team.toLowerCase().split(' ');
    const opponentWords = opponent.toLowerCase().split(' ');
    return statTeamWords.some(word => opponentWords.includes(word)) ||
           opponentWords.some(word => statTeamWords.includes(word));
  });
  
  return stat ? stat["2024"] : 0;
}

export function generateDynamicRecommendations(
  rushingPlayers: Player[],
  receivingPlayers: Player[],
  opponentRushTDs: TeamStat[],
  opponentPassTDs: TeamStat[],
  matchups: Matchup[]
): TDRecommendation[] {
  const recommendations: TDRecommendation[] = [];
  
  console.log(`Processing ${rushingPlayers.length} rushing players and ${receivingPlayers.length} receiving players...`);
  
  // Debug player values first
  console.log('Sample rushing player values:', rushingPlayers.slice(0, 10).map(p => `${p.Player}: ${p.Value} TDs`));
  
  // Enhanced filtering for rushers  
  const rushersWithTDs = rushingPlayers.filter(p => p.Value >= 1);
  console.log(`Players with ≥1 rushing TD: ${rushersWithTDs.length}`);
  
  const eligibleRushers = rushingPlayers
    .filter(p => p.Value >= 1) // Any production
    .filter(p => isPrimaryPlayer(p, rushingPlayers)); // Only primary players
    
  console.log(`Found ${eligibleRushers.length} eligible rushing players after primary filter`);
    
  for (const player of eligibleRushers) {
    const opponent = getOpponent(player.Team, matchups);
    if (!opponent) {
      console.log(`No opponent found for ${player.Player} (${player.Team})`);
      continue;
    }
    
    const opponentStatValue = getOpponentStat(opponent, opponentRushTDs);
    
    recommendations.push({
      Player: player.Player,
      Team: player.Team,
      Opponent: opponent,
      Basis: "Opp Rush TD/G",
      "Opponent Stat Value": opponentStatValue,
      "Player TDs YTD": player.Value,
      "TDs vs Opponent Last Year (2024)": "N/A — not verifiable",
      Reason: `${player.Team} vs ${opponent} - opponent allows ${opponentStatValue} rush TDs/game`
    });
    
    console.log(`✅ Added rushing rec: ${player.Player} (${player.Team}) vs ${opponent}`);
  }
  
  // Debug receiving values first
  console.log('Sample receiving player values:', receivingPlayers.slice(0, 10).map(p => `${p.Player}: ${p.Value} TDs`));
  
  // Enhanced filtering for receivers
  const receiversWithTDs = receivingPlayers.filter(p => p.Value >= 1);
  console.log(`Players with ≥1 receiving TD: ${receiversWithTDs.length}`);
  
  const eligibleReceivers = receivingPlayers
    .filter(p => p.Value >= 1) // Any production
    .filter(p => isPrimaryPlayer(p, receivingPlayers)); // Only primary players
    
  console.log(`Found ${eligibleReceivers.length} eligible receiving players after primary filter`);
    
  for (const player of eligibleReceivers) {
    const opponent = getOpponent(player.Team, matchups);
    if (!opponent) {
      console.log(`No opponent found for ${player.Player} (${player.Team})`);
      continue;
    }
    
    const opponentStatValue = getOpponentStat(opponent, opponentPassTDs);
    
    recommendations.push({
      Player: player.Player,
      Team: player.Team,
      Opponent: opponent,
      Basis: "Opp Pass TD/G",
      "Opponent Stat Value": opponentStatValue,
      "Player TDs YTD": player.Value,
      "TDs vs Opponent Last Year (2024)": "N/A — not verifiable",
      Reason: `${player.Team} vs ${opponent} - opponent allows ${opponentStatValue} pass TDs/game`
    });
    
    console.log(`✅ Added receiving rec: ${player.Player} (${player.Team}) vs ${opponent}`);
  }
  
  console.log(`Generated ${recommendations.length} total recommendations`);
  return recommendations;
}