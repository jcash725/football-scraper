#!/usr/bin/env tsx
// Generate Combined Volume + Defense Predictions HTML

import { VolumeDefensePredictor } from './lib/volume-defense-predictor.js';
import fs from 'fs';
import path from 'path';

interface CombinedPrediction {
  playerName: string;
  team: string;
  position: string;
  opponent: string;
  targets: number;
  carries: number;
  redZoneOpportunities: number;
  volumeScore: number;
  defenseScore: number;
  historicalScore: number;
  finalScore: number;
  prediction: string;
  injuryStatus: string;
  reasoning: string[];
}

async function main() {
  const [week] = [parseInt(process.argv[2])];

  if (!week) {
    console.log('Usage: npx tsx generate-combined-predictions.ts <week>');
    console.log('Example: npx tsx generate-combined-predictions.ts 5');
    process.exit(1);
  }

  console.log(`🏈 Generating Combined Volume + Defense Predictions for Week ${week}...\n`);

  const predictor = new VolumeDefensePredictor();
  const predictions = predictor.generatePredictions(week);

  if (predictions.length === 0) {
    console.log('❌ No predictions generated. Check volume data.');
    return;
  }

  // Generate HTML
  const html = generateHTML(week, predictions);

  // Save HTML file
  const outputDir = path.join(process.cwd(), 'data');
  const fileName = `week${week}-combined-predictions.html`;
  const filePath = path.join(outputDir, fileName);

  fs.writeFileSync(filePath, html);

  // Also save JSON for analysis
  const jsonFileName = `week${week}-combined-predictions.json`;
  const jsonFilePath = path.join(outputDir, jsonFileName);
  fs.writeFileSync(jsonFilePath, JSON.stringify({
    week,
    generatedAt: new Date().toISOString(),
    predictions: predictions.slice(0, 25)
  }, null, 2));

  console.log(`✅ Combined predictions generated:`);
  console.log(`📄 HTML: ${fileName}`);
  console.log(`📊 JSON: ${jsonFileName}`);
  console.log(`🎯 Top predictions: ${predictions.slice(0, 10).map(p => `${p.playerName} (${p.finalScore})`).join(', ')}`);
}

function generateHTML(week: number, predictions: CombinedPrediction[]): string {
  const strongPlays = predictions.filter(p => p.prediction === 'Strong Play');
  const solidPlays = predictions.filter(p => p.prediction === 'Solid Play');
  const specPlays = predictions.filter(p => p.prediction === 'Speculative Play');
  const dartThrows = predictions.filter(p => p.prediction === 'Dart Throw');

  return `<!DOCTYPE html>
<html>
<head>
    <title>Week ${week} Combined Volume + Defense TD Predictions - 2025 NFL Season</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #0f1419; color: white; }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { background-color: #1e2328; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #00d4aa; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #00d4aa; border-bottom: 2px solid #00d4aa; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; background-color: #1e2328; border-radius: 8px; overflow: hidden; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #2d3748; }
        th { background-color: #00d4aa; color: black; font-weight: bold; }
        tr:hover { background-color: #2d3748; }
        .combined-model { border-left: 4px solid #00d4aa; }
        .stat-value { font-weight: bold; color: #00d4aa; }
        .score-breakdown { font-size: 0.85em; color: #a0aec0; }
        .reasoning { font-size: 0.8em; color: #cbd5e0; font-style: italic; }
        .injury-healthy { color: #48bb78; }
        .injury-questionable { color: #ed8936; }
        .injury-doubtful { color: #f56565; }
        .injury-out { color: #e53e3e; }
        .model-badge { padding: 3px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
        .strong-badge { background-color: #48bb78; color: white; }
        .solid-badge { background-color: #4299e1; color: white; }
        .spec-badge { background-color: #ed8936; color: white; }
        .dart-badge { background-color: #a0aec0; color: black; }
        .methodology { background-color: #2d3748; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏈 Week ${week} Combined Volume + Defense TD Predictions</h1>
        <p>Generated: ${new Date().toLocaleDateString()}</p>
        <p><strong>New Hybrid Model:</strong> Volume Analysis + Current Defense Data</p>
    </div>

    <div class="methodology">
        <h3>🧠 Methodology</h3>
        <p><strong>Scoring Components:</strong></p>
        <ul>
            <li><strong>60% Volume Score:</strong> Targets, carries, red zone opportunities</li>
            <li><strong>30% Defense Score:</strong> Current 2025 opponent TD defense rankings</li>
            <li><strong>10% Historical Score:</strong> Recent 3-game TD production</li>
        </ul>
        <p><strong>Key Improvement:</strong> Uses actual 2025 defensive data instead of 2024 estimates</p>
    </div>

    <div class="summary">
        <h3>📊 Prediction Breakdown</h3>
        <p><strong>Total Players Analyzed:</strong> ${predictions.length}</p>
        <p><strong>Strong Plays:</strong> ${strongPlays.length} |
           <strong>Solid Plays:</strong> ${solidPlays.length} |
           <strong>Speculative:</strong> ${specPlays.length} |
           <strong>Dart Throws:</strong> ${dartThrows.length}</p>
    </div>

    <div class="section">
        <h2>🎯 Combined Top 25 Predictions</h2>
        <table>
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Team</th>
                    <th>vs</th>
                    <th>Pos</th>
                    <th>Score</th>
                    <th>Breakdown</th>
                    <th>Tier</th>
                    <th>Reasoning</th>
                    <th>Injury</th>
                </tr>
            </thead>
            <tbody>
                ${predictions.slice(0, 25).map((player, i) => `
                <tr class="combined-model">
                    <td><strong>#${i + 1}</strong></td>
                    <td><strong>${player.playerName}</strong></td>
                    <td>${player.team}</td>
                    <td>${player.opponent}</td>
                    <td>${player.position}</td>
                    <td class="stat-value">${player.finalScore}</td>
                    <td class="score-breakdown">V:${player.volumeScore} | D:${player.defenseScore} | H:${player.historicalScore}</td>
                    <td><span class="model-badge ${getBadgeClass(player.prediction)}">${player.prediction}</span></td>
                    <td class="reasoning">${player.reasoning.slice(0, 2).join('; ')}</td>
                    <td class="injury-${getInjuryClass(player.injuryStatus)}">${player.injuryStatus}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>🔥 Strong Plays (Score 8+)</h2>
        ${strongPlays.length > 0 ? `
        <table>
            <thead>
                <tr>
                    <th>Player</th>
                    <th>Team vs Opponent</th>
                    <th>Touches</th>
                    <th>RZ Opps</th>
                    <th>Score</th>
                    <th>Key Reasoning</th>
                </tr>
            </thead>
            <tbody>
                ${strongPlays.map(player => `
                <tr class="combined-model">
                    <td><strong>${player.playerName}</strong></td>
                    <td>${player.team} vs ${player.opponent}</td>
                    <td>${player.targets + player.carries}</td>
                    <td>${player.redZoneOpportunities}</td>
                    <td class="stat-value">${player.finalScore}</td>
                    <td class="reasoning">${player.reasoning.join('; ')}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        ` : '<p>No strong plays identified this week.</p>'}
    </div>

    <div class="summary">
        <h3>💡 Key Insights</h3>
        <ul>
            <li><strong>Red zone opportunities</strong> are the strongest predictor of TD success</li>
            <li><strong>Current defensive rankings</strong> matter more than historical matchups</li>
            <li>Players with <strong>dual-threat usage</strong> (rush + receiving) have higher TD rates</li>
            <li>This model addresses the <strong>weak performance</strong> of traditional prediction methods</li>
            <li>Always verify injury status before finalizing selections</li>
        </ul>
    </div>
</body>
</html>`;
}

function getBadgeClass(prediction: string): string {
  switch (prediction) {
    case 'Strong Play': return 'strong-badge';
    case 'Solid Play': return 'solid-badge';
    case 'Speculative Play': return 'spec-badge';
    default: return 'dart-badge';
  }
}

function getInjuryClass(injuryStatus: string): string {
  const status = injuryStatus.toLowerCase();
  if (status.includes('healthy')) return 'healthy';
  if (status.includes('questionable')) return 'questionable';
  if (status.includes('doubtful')) return 'doubtful';
  return 'out';
}

main().catch(console.error);