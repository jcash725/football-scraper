import fs from 'fs';
import path from 'path';
import { loadData } from './lib/data-loader.js';
import { generateTop20List } from './lib/top20-generator.js';
import { formatAsHTML } from './lib/html-generator.js';
import { dataHasChanged, loadExistingRecommendations } from './lib/change-detector.js';
import { EnhancedMLTDPredictor } from './lib/enhanced-ml-predictor.js';
import { getShortTeamName, getFullTeamName } from './lib/team-mappings.js';
import { PredictionTracker } from './lib/prediction-tracker.js';

async function main() {
  try {
    console.log("Generating TD Bet Recommendations with Dual Model System...");
    
    const data = loadData();
    
    // Generate current model recommendations
    console.log("\n🔄 Current Model Analysis...");
    const currentTop20 = await generateTop20List(data);
    console.log(`Current model generated ${currentTop20.length} recommendations`);
    
    // Initialize Enhanced ML model with 2024 data
    console.log("\n🤖 Enhanced ML Model Analysis (2024 Data)...");
    const mlPredictor = new EnhancedMLTDPredictor();
    await mlPredictor.initialize();
    
    // Generate ML predictions for all eligible players
    const mlPredictions = await generateMLPredictions(mlPredictor, data);
    console.log(`ML model generated ${mlPredictions.length} predictions`);
    
    // Create model comparison
    const comparison = createModelComparison(currentTop20, mlPredictions);
    console.log(`\n📊 Model Agreement: ${comparison.agreement.toFixed(1)}%`);
    
    // Save weekly predictions for accuracy tracking
    const predictionTracker = new PredictionTracker();
    const currentWeek = getCurrentNFLWeek();
    predictionTracker.saveWeeklyPredictions(currentWeek.week, currentWeek.year, currentTop20, mlPredictions);
    
    const outputDir = path.join(process.cwd(), 'data');
    const jsonPath = path.join(outputDir, 'td-bet-recommendations.json');
    const htmlPath = path.join(outputDir, 'td-bet-recommendations.html');
    const comparisonPath = path.join(outputDir, 'model-comparison.json');
    
    // Check for changes in current model
    const existingRecommendations = await loadExistingRecommendations(jsonPath);
    const changeResult = dataHasChanged(currentTop20, existingRecommendations);
    
    if (changeResult.hasChanged || !fs.existsSync(htmlPath)) {
      // Save current model JSON
      fs.writeFileSync(jsonPath, JSON.stringify({
        generatedAt: new Date().toISOString(),
        instructions: "🔒 Updated Instructions for TD Bets GPT",
        model: "current",
        count: currentTop20.length,
        recommendations: currentTop20
      }, null, 2));
      
      // Save model comparison
      fs.writeFileSync(comparisonPath, JSON.stringify({
        generatedAt: new Date().toISOString(),
        ...comparison
      }, null, 2));
      
      // Save HTML with both models
      fs.writeFileSync(htmlPath, formatAsHTML(currentTop20, mlPredictions, comparison));
      
      // Save weekly archived HTML file
      const weeklyHtmlPath = path.join(outputDir, `week-${currentWeek.week}-${currentWeek.year}-predictions.html`);
      const weeklyTitle = `Week ${currentWeek.week} ${currentWeek.year} TD Predictions`;
      fs.writeFileSync(weeklyHtmlPath, formatAsHTML(currentTop20, mlPredictions, comparison, weeklyTitle));
      
      console.log(`✅ Updated recommendations - ${changeResult.summary}`);
      console.log("  - data/td-bet-recommendations.json (Current model)");
      console.log("  - data/model-comparison.json (Both models)");
      console.log("  - data/td-bet-recommendations.html (Dual model view)");
      console.log(`  - ${weeklyHtmlPath} (Week ${currentWeek.week} archive)`);
    } else {
      console.log(`⏭️  Skipped TD recommendations - ${changeResult.summary}`);
    }
    
  } catch (error) {
    console.error("Error generating recommendations:", error);
    process.exit(1);
  }
}

async function generateMLPredictions(mlPredictor: EnhancedMLTDPredictor, data: any): Promise<any[]> {
  const allPlayers = [...data.rushingPlayers, ...data.receivingPlayers];
  const predictions: any[] = [];
  
  console.log(`Processing ${allPlayers.length} players for Enhanced ML predictions...`);
  
  for (const player of allPlayers) {
    // Convert full team name to short name for matchup lookup
    const shortTeamName = getShortTeamName(player.Team);
    
    // Find matchup - check both full and short team names
    const matchup = data.matchups.find((m: any) => 
      m.home_team === shortTeamName || m.away_team === shortTeamName ||
      m.home_team === player.Team || m.away_team === player.Team
    );
    
    if (!matchup) {
      console.log(`No matchup found for ${player.Player} (${player.Team} -> ${shortTeamName})`);
      continue;
    }
    
    // Determine opponent and home/away status
    let opponent: string;
    let isHome: boolean;
    
    if (matchup.home_team === shortTeamName || matchup.home_team === player.Team) {
      opponent = matchup.away_team;
      isHome = true;
    } else {
      opponent = matchup.home_team;
      isHome = false;
    }
    
    // Map opponent to full name for Enhanced ML model
    // If opponent is already a full name, use it; otherwise map from short name
    const opponentFullName = opponent.includes(' ') ? opponent : getFullTeamName(opponent);
    
    if (!player.Value || player.Value < 1) {
      continue; // Skip players with no TDs
    }
    
    try {
      // Use Enhanced ML model with actual 2024 data
      const prediction = mlPredictor.predictForPlayer(
        player.Player,
        player.Team,
        opponentFullName,
        isHome,
        player.Pos || 'WR'
      );
      
      predictions.push({
        player: prediction.player,
        team: prediction.team,
        opponent: prediction.opponent,
        position: prediction.position,
        mlProbability: prediction.mlProbability,
        mlConfidence: prediction.mlConfidence,
        keyFactors: prediction.keyFactors,
        mlRank: 0, // Will be set after sorting
        playerTDsYTD: player.Value,
        actual2024TDs: prediction.historicalData.totalTDs2024,
        actual2024Games: prediction.historicalData.games,
        vsOpponentTDs: prediction.historicalData.vsOpponent,
        basis: `2024 Data: ${prediction.historicalData.totalTDs2024} TDs in ${prediction.historicalData.games} games`
      });
      
    } catch (error) {
      // Player might not have 2024 data, skip silently
      continue;
    }
  }
  
  // Remove duplicates (same player/opponent combination)
  const uniquePredictions = predictions.reduce((unique: any[], pred) => {
    const key = `${pred.player}-${pred.opponent}`;
    const existing = unique.find(p => `${p.player}-${p.opponent}` === key);
    
    if (!existing) {
      unique.push(pred);
    } else if (pred.mlProbability > existing.mlProbability) {
      // Replace with higher probability prediction
      const index = unique.indexOf(existing);
      unique[index] = pred;
    }
    
    return unique;
  }, []);
  
  // Sort by ML probability and assign ranks
  uniquePredictions.sort((a, b) => b.mlProbability - a.mlProbability);
  uniquePredictions.forEach((pred, index) => {
    pred.mlRank = index + 1;
  });
  
  return uniquePredictions.slice(0, 20); // Top 20 Enhanced ML predictions
}

function getCurrentNFLWeek(): { week: number, year: number } {
  const now = new Date();
  
  // NFL 2025 season started September 5, 2025
  const seasonStart = new Date(2025, 8, 5); // September 5, 2025
  const daysSinceStart = Math.floor((now.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSinceStart < 0) {
    // Before season starts
    return { week: 1, year: 2025 };
  }
  
  // Each week is 7 days, Week 1 = days 0-6, Week 2 = days 7-13, etc.
  // But we want to generate predictions for upcoming games, so:
  // If we're in the middle of Week 1 (days 3-6), generate Week 2 predictions
  // If we're at start of Week 1 (days 0-2), generate Week 1 predictions
  let week = Math.floor(daysSinceStart / 7) + 1;
  
  // If we're past Tuesday of the current week, generate next week's predictions
  const dayOfWeek = daysSinceStart % 7;
  if (dayOfWeek >= 3) { // Wednesday or later, generate next week
    week += 1;
  }
  
  // Cap at reasonable week numbers (regular season is 18 weeks)
  const currentWeek = Math.min(week, 18);
  
  return { week: currentWeek, year: 2025 };
}

function createModelComparison(currentModel: any[], mlModel: any[]): any {
  const currentPlayers = new Set(currentModel.map(r => r.Player));
  const mlPlayers = new Set(mlModel.map(r => r.player));
  
  // Calculate overlap in top 20
  const overlap = [...currentPlayers].filter(player => mlPlayers.has(player));
  const agreement = (overlap.length / 20) * 100;
  
  // Find differences
  const onlyInCurrent = currentModel
    .filter(r => !mlPlayers.has(r.Player))
    .map(r => r.Player);
    
  const onlyInML = mlModel
    .filter(r => !currentPlayers.has(r.player))
    .map(r => r.player);
    
  // Find ranking differences for overlapping players
  const rankingDifferences = overlap.map(player => {
    const currentRank = currentModel.findIndex(r => r.Player === player) + 1;
    const mlRank = mlModel.findIndex(r => r.player === player) + 1;
    return {
      player,
      currentRank,
      mlRank,
      difference: Math.abs(currentRank - mlRank)
    };
  }).sort((a, b) => b.difference - a.difference);
  
  return {
    currentModel,
    mlModel,
    agreement,
    differences: {
      onlyInCurrent,
      onlyInML,
      rankingDifferences
    }
  };
}

main();