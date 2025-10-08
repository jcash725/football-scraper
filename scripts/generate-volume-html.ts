#!/usr/bin/env tsx
// Generate HTML page for volume analysis and predictions

import { ManualVolumeTracker } from './lib/manual-volume-tracker.js';
import { SimpleTouchdownTracker } from './lib/simple-touchdown-tracker.js';
import { InjuryChecker } from './lib/injury-checker.js';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface PlayerWithInjury {
  playerName: string;
  team: string;
  position: string;
  targets: number;
  carries: number;
  redZoneOpportunities: number;
  volumeScore: number;
  enhancedScore: number;
  prediction: string;
  injuryStatus: string;
  teamPoints: number;
}

async function main() {
  const [week] = [parseInt(process.argv[2])];

  if (!week) {
    console.log('Usage: npx tsx generate-volume-html.ts <week>');
    console.log('Example: npx tsx generate-volume-html.ts 4');
    process.exit(1);
  }

  console.log(`🏈 Generating Volume Analysis HTML for Week ${week}...\n`);

  // Auto-update injury data before generating volume analysis
  console.log(`🏥 Updating injury data for Week ${week}...`);
  try {
    await execAsync(`npx tsx scripts/setup-injury-data.ts ${week}`);
    console.log('✅ Injury data updated\n');
  } catch (error) {
    console.warn('⚠️ Could not update injury data, continuing with existing data\n');
  }

  const volumeTracker = new ManualVolumeTracker();
  const touchdownTracker = new SimpleTouchdownTracker();
  const injuryChecker = new InjuryChecker();

  // Get volume predictions
  const volumeCandidates = volumeTracker.predictTouchdownCandidates(week);

  if (volumeCandidates.length === 0) {
    console.log('❌ No volume data available. Run volume-data-entry.ts first.');
    return;
  }

  // Load historical data for enhanced scoring
  const historicalDatabase = touchdownTracker.loadTouchdownDatabase(2025);

  // Create enhanced player data with injury status and filter out injured players
  const playersWithData: PlayerWithInjury[] = volumeCandidates.map(player => {
    let enhancedScore = player.tdPredictionScore;
    let recentTDs = 0;

    if (historicalDatabase) {
      const playerHistory = historicalDatabase.playerGameStats.filter(stat =>
        stat.playerName.toLowerCase().includes(player.playerName.toLowerCase())
      );

      recentTDs = playerHistory
        .filter(stat => stat.week >= week - 3 && stat.week < week)
        .reduce((sum, stat) => sum + stat.rushingTouchdowns + stat.receivingTouchdowns, 0);

      const historicalScore = recentTDs >= 3 ? 5 : recentTDs >= 2 ? 3 : recentTDs >= 1 ? 2 : 0;
      enhancedScore = Math.round((player.tdPredictionScore * 0.7) + (historicalScore * 0.3));
    }

    // Determine prediction tier
    let prediction = 'Dart Throw';
    if (enhancedScore >= 12 && (player.redZoneTargets + player.redZoneCarries) >= 2) {
      prediction = 'Strong Play';
    } else if (enhancedScore >= 8 && (player.targets >= 8 || player.carries >= 12)) {
      prediction = 'Solid Play';
    }

    // Get real injury status
    const injuryReport = injuryChecker.getPlayerInjuryStatus(player.playerName);
    const injuryStatus = injuryReport ? `${injuryReport.status}${injuryReport.injury !== 'None' ? ` (${injuryReport.injury})` : ''}` : 'Healthy';

    return {
      playerName: player.playerName,
      team: player.team,
      position: player.position,
      targets: player.targets,
      carries: player.carries,
      redZoneOpportunities: player.redZoneTargets + player.redZoneCarries,
      volumeScore: (player as any).tdPredictionScore,
      enhancedScore,
      prediction,
      injuryStatus,
      teamPoints: player.teamPoints
    };
  }).filter(player => {
    // Filter out players who are Out or IR
    const injuryReport = injuryChecker.getPlayerInjuryStatus(player.playerName);
    return !injuryReport || (injuryReport.status !== 'Out' && injuryReport.status !== 'IR');
  });

  console.log(`🏥 Filtered out ${volumeCandidates.length - playersWithData.length} injured players (Out/IR)`);

  // Sort by enhanced score
  playersWithData.sort((a, b) => b.enhancedScore - a.enhancedScore);

  // Generate HTML
  const html = generateHTML(week, playersWithData);

  // Save HTML file
  const outputDir = path.join(process.cwd(), 'data');
  const fileName = `week${week}-volume-analysis.html`;
  const filePath = path.join(outputDir, fileName);

  fs.writeFileSync(filePath, html);

  console.log(`✅ Volume analysis HTML generated: ${fileName}`);
  console.log(`📊 Analysis includes ${playersWithData.length} players`);
  console.log(`💡 Open: data/${fileName}`);
}

function generateHTML(week: number, players: PlayerWithInjury[]): string {
  return `<!DOCTYPE html>
<html>
<head>
    <title>Week ${week} Volume-Based TD Predictions - 2025 NFL Season</title>
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
        .volume-model { border-left: 4px solid #FFD700; }
        .stat-value { font-weight: bold; color: #90EE90; }
        .injury-healthy { color: #90EE90; }
        .injury-questionable { color: #FFB84D; }
        .injury-doubtful { color: #FF6B35; }
        .injury-out { color: #FF4444; }
        .model-badge { padding: 2px 6px; border-radius: 3px; font-size: 0.8em; font-weight: bold; }
        .volume-badge { background-color: #FFD700; color: black; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏈 Week ${week} Volume-Based TD Predictions</h1>
        <p>Generated: ${new Date().toLocaleDateString()}</p>
    </div>

    <div class="summary">
        <h3>📊 Volume Analysis Overview</h3>
        <p><strong>Total Players Analyzed:</strong> ${players.length}</p>
        <p><strong>Methodology:</strong> 70% Volume Metrics (targets, carries, red zone) + 30% Historical TDs</p>
        <p><strong>Strong Plays:</strong> ${players.filter(p => p.prediction === 'Strong Play').length} |
           <strong>Solid Plays:</strong> ${players.filter(p => p.prediction === 'Solid Play').length} |
           <strong>Dart Throws:</strong> ${players.filter(p => p.prediction === 'Dart Throw').length}</p>
    </div>

    <div class="section">
        <h2>🎯 Volume-Based Top ${Math.min(players.length, 25)}</h2>
        <table>
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Team</th>
                    <th>Pos</th>
                    <th>Targets</th>
                    <th>Carries</th>
                    <th>RZ Opps</th>
                    <th>Score</th>
                    <th>Tier</th>
                    <th>Injury</th>
                </tr>
            </thead>
            <tbody>
                ${players.slice(0, 25).map((player, i) => `
                <tr class="volume-model">
                    <td><strong>#${i + 1}</strong></td>
                    <td><strong>${player.playerName}</strong></td>
                    <td>${player.team}</td>
                    <td>${player.position}</td>
                    <td class="stat-value">${player.targets}</td>
                    <td class="stat-value">${player.carries}</td>
                    <td class="stat-value">${player.redZoneOpportunities}</td>
                    <td class="stat-value">${player.enhancedScore}</td>
                    <td><span class="model-badge volume-badge">${player.prediction}</span></td>
                    <td class="injury-${player.injuryStatus.toLowerCase().includes('healthy') ? 'healthy' :
                                     player.injuryStatus.toLowerCase().includes('questionable') ? 'questionable' :
                                     player.injuryStatus.toLowerCase().includes('doubtful') ? 'doubtful' : 'out'}">${player.injuryStatus}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="summary">
        <h3>📈 Key Insights</h3>
        <ul>
            <li>Players with <strong>15+ total touches</strong> (targets + carries) have highest TD rates</li>
            <li><strong>Red zone opportunities</strong> are the #1 predictor of touchdowns</li>
            <li>Target share leaders on <strong>high-scoring teams</strong> are premium plays</li>
            <li>Volume metrics are more predictive than historical TD data alone</li>
            <li>Always check injury reports before finalizing picks</li>
        </ul>
    </div>
</body>
</html>`;
}

main().catch(console.error);