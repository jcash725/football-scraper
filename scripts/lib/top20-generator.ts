import { TDRecommendation, AnalysisData } from './types.js';
import { generateBasicRecommendations } from './recommendation-engine.js';
import { getPlayerTDsVsOpponent } from './data-fetcher.js';
import { DynamicPlayerValidator } from './dynamic-player-validator.js';
import { SimpleTouchdownTracker } from './simple-touchdown-tracker.js';

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
  
  // Add rookie boost before creating balanced list
  const rookieBoostRecs = await addRookieBoost(rusherRecs, receiverRecs, data);

  const balancedRecs = await createBalancedList(rookieBoostRecs.rushers, rookieBoostRecs.receivers);
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
  
  // Apply team limits with validation
  const topRushers = await applyTeamLimitsWithValidation(sortedRushers, 1, 8); // Max 1 rusher per team, up to 8 total
  const topReceivers = await applyTeamLimitsWithValidation(sortedReceivers, 2, 17); // Max 2 receivers per team, up to 17 total
  
  console.log(`Final mix: ${topRushers.length} rushers, ${topReceivers.length} receivers`);
  
  // Add historical data
  const allRecs = [...topRushers, ...topReceivers];
  await addHistoricalData(allRecs);
  
  // Final sort with historical priority
  return sortWithHistoricalPriority(allRecs);
}

async function applyTeamLimitsWithValidation(recommendations: TDRecommendation[], maxPerTeam: number, totalLimit: number): Promise<TDRecommendation[]> {
  const teamCounts = new Map<string, number>();
  const result: TDRecommendation[] = [];
  const validator = new DynamicPlayerValidator();

  console.log(`🏥 Validating top ${totalLimit} candidates for active status...`);

  let currentIndex = 0;
  while (result.length < totalLimit && currentIndex < recommendations.length) {
    const rec = recommendations[currentIndex];
    const currentTeamCount = teamCounts.get(rec.Team) || 0;

    if (currentTeamCount < maxPerTeam) {
      // Validate player status
      const validation = await validator.validatePlayer(rec.Player);

      if (validation.isActive) {
        console.log(`✅ ${rec.Player} (${rec.Team}) - Active - Added to list`);
        result.push(rec);
        teamCounts.set(rec.Team, currentTeamCount + 1);
      } else {
        console.log(`❌ ${rec.Player} (${rec.Team}) - ${validation.status} - Finding replacement...`);
        // Continue to next player for replacement
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    currentIndex++;
  }

  console.log(`📊 Final list: ${result.length}/${totalLimit} active players selected`);
  return result;
}

// Keep original function for backwards compatibility
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

async function addRookieBoost(rusherRecs: TDRecommendation[], receiverRecs: TDRecommendation[], analysisData: AnalysisData): Promise<{rushers: TDRecommendation[], receivers: TDRecommendation[]}> {
  console.log("🌟 Checking for high-performing rookies...");

  const touchdownTracker = new SimpleTouchdownTracker();
  const data2024 = touchdownTracker.loadTouchdownDatabase(2024);
  const data2025 = touchdownTracker.loadTouchdownDatabase(2025);

  if (!data2024 || !data2025) {
    console.log("❌ Could not load TD data for rookie analysis");
    return { rushers: rusherRecs, receivers: receiverRecs };
  }

  // Get 2024 player names for comparison
  const players2024 = new Set(data2024.playerGameStats.map(stat => normalizePlayerName(stat.playerName)));

  // Analyze 2025 rookies
  const rookieStats = analyzeRookiePerformance(data2025.playerGameStats, players2024);

  console.log(`Found ${rookieStats.length} qualifying rookies`);

  // Boost rookie recommendations
  const boostedRushers = boostRookieRecommendations(rusherRecs, rookieStats, 'rushing', analysisData);
  const boostedReceivers = boostRookieRecommendations(receiverRecs, rookieStats, 'receiving', analysisData);

  return { rushers: boostedRushers, receivers: boostedReceivers };
}

function normalizePlayerName(name: string): string {
  return name.toLowerCase().replace(/['\.\-]/g, '').trim();
}

function analyzeRookiePerformance(playerGameStats: any[], players2024: Set<string>): any[] {
  const rookieData = new Map<string, {
    name: string,
    team: string,
    totalGames: number,
    totalTDs: number,
    rushingTDs: number,
    receivingTDs: number,
    consistency: number
  }>();

  // Known veterans (definitely not rookies) - to avoid false positives
  const knownVeterans = new Set([
    'deebo samuel', 'deebo samuel sr', 'hunter renfrow', 'mike evans', 'davante adams',
    'keenan allen', 'stefon diggs', 'tyreek hill', 'calvin ridley', 'kirk cousins'
  ]);

  // Analyze each game stat
  for (const stat of playerGameStats) {
    const normalizedName = normalizePlayerName(stat.playerName);

    // Check if this player is a rookie (not in 2024 data AND not a known veteran)
    if (players2024.has(normalizedName) || knownVeterans.has(normalizedName)) {
      continue; // Not a rookie
    }

    const totalTDs = (stat.rushingTouchdowns || 0) + (stat.receivingTouchdowns || 0);
    if (totalTDs === 0) {
      continue; // No TDs this game
    }

    // Update rookie stats
    if (!rookieData.has(normalizedName)) {
      rookieData.set(normalizedName, {
        name: stat.playerName,
        team: stat.team,
        totalGames: 0,
        totalTDs: 0,
        rushingTDs: 0,
        receivingTDs: 0,
        consistency: 0
      });
    }

    const player = rookieData.get(normalizedName)!;
    player.totalGames++;
    player.totalTDs += totalTDs;
    player.rushingTDs += stat.rushingTouchdowns || 0;
    player.receivingTDs += stat.receivingTouchdowns || 0;
  }

  // Calculate consistency (TDs per game) and filter for high performers
  const qualifyingRookies = [];

  for (const [, player] of rookieData) {
    player.consistency = player.totalTDs / player.totalGames;

    // Criteria: At least 1 TD per game on average AND at least 2 total TDs
    if (player.consistency >= 1.0 && player.totalTDs >= 2) {
      console.log(`🌟 Qualifying rookie: ${player.name} (${player.team}) - ${player.totalTDs} TDs in ${player.totalGames} games (${player.consistency.toFixed(1)} per game)`);
      qualifyingRookies.push(player);
    }
  }

  return qualifyingRookies;
}

function boostRookieRecommendations(recommendations: TDRecommendation[], rookieStats: any[], type: 'rushing' | 'receiving', analysisData: AnalysisData): TDRecommendation[] {
  const boostedRecs = [...recommendations];

  for (const rookie of rookieStats) {
    const relevantTDs = type === 'rushing' ? rookie.rushingTDs : rookie.receivingTDs;

    if (relevantTDs === 0) {
      console.log(`⚠️ Skipping ${rookie.name} for ${type} - no ${type} TDs (has ${rookie.rushingTDs} rush, ${rookie.receivingTDs} receiving)`);
      continue; // Skip if no TDs of this type
    }

    // Check if rookie is already in recommendations
    const existingIndex = boostedRecs.findIndex(rec =>
      normalizePlayerName(rec.Player) === normalizePlayerName(rookie.name)
    );

    if (existingIndex >= 0) {
      // Massive boost for existing rookie recommendation
      const rec = boostedRecs[existingIndex];
      const originalValue = rec["Opponent Stat Value"];
      // Aggressive boost: +2.0 base + consistency multiplier for 1+ TD/game rookies
      const consistencyBoost = rookie.consistency >= 1.0 ? 2.0 + rookie.consistency : rookie.consistency * 0.5;

      rec["Opponent Stat Value"] = originalValue + consistencyBoost;
      rec["Rookie Boost"] = `+${consistencyBoost.toFixed(1)} (${rookie.consistency.toFixed(1)} TD/game)`;

      console.log(`🚀 MASSIVE rookie boost ${rec.Player}: ${originalValue.toFixed(1)} → ${rec["Opponent Stat Value"].toFixed(1)}`);
    } else {
      // Find if we can create a new recommendation for this rookie
      const playerInData = type === 'rushing' ?
        analysisData.rushingPlayers?.find((p: any) => normalizePlayerName(p.Player) === normalizePlayerName(rookie.name)) :
        analysisData.receivingPlayers?.find((p: any) => normalizePlayerName(p.Player) === normalizePlayerName(rookie.name));

      console.log(`🔍 Looking for ${rookie.name} in ${type} data... ${playerInData ? 'Found!' : 'Not found'}`);

      if (playerInData) { // Add all qualifying rookies
        // Create new recommendation with massive boost for high performers
        const baseValue = 2.0; // High base value to compete with veterans
        const consistencyBoost = rookie.consistency >= 1.0 ? 2.0 + rookie.consistency : rookie.consistency;
        const rookieScore = baseValue + consistencyBoost;

        const newRec: TDRecommendation = {
          Player: rookie.name,
          Team: rookie.team,
          Opponent: "TBD", // Will be filled by matchup logic
          "Player TDs YTD": rookie.totalTDs,
          "Player 2025 TDs": rookie.totalTDs,
          "Opponent Stat Value": rookieScore,
          Basis: `${type === 'rushing' ? 'Rush' : 'Pass'} TD - Rookie hotstreak`,
          "TDs vs Opponent Last Year (2024)": "Rookie - No 2024 data",
          Reason: `Rookie with ${rookie.consistency.toFixed(1)} TD/game consistency`,
          "Rookie Boost": `MASSIVE boost (${rookie.consistency.toFixed(1)} TD/game)`
        };

        boostedRecs.push(newRec);
        console.log(`⭐ Added ELITE rookie ${rookie.name}: ${rookieScore.toFixed(1)} projected value (${rookie.consistency.toFixed(1)} TD/game)`);
      }
    }
  }

  return boostedRecs;
}

// Add interface extension for rookie boost
declare module './types.js' {
  interface TDRecommendation {
    "Rookie Boost"?: string;
  }
}