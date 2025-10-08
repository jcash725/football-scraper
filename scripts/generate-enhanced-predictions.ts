#!/usr/bin/env tsx
// Generate Enhanced Volume + Defense + Game Script + Usage Trends Predictions

import { EnhancedVolumeDefensePredictor } from './lib/enhanced-volume-defense-predictor.js';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface EnhancedPrediction {
  playerName: string;
  team: string;
  position: string;
  opponent: string;
  targets: number;
  carries: number;
  redZoneOpportunities: number;
  volumeScore: number;
  defenseScore: number;
  gameScriptScore: number;
  usageTrendScore: number;
  finalScore: number;
  prediction: string;
  injuryStatus: string;
  reasoning: string[];
}

async function main() {
  const [week] = [parseInt(process.argv[2])];

  if (!week) {
    console.log('Usage: npx tsx generate-enhanced-predictions.ts <week>');
    console.log('Example: npx tsx generate-enhanced-predictions.ts 5');
    process.exit(1);
  }

  console.log(`🏈 Generating Enhanced Predictions for Week ${week}...\n`);

  // Auto-update injury data before generating predictions
  console.log(`🏥 Updating injury data for Week ${week}...`);
  try {
    await execAsync(`npx tsx scripts/setup-injury-data.ts ${week}`);
    console.log('✅ Injury data updated\n');
  } catch (error) {
    console.warn('⚠️ Could not update injury data, continuing with existing data\n');
  }

  const predictor = new EnhancedVolumeDefensePredictor();
  const predictions = predictor.generateEnhancedPredictions(week);

  if (predictions.length === 0) {
    console.log('❌ No predictions generated. Check volume data.');
    return;
  }

  // Generate HTML
  const html = generateHTML(week, predictions);

  // Save HTML file
  const outputDir = path.join(process.cwd(), 'data');
  const fileName = `week${week}-enhanced-predictions.html`;
  const filePath = path.join(outputDir, fileName);

  fs.writeFileSync(filePath, html);

  // Also save JSON for analysis
  const jsonFileName = `week${week}-enhanced-predictions.json`;
  const jsonFilePath = path.join(outputDir, jsonFileName);
  fs.writeFileSync(jsonFilePath, JSON.stringify({
    week,
    generatedAt: new Date().toISOString(),
    methodology: "Volume (50%) + Defense (25%) + Game Script (15%) + Usage Trends (10%)",
    predictions: predictions.slice(0, 25)
  }, null, 2));

  console.log(`✅ Enhanced predictions generated:`);
  console.log(`📄 HTML: ${fileName}`);
  console.log(`📊 JSON: ${jsonFileName}`);
  console.log(`🎯 Top predictions: ${predictions.slice(0, 10).map(p => `${p.playerName} (${p.finalScore})`).join(', ')}`);
}

function generateHTML(week: number, predictions: EnhancedPrediction[]): string {
  const strongPlays = predictions.filter(p => p.prediction === 'Strong Play');
  const solidPlays = predictions.filter(p => p.prediction === 'Solid Play');
  const specPlays = predictions.filter(p => p.prediction === 'Speculative Play');
  const dartThrows = predictions.filter(p => p.prediction === 'Dart Throw');

  return `<!DOCTYPE html>
<html>
<head>
    <title>Week ${week} Enhanced Volume + Defense + Game Script TD Predictions - 2025 NFL Season</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #0a0e1a; color: white; }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { background-color: #1a1f2e; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #6366f1; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; background-color: #1a1f2e; border-radius: 8px; overflow: hidden; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #2d3748; }
        th { background-color: #6366f1; color: white; font-weight: bold; }
        tr:hover { background-color: #2d3748; }
        .enhanced-model { border-left: 4px solid #6366f1; }
        .stat-value { font-weight: bold; color: #6366f1; }
        .score-breakdown { font-size: 0.85em; color: #a0aec0; }
        .reasoning { font-size: 0.8em; color: #cbd5e0; font-style: italic; }
        .injury-healthy { color: #48bb78; }
        .injury-questionable { color: #ed8936; }
        .injury-doubtful { color: #f56565; }
        .injury-out { color: #e53e3e; }
        .model-badge { padding: 3px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
        .strong-badge { background-color: #10b981; color: white; }
        .solid-badge { background-color: #3b82f6; color: white; }
        .spec-badge { background-color: #f59e0b; color: white; }
        .dart-badge { background-color: #6b7280; color: white; }
        .methodology { background-color: #2d3748; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .v2-badge { background-color: #ec4899; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.7em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏈 Week ${week} Enhanced TD Predictions <span class="v2-badge">v2.0</span></h1>
        <p>Generated: ${new Date().toLocaleDateString()}</p>
        <p><strong>Multi-Factor Model:</strong> Volume + Defense + Game Script + Usage Trends</p>
    </div>

    <div class="methodology">
        <h3>🧠 Enhanced Methodology v2.0</h3>
        <p><strong>Scoring Components:</strong></p>
        <ul>
            <li><strong>50% Volume Score:</strong> Targets, carries, red zone opportunities (down from 60%)</li>
            <li><strong>25% Defense Score:</strong> Current 2025 opponent TD defense rankings (down from 30%)</li>
            <li><strong>15% Game Script Score:</strong> Team total, spread, pace <span class="v2-badge">NEW</span></li>
            <li><strong>10% Usage Trend Score:</strong> Recent volume trending <span class="v2-badge">NEW</span></li>
        </ul>
        <p><strong>Key Improvements:</strong> Game script analysis prevents Derrick Henry-type misses. Usage trends identify players getting more opportunities.</p>
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
        <h2>🎯 Enhanced Top 25 Predictions</h2>
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
                    <th>Key Reasoning</th>
                    <th>Injury</th>
                </tr>
            </thead>
            <tbody>
                ${predictions.slice(0, 25).map((player, i) => `
                <tr class="enhanced-model">
                    <td><strong>#${i + 1}</strong></td>
                    <td><strong>${player.playerName}</strong></td>
                    <td>${player.team}</td>
                    <td>${player.opponent}</td>
                    <td>${player.position}</td>
                    <td class="stat-value">${player.finalScore}</td>
                    <td class="score-breakdown">V:${player.volumeScore.toFixed(1)} | D:${player.defenseScore.toFixed(1)} | GS:${player.gameScriptScore.toFixed(1)} | UT:${player.usageTrendScore.toFixed(1)}</td>
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
                    <th>Game Script</th>
                    <th>All Reasoning</th>
                </tr>
            </thead>
            <tbody>
                ${strongPlays.map(player => `
                <tr class="enhanced-model">
                    <td><strong>${player.playerName}</strong></td>
                    <td>${player.team} vs ${player.opponent}</td>
                    <td>${player.targets + player.carries}</td>
                    <td>${player.redZoneOpportunities}</td>
                    <td class="stat-value">${player.finalScore}</td>
                    <td>${player.gameScriptScore.toFixed(1)}/10</td>
                    <td class="reasoning">${player.reasoning.join('; ')}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        ` : '<p>No strong plays identified this week.</p>'}
    </div>

    <div class="summary">
        <h3>💡 Enhanced Model Insights</h3>
        <ul>
            <li><strong>Game script matters:</strong> Favored teams in high-scoring games get more red zone chances</li>
            <li><strong>Usage trends are predictive:</strong> Players with increasing touches/targets trending up</li>
            <li><strong>RB game script sensitivity:</strong> Heavy underdogs lose goal-line opportunities</li>
            <li><strong>Pace factor:</strong> Fast-pace offenses create more TD opportunities</li>
            <li><strong>Injury uncertainty:</strong> Questionable players get score penalty</li>
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