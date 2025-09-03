// HTML table generation for TD recommendations
import { TDRecommendation } from './types.js';

function generateCurrentModelRows(recommendations: TDRecommendation[]): string {
  return recommendations.slice(0, 20).map((rec, index) => {
    const tdType = rec.Basis.includes("Rush") ? "rushing" : "receiving";
    const tdTypeClass = rec.Basis.includes("Rush") ? "rushing" : "receiving";
    const tdTypeIcon = rec.Basis.includes("Rush") ? "🏃" : "🎯";
    
    return `
                        <tr>
                            <td class="rank">#${index + 1}</td>
                            <td class="player-name">${rec.Player}</td>
                            <td class="matchup">${rec.Team} @ ${rec.Opponent}</td>
                            <td><span class="td-type ${tdTypeClass}">${tdTypeIcon} ${tdType.charAt(0).toUpperCase() + tdType.slice(1)}</span></td>
                            <td class="opp-stat">${rec["Opponent Stat Value"]} TDs/game</td>
                            <td class="player-tds">${rec["Player TDs YTD"]} TDs</td>
                        </tr>`;
  }).join('');
}

function generateMLModelRows(mlPredictions: any[]): string {
  if (!mlPredictions) return '';
  return mlPredictions.slice(0, 20).map((pred, index) => {
    return `
                        <tr>
                            <td class="rank">#${index + 1}</td>
                            <td class="player-name">${pred.player}</td>
                            <td class="matchup">${pred.team} @ ${pred.opponent}</td>
                            <td class="opp-stat">${(pred.mlProbability * 100).toFixed(1)}%</td>
                            <td class="player-tds">${(pred.mlConfidence * 100).toFixed(0)}%</td>
                            <td class="reason" style="font-size: 0.8em;">${pred.keyFactors.slice(0, 2).join(', ')}</td>
                        </tr>`;
  }).join('');
}

export function formatAsHTML(recommendations: TDRecommendation[], mlPredictions?: any[], comparison?: any): string {
  const rushingCount = recommendations.filter(r => r.Basis.includes("Rush")).length;
  const receivingCount = recommendations.filter(r => r.Basis.includes("Pass")).length;
  const isDualModel = mlPredictions && mlPredictions.length > 0;
  
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🏈 ${isDualModel ? 'Dual Model' : 'Top 20'} TD Bet Recommendations</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #040403 0%, #5B7553 100%);
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #8EB897 0%, #C3E8BD 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .summary {
            background: #f8f9fa;
            padding: 20px 30px;
            border-bottom: 2px solid #e9ecef;
        }
        .summary-stats {
            display: flex;
            justify-content: center;
            gap: 40px;
            font-size: 1.1em;
        }
        .stat {
            text-align: center;
        }
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            color: #8EB897;
        }
        .dual-container {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            padding: 20px;
        }
        .model-section {
            flex: 1;
            min-width: 600px;
        }
        .model-title {
            text-align: center;
            margin: 0 0 20px 0;
            padding: 15px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
        }
        .current-model {
            background: #5B7553;
        }
        .ml-model {
            background: #8EB897;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
            margin: 0;
        }
        th {
            background: linear-gradient(135deg, #5B7553 0%, #8EB897 100%);
            color: white;
            padding: 15px 10px;
            text-align: left;
            font-weight: 600;
            position: sticky;
            top: 0;
            z-index: 10;
        }
        td {
            padding: 12px 10px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
        }
        tr:nth-child(even) {
            background-color: #f7fafc;
        }
        tr:hover {
            background-color: #e6fffa;
            transform: scale(1.01);
            transition: all 0.2s ease;
        }
        .rank {
            font-weight: bold;
            color: #8EB897;
            font-size: 1.1em;
        }
        .player-name {
            font-weight: bold;
            color: #2d3748;
            font-size: 1.05em;
        }
        .matchup {
            font-weight: 500;
            color: #4a5568;
        }
        .td-type {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.9em;
            font-weight: 500;
        }
        .receiving {
            background: #9DDBAD;
            color: #040403;
        }
        .rushing {
            background: #5B7553;
            color: #9DDBAD;
        }
        .opp-stat {
            font-weight: bold;
            color: #5B7553;
        }
        .player-tds {
            font-weight: bold;
            color: #8EB897;
        }
        .historical {
            font-weight: bold;
        }
        .historical.success {
            color: #8EB897;
        }
        .historical.none {
            color: #5B7553;
        }
        .historical.na {
            color: #C3E8BD;
            font-style: italic;
        }
        .reason {
            font-size: 0.9em;
            color: #5B7553;
            line-height: 1.3;
        }
        .footer {
            background: #9DDBAD;
            padding: 20px;
            text-align: center;
            color: #040403;
            font-size: 0.9em;
        }
        /* Mobile-first responsive design */
        @media (max-width: 768px) {
            body { 
                padding: 8px; 
                font-size: 14px;
            }
            .header h1 { 
                font-size: 1.8em; 
                padding: 0 10px;
            }
            .header {
                padding: 20px 15px;
            }
            .summary {
                padding: 15px 20px;
            }
            .summary-stats { 
                flex-direction: column; 
                gap: 15px; 
            }
            .dual-container {
                flex-direction: column;
                padding: 15px;
            }
            .model-section {
                min-width: auto;
            }
            .stat-number {
                font-size: 1.5em;
            }
            table { 
                font-size: 11px;
                display: block;
                overflow-x: auto;
                white-space: nowrap;
                -webkit-overflow-scrolling: touch;
            }
            th, td { 
                padding: 6px 4px; 
                min-width: 80px;
            }
            tr:hover {
                transform: none;
            }
        }
        @media (max-width: 480px) {
            body { padding: 5px; }
            .header h1 { font-size: 1.5em; }
            .header { padding: 15px 10px; }
            .summary { padding: 10px 15px; }
            table { font-size: 10px; }
            th, td { padding: 4px 3px; }
            .stat-number { font-size: 1.3em; }
            .summary-stats { gap: 12px; }
        }
        @media (min-width: 1200px) {
            .container {
                max-width: 1400px;
            }
            table {
                font-size: 15px;
            }
            th, td {
                padding: 15px 12px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏈 ${isDualModel ? 'Dual Model Analysis' : 'Top 20'} TD Bet Recommendations</h1>
            ${isDualModel ? '<p style="margin: 10px 0 0 0; font-size: 1.1em; opacity: 0.9;">Comparing Current Model vs Machine Learning Predictions</p>' : ''}
        </div>
        
        <div class="summary">
            <div class="summary-stats">`;

  if (isDualModel && comparison) {
    html += `
                <div class="stat">
                    <div class="stat-number">${comparison.agreement.toFixed(0)}%</div>
                    <div>🤝 Model Agreement</div>
                </div>
                <div class="stat">
                    <div class="stat-number">${comparison.differences.onlyInCurrent.length}</div>
                    <div>📊 Current Only</div>
                </div>
                <div class="stat">
                    <div class="stat-number">${comparison.differences.onlyInML.length}</div>
                    <div>🤖 ML Only</div>
                </div>`;
  } else {
    html += `
                <div class="stat">
                    <div class="stat-number">${rushingCount}</div>
                    <div>🏃 Rushing</div>
                </div>
                <div class="stat">
                    <div class="stat-number">${receivingCount}</div>
                    <div>🎯 Receiving</div>
                </div>
                <div class="stat">
                    <div class="stat-number">20</div>
                    <div>Total Opportunities</div>
                </div>`;
  }

  html += `
            </div>
        </div>`;

  if (isDualModel) {
    html += `
        <div class="dual-container">
            <div class="model-section">
                <h2 class="model-title current-model">📊 Current Model (Rule-based)</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Player</th>
                            <th>Matchup</th>
                            <th>Type</th>
                            <th>Opp Allows</th>
                            <th>Player TDs YTD</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${generateCurrentModelRows(recommendations)}
                    </tbody>
                </table>
            </div>
            
            <div class="model-section">
                <h2 class="model-title ml-model">🤖 ML Model (Probability-based)</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Player</th>
                            <th>Matchup</th>
                            <th>ML Prob</th>
                            <th>Confidence</th>
                            <th>Key Factors</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${generateMLModelRows(mlPredictions)}
                    </tbody>
                </table>
            </div>
        </div>`;
  } else {
    html += `
        <table>
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Matchup</th>
                    <th>Type</th>
                    <th>Opp Allows</th>
                    <th>Player TDs YTD</th>
                    <th>2024 vs Opponent</th>
                    <th>Analysis</th>
                </tr>
            </thead>
            <tbody>`;

    recommendations.forEach((rec, index) => {
      const tdType = rec.Basis.includes("Rush") ? "rushing" : "receiving";
      const tdTypeClass = rec.Basis.includes("Rush") ? "rushing" : "receiving";
      const tdTypeIcon = rec.Basis.includes("Rush") ? "🏃" : "🎯";
      
      const historical = rec["TDs vs Opponent Last Year (2024)"];
      let historicalClass = "na";
      let historicalText = historical;
      
      if (historical === "N/A — not verifiable") {
        historicalClass = "na";
        historicalText = "❓ Not verifiable";
      } else if (historical === "0") {
        historicalClass = "none";
        historicalText = "0️⃣ None";
      } else if (historical !== "N/A — not verifiable") {
        historicalClass = "success";
        historicalText = `🎯 ${historical} TDs`;
      }
      
      html += `
                <tr>
                    <td class="rank">#${index + 1}</td>
                    <td class="player-name">${rec.Player}</td>
                    <td class="matchup">${rec.Team} @ ${rec.Opponent}</td>
                    <td><span class="td-type ${tdTypeClass}">${tdTypeIcon} ${tdType.charAt(0).toUpperCase() + tdType.slice(1)}</span></td>
                    <td class="opp-stat">${rec["Opponent Stat Value"]} TDs/game</td>
                    <td class="player-tds">${rec["Player TDs YTD"]} TDs</td>
                    <td class="historical ${historicalClass}">${historicalText}</td>
                    <td class="reason">${rec.Reason}</td>
                </tr>`;
    });

    html += `
            </tbody>
        </table>`;
  }

  html += `
        
        <div class="footer">
            🤖 Generated with <a href="https://claude.ai/code" target="_blank" style="color: #5B7553;">Claude Code</a><br>
            📅 Last updated: ${new Date().toLocaleString()}
        </div>
    </div>
</body>
</html>`;

  return html;
}