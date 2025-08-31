import { TDRecommendation, AnalysisData } from './types.js';
import { generateBasicRecommendations } from './recommendation-engine.js';
import { getPlayerTDsVsOpponent } from './data-fetcher.js';

export async function generateTop20List(data: AnalysisData): Promise<TDRecommendation[]> {
  console.log("Generating initial recommendations...");
  
  // Debug: Check rushing players
  console.log(`Sample rushing players: ${data.rushingPlayers.slice(0, 3).map(p => `${p.Player} (${p.Team})`).join(', ')}`);
  console.log(`Sample matchups: ${data.matchups.slice(0, 3).map(m => `${m.away_team} @ ${m.home_team}`).join(', ')}`);
  
  const allRecs = generateBasicRecommendations(
    data.rushingPlayers,
    data.receivingPlayers,
    data.opponentRushTDs,
    data.opponentPassTDs,
    data.matchups
  );
  
  console.log(`Generated ${allRecs.length} initial recommendations`);
  const rusherRecs = allRecs.filter(r => r.Basis.includes("Rush"));
  const receiverRecs = allRecs.filter(r => r.Basis.includes("Pass"));
  console.log(`Breakdown: ${rusherRecs.length} rushers, ${receiverRecs.length} receivers`);
  
  // Debug: Show top rushing recommendations
  const debugTopRushers = rusherRecs.sort((a, b) => b["Opponent Stat Value"] - a["Opponent Stat Value"]).slice(0, 5);
  console.log("Top 5 rushing recommendations:");
  debugTopRushers.forEach((r, i) => {
    console.log(`  ${i+1}. ${r.Player} (${r.Team}) vs ${r.Opponent} - ${r["Opponent Stat Value"]} rush TDs/game allowed`);
  });
  
  const balancedRecs = await createBalancedList(rusherRecs, receiverRecs);
  return balancedRecs.slice(0, 20);
}

async function createBalancedList(rusherRecs: TDRecommendation[], receiverRecs: TDRecommendation[]): Promise<TDRecommendation[]> {
  // Sort by quality
  const sortedRushers = rusherRecs.sort((a, b) => {
    if (b["Opponent Stat Value"] !== a["Opponent Stat Value"]) {
      return b["Opponent Stat Value"] - a["Opponent Stat Value"];
    }
    return b["Player TDs YTD"] - a["Player TDs YTD"];
  });
  
  const sortedReceivers = receiverRecs.sort((a, b) => {
    if (b["Opponent Stat Value"] !== a["Opponent Stat Value"]) {
      return b["Opponent Stat Value"] - a["Opponent Stat Value"];
    }
    return b["Player TDs YTD"] - a["Player TDs YTD"];
  });
  
  // Apply team limits
  const topRushers = applyTeamLimits(sortedRushers, 1, 8); // Max 1 rusher per team, up to 8 total
  const topReceivers = applyTeamLimits(sortedReceivers, 2, 17); // Max 2 receivers per team, up to 17 total
  
  console.log(`Final mix: ${topRushers.length} rushers, ${topReceivers.length} receivers`);
  
  // Add historical data
  const allRecs = [...topRushers, ...topReceivers];
  await addHistoricalData(allRecs);
  
  // Final sort with historical priority
  return sortWithHistoricalPriority(allRecs);
}

function applyTeamLimits(recommendations: TDRecommendation[], maxPerTeam: number, totalLimit: number): TDRecommendation[] {
  const teamCounts = new Map<string, number>();
  const result: TDRecommendation[] = [];
  
  for (const rec of recommendations) {
    const currentTeamCount = teamCounts.get(rec.Team) || 0;
    if (currentTeamCount < maxPerTeam && result.length < totalLimit) {
      result.push(rec);
      teamCounts.set(rec.Team, currentTeamCount + 1);
    }
  }
  
  return result;
}

async function addHistoricalData(recommendations: TDRecommendation[]): Promise<void> {
  console.log("Looking up historical TD data...");
  
  for (const rec of recommendations) {
    const tdType = rec.Basis.includes("Rush") ? "rushing" : "receiving";
    console.log(`Checking ${rec.Player} ${tdType} TDs vs ${rec.Opponent}...`);
    
    const historicalTDs = await getPlayerTDsVsOpponent(rec.Player, rec.Team, rec.Opponent, tdType);
    rec["TDs vs Opponent Last Year (2024)"] = historicalTDs;
  }
}

function sortWithHistoricalPriority(recommendations: TDRecommendation[]): TDRecommendation[] {
  return recommendations.sort((a, b) => {
    // Primary sort: opponent stat value (with rusher boost)
    const aValue = a.Basis.includes("Rush") ? a["Opponent Stat Value"] + 0.2 : a["Opponent Stat Value"];
    const bValue = b.Basis.includes("Rush") ? b["Opponent Stat Value"] + 0.2 : b["Opponent Stat Value"];
    
    if (bValue !== aValue) {
      return bValue - aValue;
    }
    
    // Secondary sort: historical success
    const aHistorical = a["TDs vs Opponent Last Year (2024)"];
    const bHistorical = b["TDs vs Opponent Last Year (2024)"];
    
    const aHasHistory = aHistorical !== "N/A — not verifiable" && aHistorical !== "0";
    const bHasHistory = bHistorical !== "N/A — not verifiable" && bHistorical !== "0";
    
    if (aHasHistory && !bHasHistory) return -1;
    if (bHasHistory && !aHasHistory) return 1;
    
    // If both have history, sort by TD count
    if (aHasHistory && bHasHistory) {
      const aCount = parseInt(aHistorical) || 0;
      const bCount = parseInt(bHistorical) || 0;
      if (bCount !== aCount) return bCount - aCount;
    }
    
    // Tertiary sort: player TDs this year
    return b["Player TDs YTD"] - a["Player TDs YTD"];
  });
}