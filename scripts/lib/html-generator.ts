// HTML table generation for TD recommendations
import { TDRecommendation } from './types.js';

export function formatAsHTML(recommendations: TDRecommendation[]): string {
  const rushingCount = recommendations.filter(r => r.Basis.includes("Rush")).length;
  const receivingCount = recommendations.filter(r => r.Basis.includes("Pass")).length;
  
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🏈 Top 20 TD Bet Recommendations</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
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
            background: linear-gradient(135deg, #ff6b35 0%, #f7941d 100%);
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
            color: #ff6b35;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }
        th {
            background: linear-gradient(135deg, #2c5282 0%, #3182ce 100%);
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
            color: #ff6b35;
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
            background: #e6fffa;
            color: #00695c;
        }
        .rushing {
            background: #fff3e0;
            color: #e65100;
        }
        .opp-stat {
            font-weight: bold;
            color: #e53e3e;
        }
        .player-tds {
            font-weight: bold;
            color: #38a169;
        }
        .historical {
            font-weight: bold;
        }
        .historical.success {
            color: #38a169;
        }
        .historical.none {
            color: #718096;
        }
        .historical.na {
            color: #a0aec0;
            font-style: italic;
        }
        .reason {
            font-size: 0.9em;
            color: #4a5568;
            line-height: 1.3;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #718096;
            font-size: 0.9em;
        }
        @media (max-width: 768px) {
            body { padding: 10px; }
            .header h1 { font-size: 2em; }
            .summary-stats { flex-direction: column; gap: 20px; }
            table { font-size: 12px; }
            th, td { padding: 8px 6px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏈 Top 20 TD Bet Recommendations</h1>
        </div>
        
        <div class="summary">
            <div class="summary-stats">
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
                </div>
            </div>
        </div>
        
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
        </table>
        
        <div class="footer">
            🤖 Generated with <a href="https://claude.ai/code" target="_blank" style="color: #3182ce;">Claude Code</a><br>
            📅 Last updated: ${new Date().toLocaleString()}
        </div>
    </div>
</body>
</html>`;

  return html;
}