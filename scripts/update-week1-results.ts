#!/usr/bin/env tsx
// Update Week 1 HTML page to show actual touchdown results

import fs from 'fs';
import path from 'path';

interface WeeklyPrediction {
  rank: number;
  player: string;
  team: string;
  opponent: string;
  basis?: string;
  probability?: number;
  confidence?: number;
  keyFactors?: string[];
  actualResult?: boolean;
}

function generateCurrentModelRowsWithResults(predictions: WeeklyPrediction[]): string {
  return predictions.map((pred) => {
    const tdType = pred.basis?.includes("Rush") ? "rushing" : "receiving";
    const tdTypeClass = pred.basis?.includes("Rush") ? "rushing" : "receiving";
    const tdTypeIcon = pred.basis?.includes("Rush") ? "🏃" : "🎯";
    
    // Result indicator
    let resultIcon = '';
    let resultClass = '';
    if (pred.actualResult === true) {
      resultIcon = ' ✅';
      resultClass = ' result-hit';
    } else if (pred.actualResult === false) {
      resultIcon = ' ❌';
      resultClass = ' result-miss';
    }
    
    return `
                        <tr class="${resultClass}">
                            <td class="rank">#${pred.rank}${resultIcon}</td>
                            <td class="player-name">${pred.player}${resultIcon}</td>
                            <td class="matchup">${pred.team} @ ${pred.opponent}</td>
                            <td><span class="td-type ${tdTypeClass}">${tdTypeIcon} ${tdType.charAt(0).toUpperCase() + tdType.slice(1)}</span></td>
                            <td class="opp-stat">-</td>
                            <td class="player-tds">-</td>
                            <td class="result">${pred.actualResult === true ? '✅ SCORED' : pred.actualResult === false ? '❌ No TD' : 'TBD'}</td>
                        </tr>`;
  }).join('');
}

function generateMLModelRowsWithResults(predictions: WeeklyPrediction[]): string {
  return predictions.map((pred) => {
    // Result indicator
    let resultIcon = '';
    let resultClass = '';
    if (pred.actualResult === true) {
      resultIcon = ' ✅';
      resultClass = ' result-hit';
    } else if (pred.actualResult === false) {
      resultIcon = ' ❌';
      resultClass = ' result-miss';
    }
    
    return `
                        <tr class="${resultClass}">
                            <td class="rank">#${pred.rank}${resultIcon}</td>
                            <td class="player-name">${pred.player}${resultIcon}</td>
                            <td class="matchup">${pred.team} @ ${pred.opponent}</td>
                            <td class="opp-stat">${pred.probability ? (pred.probability * 100).toFixed(1) : '0.0'}%</td>
                            <td class="player-tds">${pred.confidence ? (pred.confidence * 100).toFixed(0) : '0'}%</td>
                            <td class="reason" style="font-size: 0.8em;">${pred.keyFactors?.slice(0, 2).join(', ') || 'No factors'}</td>
                            <td class="result">${pred.actualResult === true ? '✅ SCORED' : pred.actualResult === false ? '❌ No TD' : 'TBD'}</td>
                        </tr>`;
  }).join('');
}

function generateHTML(currentPredictions: WeeklyPrediction[], mlPredictions: WeeklyPrediction[]): string {
  const currentHits = currentPredictions.filter(p => p.actualResult === true).length;
  const currentTotal = currentPredictions.filter(p => p.actualResult !== undefined).length;
  const mlHits = mlPredictions.filter(p => p.actualResult === true).length;
  const mlTotal = mlPredictions.filter(p => p.actualResult !== undefined).length;
  
  const currentAccuracy = currentTotal > 0 ? (currentHits / currentTotal * 100).toFixed(1) : '0.0';
  const mlAccuracy = mlTotal > 0 ? (mlHits / mlTotal * 100).toFixed(1) : '0.0';

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🏈 Week 1 2025 TD Predictions - RESULTS</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #040403 0%, #5B7553 100%);
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            padding: 30px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #2c3e50;
            font-size: 2.5em;
            margin: 0;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }
        .accuracy-summary {
            display: flex;
            justify-content: center;
            gap: 40px;
            margin: 20px 0;
            padding: 20px;
            background: linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%);
            border-radius: 8px;
        }
        .accuracy-stat {
            text-align: center;
        }
        .accuracy-stat h3 {
            margin: 0;
            color: #2c3e50;
            font-size: 1.2em;
        }
        .accuracy-stat .percentage {
            font-size: 2em;
            font-weight: bold;
            color: #27ae60;
        }
        .accuracy-stat .details {
            color: #7f8c8d;
            font-size: 0.9em;
        }
        .models-container {
            display: flex;
            gap: 20px;
            margin-top: 30px;
        }
        .model-section {
            flex: 1;
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .model-section h2 {
            text-align: center;
            color: #2c3e50;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #ecf0f1;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            font-size: 0.9em;
        }
        th, td {
            padding: 12px 8px;
            text-align: left;
            border-bottom: 1px solid #ecf0f1;
        }
        th {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            font-weight: 600;
            color: #2c3e50;
            position: sticky;
            top: 0;
        }
        .rank {
            font-weight: bold;
            color: #3498db;
            text-align: center;
            width: 60px;
        }
        .player-name {
            font-weight: 600;
            color: #2c3e50;
        }
        .result-hit {
            background-color: rgba(46, 204, 113, 0.1) !important;
        }
        .result-miss {
            background-color: rgba(231, 76, 60, 0.1) !important;
        }
        .result {
            font-weight: bold;
            text-align: center;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ecf0f1;
            color: #7f8c8d;
            font-size: 0.9em;
        }
        @media (max-width: 768px) {
            .models-container {
                flex-direction: column;
            }
            .accuracy-summary {
                flex-direction: column;
                gap: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏈 Week 1 2025 TD Predictions - FINAL RESULTS</h1>
            <p style="color: #7f8c8d; font-size: 1.1em;">Predictions vs Actual Touchdown Scorers</p>
        </div>
        
        <div class="accuracy-summary">
            <div class="accuracy-stat">
                <h3>📊 Current Model</h3>
                <div class="percentage">${currentAccuracy}%</div>
                <div class="details">${currentHits}/${currentTotal} correct</div>
            </div>
            <div class="accuracy-stat">
                <h3>🤖 ML Model</h3>
                <div class="percentage">${mlAccuracy}%</div>
                <div class="details">${mlHits}/${mlTotal} correct</div>
            </div>
        </div>

        <div class="models-container">
            <div class="model-section">
                <h2>📊 Current Model Results</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Player</th>
                            <th>Matchup</th>
                            <th>Type</th>
                            <th>Opp Allows</th>
                            <th>Player TDs</th>
                            <th>Result</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${generateCurrentModelRowsWithResults(currentPredictions)}
                    </tbody>
                </table>
            </div>

            <div class="model-section">
                <h2>🤖 ML Model Results</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Player</th>
                            <th>Matchup</th>
                            <th>Probability</th>
                            <th>Confidence</th>
                            <th>Key Factors</th>
                            <th>Result</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${generateMLModelRowsWithResults(mlPredictions)}
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="footer">
            🤖 Generated with <a href="https://claude.ai/code" target="_blank" style="color: #5B7553;">Claude Code</a><br>
            📅 Updated with actual results: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
        </div>
    </div>
</body>
</html>`;
}

async function main() {
  console.log('📊 Updating Week 1 HTML page with actual results...');
  
  // Load prediction history
  const historyPath = path.join(process.cwd(), 'data', 'prediction-history.json');
  const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
  
  // Find Week 1 data
  const week1Data = history.weeks.find((w: any) => w.week === 1 && w.year === 2025);
  
  if (!week1Data) {
    console.log('❌ No Week 1 data found');
    process.exit(1);
  }
  
  console.log(`📝 Found Week 1 data with ${week1Data.currentModelPredictions.length} current model predictions and ${week1Data.mlModelPredictions.length} ML predictions`);
  
  // Generate updated HTML
  const html = generateHTML(week1Data.currentModelPredictions, week1Data.mlModelPredictions);
  
  // Save updated Week 1 file
  const outputPath = path.join(process.cwd(), 'data', 'week-1-2025-predictions.html');
  fs.writeFileSync(outputPath, html);
  
  console.log(`✅ Updated ${outputPath} with actual results`);
  console.log('🎯 Week 1 HTML now shows who actually scored TDs!');
}

// Run if called directly
main().catch(console.error);