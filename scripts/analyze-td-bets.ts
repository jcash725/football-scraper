import fs from 'fs';
import path from 'path';
import { loadData } from './lib/data-loader.js';
import { generateTop20List } from './lib/top20-generator.js';
import { formatAsHTML } from './lib/html-generator.js';
import { dataHasChanged, loadExistingRecommendations } from './lib/change-detector.js';
import { MLTDPredictor } from './lib/ml-predictor.js';
import { getShortTeamName } from './lib/team-mappings.js';

async function main() {
  try {
    console.log("Generating TD Bet Recommendations with Dual Model System...");
    
    const data = loadData();
    
    // Generate current model recommendations
    console.log("\n🔄 Current Model Analysis...");
    const currentTop20 = await generateTop20List(data);
    console.log(`Current model generated ${currentTop20.length} recommendations`);
    
    // Initialize ML model
    console.log("\n🤖 ML Model Analysis...");
    const mlPredictor = new MLTDPredictor();
    await mlPredictor.initialize();
    
    // Generate ML predictions for all eligible players
    const mlPredictions = await generateMLPredictions(mlPredictor, data);
    console.log(`ML model generated ${mlPredictions.length} predictions`);
    
    // Create model comparison
    const comparison = createModelComparison(currentTop20, mlPredictions);
    console.log(`\n📊 Model Agreement: ${comparison.agreement.toFixed(1)}%`);
    
    const outputDir = path.join(process.cwd(), 'data');
    const jsonPath = path.join(outputDir, 'td-bet-recommendations.json');
    const htmlPath = path.join(outputDir, 'td-bet-recommendations.html');
    const comparisonPath = path.join(outputDir, 'model-comparison.json');
    
    // Check for changes in current model
    const existingRecommendations = await loadExistingRecommendations(jsonPath);
    const changeResult = dataHasChanged(currentTop20, existingRecommendations);
    
    if (changeResult.hasChanged) {
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
      
      console.log(`✅ Updated recommendations - ${changeResult.summary}`);
      console.log("  - data/td-bet-recommendations.json (Current model)");
      console.log("  - data/model-comparison.json (Both models)");
      console.log("  - data/td-bet-recommendations.html (Dual model view)");
    } else {
      console.log(`⏭️  Skipped TD recommendations - ${changeResult.summary}`);
    }
    
  } catch (error) {
    console.error("Error generating recommendations:", error);
    process.exit(1);
  }
}

async function generateMLPredictions(mlPredictor: MLTDPredictor, data: any): Promise<any[]> {
  const allPlayers = [...data.rushingPlayers, ...data.receivingPlayers];
  const predictions: any[] = [];
  
  console.log(`Processing ${allPlayers.length} players for ML predictions...`);
  
  for (const player of allPlayers) {
    // Convert full team name to short name for matchup lookup
    const shortTeamName = getShortTeamName(player.Team);
    
    // Find matchup and opponent defense stats
    const matchup = data.matchups.find((m: any) => 
      m.home_team === shortTeamName || m.away_team === shortTeamName
    );
    
    if (!matchup) {
      console.log(`No matchup found for ${player.Player} (${player.Team} -> ${shortTeamName})`);
      continue;
    }
    
    const opponent = matchup.home_team === shortTeamName ? matchup.away_team : matchup.home_team;
    const isRusher = player.Pos?.includes('RB') || player.Pos?.includes('QB');
    
    // Get opponent defensive stats
    const oppDefense = isRusher 
      ? data.opponentRushTDs.find((d: any) => d.Team === opponent)
      : data.opponentPassTDs.find((d: any) => d.Team === opponent);
      
    if (!oppDefense) {
      console.log(`No defense stats found for ${opponent} (${isRusher ? 'rush' : 'pass'})`);
      continue;
    }
    if (!player.Value) {
      console.log(`No TDs for ${player.Player}`);
      continue;
    }
    if (player.Value < 2) {
      console.log(`${player.Player} has only ${player.Value} TDs, skipping`);
      continue;
    }
    
    // Extract features
    const features = mlPredictor.extractFeatures(player, oppDefense, matchup);
    const prediction = mlPredictor.predict(features);
    
    predictions.push({
      player: player.Player,
      team: player.Team,
      opponent: opponent,
      position: player.Pos || 'Unknown',
      mlProbability: prediction.probability,
      mlConfidence: prediction.confidence,
      keyFactors: prediction.factors,
      mlRank: 0, // Will be set after sorting
      playerTDsYTD: player.Value,
      basis: isRusher ? 'Rush TD Prediction' : 'Pass TD Prediction'
    });
  }
  
  // Sort by ML probability and assign ranks
  predictions.sort((a, b) => b.mlProbability - a.mlProbability);
  predictions.forEach((pred, index) => {
    pred.mlRank = index + 1;
  });
  
  return predictions.slice(0, 20); // Top 20 ML predictions
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