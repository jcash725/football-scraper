#!/usr/bin/env npx tsx

import fs from 'fs';
import path from 'path';

function readJsonFile(filename: string): any {
  const fullPath = path.join(process.cwd(), filename);
  const content = fs.readFileSync(fullPath, 'utf8');
  return JSON.parse(content);
}
import { generateTop20List } from './lib/top20-generator.js';
import { EnhancedMLTDPredictor } from './lib/enhanced-ml-predictor.js';
import { AnalysisData, Player, TeamStat, Matchup, TDRecommendation } from './lib/types.js';
import { getShortTeamName, getFullTeamName } from './lib/team-mappings.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface SeasonData {
  rushingPlayers: Player[];
  receivingPlayers: Player[];
}

interface WeeklyConfig {
  targetWeek: number;
  season: number;
}

async function loadSeasonData(season: number): Promise<SeasonData> {
  console.log(`Loading ${season} season touchdown data...`);
  
  try {
    // For 2024 data, we use the current files (they contain 2024 data)
    let rushingFile = 'data/rushing-touchdowns-players.json';
    let receivingFile = 'data/receiving-touchdowns-players.json';
    
    if (season !== 2024) {
      // Future enhancement: support multiple seasons
      console.warn(`Data for season ${season} not available, using 2024 data`);
    }
    
    const rushingData = await readJsonFile(rushingFile);
    const receivingData = await readJsonFile(receivingFile);
    
    return {
      rushingPlayers: rushingData.rows || [],
      receivingPlayers: receivingData.rows || []
    };
  } catch (error) {
    console.warn(`Could not load ${season} data:`, error);
    return {
      rushingPlayers: [],
      receivingPlayers: []
    };
  }
}

async function loadCurrentSeasonData(targetWeek: number): Promise<SeasonData> {
  console.log(`Loading 2025 season data through Week ${targetWeek - 1}...`);
  
  try {
    // For now, we'll use Week 1 actuals when predicting Week 2+
    if (targetWeek > 1) {
      const week1Data = await readJsonFile('data/touchdown-history-2025.json');
      
      // Convert actual touchdown data to Player format
      const rushingPlayers: Player[] = [];
      const receivingPlayers: Player[] = [];
      
      for (const gameStats of week1Data.playerGameStats || []) {
        // Add rushing TDs if any
        if (gameStats.rushingTouchdowns > 0) {
          rushingPlayers.push({
            Player: gameStats.playerName,
            Team: gameStats.team,
            Value: gameStats.rushingTouchdowns
          });
        }
        
        // Add receiving TDs if any  
        if (gameStats.receivingTouchdowns > 0) {
          receivingPlayers.push({
            Player: gameStats.playerName,
            Team: gameStats.team,
            Value: gameStats.receivingTouchdowns
          });
        }
      }
      
      // Aggregate multiple TDs by same player
      const aggregateRushing = aggregatePlayerTDs(rushingPlayers);
      const aggregateReceiving = aggregatePlayerTDs(receivingPlayers);
      
      console.log(`Found ${aggregateRushing.length} rushing TD scorers and ${aggregateReceiving.length} receiving TD scorers from previous weeks`);
      
      return {
        rushingPlayers: aggregateRushing,
        receivingPlayers: aggregateReceiving
      };
    }
    
    return { rushingPlayers: [], receivingPlayers: [] };
  } catch (error) {
    console.warn('Could not load current season data:', error);
    return { rushingPlayers: [], receivingPlayers: [] };
  }
}

function aggregatePlayerTDs(players: Player[]): Player[] {
  const playerMap = new Map<string, Player>();
  
  for (const player of players) {
    const key = `${player.Player}|${player.Team}`;
    if (playerMap.has(key)) {
      const existing = playerMap.get(key)!;
      existing.Value += player.Value;
    } else {
      playerMap.set(key, { ...player });
    }
  }
  
  return Array.from(playerMap.values());
}

function combineSeasonData(season2024: SeasonData, season2025: SeasonData): SeasonData {
  console.log('Combining 2024 and 2025 season data...');
  
  // Combine players, prioritizing 2025 data but adding 2024 context
  const combinedRushing = mergePlayers(season2024.rushingPlayers, season2025.rushingPlayers);
  const combinedReceiving = mergePlayers(season2024.receivingPlayers, season2025.receivingPlayers);
  
  console.log(`Combined data: ${combinedRushing.length} rushing players, ${combinedReceiving.length} receiving players`);
  
  return {
    rushingPlayers: combinedRushing,
    receivingPlayers: combinedReceiving
  };
}

function mergePlayers(season2024: Player[], season2025: Player[]): Player[] {
  const playerMap = new Map<string, any>();
  
  // First add all 2024 players
  for (const player of season2024) {
    const key = `${player.Player}|${player.Team}`;
    playerMap.set(key, {
      Player: player.Player,
      Team: player.Team,
      Value: player.Value, // 2024 TDs for eligibility
      season2024Value: player.Value,
      season2025Value: 0 // Will be updated with 2025 data
    });
  }
  
  // Then add/update with 2025 data
  for (const player of season2025) {
    const key = `${player.Player}|${player.Team}`;
    if (playerMap.has(key)) {
      const existing = playerMap.get(key)!;
      existing.season2025Value = player.Value; // Current season TDs
    } else {
      // New player not in 2024 data
      playerMap.set(key, {
        Player: player.Player,
        Team: player.Team,
        Value: 0, // No 2024 data
        season2024Value: 0,
        season2025Value: player.Value
      });
    }
  }
  
  // Filter to players with either current season production or significant 2024 production
  // Return as enhanced Player interface
  return Array.from(playerMap.values())
    .filter(p => p.season2025Value > 0 || p.season2024Value >= 3)
    .map(p => ({
      Player: p.Player,
      Team: p.Team,
      Value: p.season2024Value, // Use 2024 season TD count for eligibility
      season2025Value: p.season2025Value // Store 2025 TDs separately
    }));
}

async function loadOpponentStats(): Promise<{ rushTDs: TeamStat[], passTDs: TeamStat[] }> {
  console.log('Loading opponent defensive stats...');
  
  const rushTDs = await readJsonFile('data/opponent-rushing-tds.json');
  const passTDs = await readJsonFile('data/opponent-passing-tds.json');
  
  return {
    rushTDs: rushTDs.rows || [],
    passTDs: passTDs.rows || []
  };
}

async function loadMatchups(week: number): Promise<Matchup[]> {
  console.log(`Loading Week ${week} matchups...`);
  
  const matchupData = await readJsonFile('data/weekly-matchups.json');
  
  if (matchupData.week !== week) {
    console.warn(`Warning: Loaded matchups are for Week ${matchupData.week}, but predicting for Week ${week}`);
  }
  
  return matchupData.rows || [];
}

async function generateWeeklyPredictions(config: WeeklyConfig): Promise<{currentTop20: TDRecommendation[], mlPredictions: any[], comparison: any}> {
  console.log(`\n=== Generating Week ${config.targetWeek} TD Predictions ===`);
  
  // Load 2024 season data
  const season2024 = await loadSeasonData(2024);
  
  // Load current season data through previous weeks
  const season2025 = await loadCurrentSeasonData(config.targetWeek);
  
  // Combine the datasets
  const combinedData = combineSeasonData(season2024, season2025);
  
  // Load opponent defensive stats and matchups
  const { rushTDs, passTDs } = await loadOpponentStats();
  const matchups = await loadMatchups(config.targetWeek);
  
  // Create analysis data structure
  const analysisData: AnalysisData = {
    rushingPlayers: combinedData.rushingPlayers,
    receivingPlayers: combinedData.receivingPlayers,
    opponentRushTDs: rushTDs,
    opponentPassTDs: passTDs,
    matchups: matchups
  };
  
  // Debug team name mapping issues
  console.log('\n🔍 Debugging team name mapping...');
  console.log('Sample player teams:', analysisData.rushingPlayers.slice(0, 3).map(p => p.Team));
  console.log('Sample matchup teams:', analysisData.matchups.slice(0, 3).map(m => `${m.away_team} @ ${m.home_team}`));
  
  // Fix team name mismatches by converting player teams to match matchup format
  console.log('Converting player teams to match matchup format...');
  
  // Check if teams are already matching (they should be)
  const teamsMatch = analysisData.rushingPlayers.every(p => 
    p.Team && analysisData.matchups.some(m => 
      m.home_team === p.Team || m.away_team === p.Team
    )
  );
  
  if (teamsMatch) {
    console.log('✅ Team names already match between players and matchups');
  } else {
    console.log('❌ Team name mismatch detected - this needs to be fixed in the team mappings');
    
    // Show which teams don't match
    const unmatchedTeams = new Set();
    for (const player of [...analysisData.rushingPlayers, ...analysisData.receivingPlayers]) {
      if (player.Team && !analysisData.matchups.some(m => 
        m.home_team === player.Team || m.away_team === player.Team
      )) {
        unmatchedTeams.add(player.Team);
      }
    }
    console.log('Unmatched player teams:', Array.from(unmatchedTeams));
  }
  
  // Generate current model recommendations (top20-generator)
  console.log("\n🔄 Current Model Analysis...");
  const currentTop20 = await generateTop20List(analysisData);
  console.log(`Current model generated ${currentTop20.length} recommendations`);
  
  // Generate Enhanced ML predictions
  console.log("\n🤖 Enhanced ML Model Analysis (2024 + 2025 Data)...");
  const mlPredictor = new EnhancedMLTDPredictor();
  await mlPredictor.initialize();
  
  const mlPredictions = await generateMLPredictions(mlPredictor, analysisData);
  console.log(`ML model generated ${mlPredictions.length} predictions`);
  
  // Create model comparison
  const comparison = createModelComparison(currentTop20, mlPredictions);
  console.log(`\n📊 Model Agreement: ${comparison.agreement.toFixed(1)}%`);
  
  console.log(`\nGenerated ${currentTop20.length} current model + ${mlPredictions.length} ML model recommendations for Week ${config.targetWeek}`);
  
  return { currentTop20, mlPredictions, comparison };
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
      continue; // Skip players without matchups
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
        player2025TDs: player.season2025Value || 0,
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

async function saveResults(week: number, currentTop20: TDRecommendation[], mlPredictions: any[], comparison: any): Promise<void> {
  const outputPath = join(process.cwd(), 'data', `week${week}-predictions.json`);
  
  const output = {
    week: week,
    season: 2025,
    generatedAt: new Date().toISOString(),
    methodology: "Combined 2024 season data with 2025 previous weeks - Dual Model System",
    currentModel: {
      totalRecommendations: currentTop20.length,
      predictions: currentTop20
    },
    mlModel: {
      totalRecommendations: mlPredictions.length,
      predictions: mlPredictions
    },
    comparison: comparison
  };
  
  writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\nPredictions saved to: ${outputPath}`);
  
  // Also create HTML output with both models
  await generateHTML(week, currentTop20, mlPredictions, comparison);
}

async function generateHTML(week: number, currentTop20: TDRecommendation[], mlPredictions: any[], comparison: any): Promise<void> {
  const htmlPath = join(process.cwd(), 'data', `week${week}-predictions.html`);
  
  // Combine both models into one unified list
  const combinedPredictions = [];
  
  // Add current model predictions
  for (const pred of currentTop20) {
    combinedPredictions.push({
      source: 'Current Model',
      player: pred.Player,
      team: pred.Team,
      opponent: pred.Opponent,
      basis: pred.Basis,
      opponentStat: pred["Opponent Stat Value"],
      playerTDs: pred["Player TDs YTD"],
      player2025TDs: pred["Player 2025 TDs"] || 0,
      historicalTDs: pred["TDs vs Opponent Last Year (2024)"],
      reason: pred.Reason,
      mlProbability: null,
      mlConfidence: null
    });
  }
  
  // Add ML model predictions
  for (const pred of mlPredictions) {
    combinedPredictions.push({
      source: 'ML Model',
      player: pred.player,
      team: pred.team,
      opponent: pred.opponent,
      basis: pred.position === 'WR' ? 'ML Prediction' : 'ML Prediction',
      opponentStat: null,
      playerTDs: pred.playerTDsYTD,
      player2025TDs: pred.player2025TDs || 0,
      historicalTDs: pred.vsOpponentTDs > 0 ? pred.vsOpponentTDs.toString() : 'N/A',
      reason: pred.basis,
      mlProbability: pred.mlProbability,
      mlConfidence: pred.mlConfidence
    });
  }
  
  // Separate the models and sort each independently
  const currentModelPreds = combinedPredictions.filter(p => p.source === 'Current Model')
    .sort((a, b) => b.playerTDs - a.playerTDs);
  
  const mlModelPreds = combinedPredictions.filter(p => p.source === 'ML Model')
    .sort((a, b) => b.mlProbability - a.mlProbability);
  
  // Get top 20 from each model
  const top20Current = currentModelPreds.slice(0, 20);
  const top20ML = mlModelPreds.slice(0, 20);
  
  // Find overlapping players
  const currentPlayers = new Set(top20Current.map(p => p.player));
  const mlPlayers = new Set(top20ML.map(p => p.player));
  const overlapPlayers = [...currentPlayers].filter(player => mlPlayers.has(player));
  
  // Calculate agreement percentage
  const agreementPercent = (overlapPlayers.length / 20) * 100;
  
  const html = `<!DOCTYPE html>
<html>
<head>
    <title>Week ${week} TD Predictions - 2025 NFL Season</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #1a4d3a; color: white; }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { background-color: #2d5a3d; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #90EE90; border-bottom: 2px solid #90EE90; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; background-color: #2d5a3d; border-radius: 8px; overflow: hidden; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #4a6b4a; }
        th { background-color: #90EE90; color: black; font-weight: bold; }
        tr:hover { background-color: #3d6a4d; }
        .current-model { border-left: 4px solid #FFD700; }
        .ml-model { border-left: 4px solid #FF6B35; }
        .stat-value { font-weight: bold; color: #90EE90; }
        .ml-prob { color: #FFB84D; font-weight: bold; }
        .model-badge { padding: 2px 6px; border-radius: 3px; font-size: 0.8em; font-weight: bold; }
        .current-badge { background-color: #FFD700; color: black; }
        .ml-badge { background-color: #FF6B35; color: white; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏈 Week ${week} Touchdown Predictions</h1>
        <p>Generated: ${new Date().toLocaleDateString()}</p>
    </div>
    
    <div class="summary">
        <h3>📊 Dual Model Analysis</h3>
        <p><strong>Current Model Top 20:</strong> ${top20Current.length} | <strong>ML Model Top 20:</strong> ${top20ML.length}</p>
        <p><strong>Player Overlap:</strong> ${overlapPlayers.length}/20 (${agreementPercent.toFixed(1)}%)</p>
        <p><strong>Overlapping Players:</strong> ${overlapPlayers.join(', ')}</p>
        <p><strong>Methodology:</strong> Combined 2024 season data with 2025 previous weeks - Dual Model System</p>
    </div>

    <div class="section">
        <h2>🔄 Current Model Top 20</h2>
        <table>
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Team</th>
                    <th>vs</th>
                    <th>2024 TDs</th>
                    <th>2025 TDs</th>
                    <th>vs Opp (2024)</th>
                    <th>Analysis</th>
                </tr>
            </thead>
            <tbody>
                ${top20Current.map((pred, index) => `
                <tr class="current-model">
                    <td><strong>#${index + 1}</strong></td>
                    <td><strong>${pred.player}</strong></td>
                    <td>${pred.team}</td>
                    <td>${pred.opponent}</td>
                    <td class="stat-value">${pred.playerTDs}</td>
                    <td class="stat-value">${pred.player2025TDs}</td>
                    <td>${pred.historicalTDs}</td>
                    <td>${pred.reason}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>🤖 ML Model Top 20</h2>
        <table>
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Team</th>
                    <th>vs</th>
                    <th>ML Prob</th>
                    <th>2024 TDs</th>
                    <th>2025 TDs</th>
                    <th>vs Opp (2024)</th>
                    <th>Analysis</th>
                </tr>
            </thead>
            <tbody>
                ${top20ML.map((pred, index) => `
                <tr class="ml-model">
                    <td><strong>#${index + 1}</strong></td>
                    <td><strong>${pred.player}</strong></td>
                    <td>${pred.team}</td>
                    <td>${pred.opponent}</td>
                    <td><span class="ml-prob">${(pred.mlProbability * 100).toFixed(1)}%</span></td>
                    <td class="stat-value">${pred.playerTDs}</td>
                    <td class="stat-value">${pred.player2025TDs}</td>
                    <td>${pred.historicalTDs}</td>
                    <td>${pred.reason}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
</body>
</html>`;

  writeFileSync(htmlPath, html);
  console.log(`HTML output saved to: ${htmlPath}`);
}

async function main() {
  try {
    const args = process.argv.slice(2);
    const targetWeek = args.length > 0 ? parseInt(args[0]) : 2;
    
    if (isNaN(targetWeek) || targetWeek < 1 || targetWeek > 18) {
      console.error('Please provide a valid week number (1-18)');
      process.exit(1);
    }
    
    const config: WeeklyConfig = {
      targetWeek,
      season: 2025
    };
    
    const results = await generateWeeklyPredictions(config);
    await saveResults(targetWeek, results.currentTop20, results.mlPredictions, results.comparison);
    
    console.log(`\n✅ Week ${targetWeek} predictions generated successfully!`);
    console.log(`View results: data/week${targetWeek}-predictions.html`);
    
  } catch (error) {
    console.error('Error generating predictions:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}