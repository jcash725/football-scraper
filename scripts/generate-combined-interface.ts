#!/usr/bin/env tsx
// Generate Combined Tabbed Prediction Interface

import fs from 'fs';
import path from 'path';

interface Prediction {
  Player: string;
  Team: string;
  Opponent?: string;
  Position?: string;
  [key: string]: any;
}

interface ModelData {
  predictions: Prediction[];
  accuracy?: string;
  totalRecommendations?: number;
}

function getResultMark(playerName: string, team: string, week: number, season: number): string {
  try {
    // Load touchdown database
    const tdFile = path.join(process.cwd(), 'data', `touchdown-history-${season}.json`);

    if (!fs.existsSync(tdFile)) {
      return ''; // No data available
    }

    const tdData = JSON.parse(fs.readFileSync(tdFile, 'utf8'));

    // Get all touchdown scorers for this week
    const weekScorers = tdData.playerGameStats
      .filter((stat: any) => stat.week === week)
      .filter((stat: any) => stat.rushingTouchdowns > 0 || stat.receivingTouchdowns > 0);

    // Get all teams that played games this week (including teams that scored 0 TDs)
    const teamsWithCompletedGames = new Set<string>();
    tdData.playerGameStats
      .filter((stat: any) => stat.week === week)
      .forEach((stat: any) => {
        teamsWithCompletedGames.add(stat.team);
        teamsWithCompletedGames.add(stat.opponent);
      });

    // Check if this player's team has played - try various team name formats
    const teamVariations = [
      team,
      team.replace(/^(New York|Los Angeles|San Francisco).*/, '$1'),
      team.split(' ').slice(-1)[0], // Last word
      team.split(' ').slice(0, 2).join(' '), // First two words
    ];

    const teamPlayed = teamVariations.some(variation => teamsWithCompletedGames.has(variation));


    if (!teamPlayed) {
      return ''; // Game not yet played
    }

    // Check if player scored
    const playerScored = weekScorers.some((scorer: any) =>
      scorer.playerName.toLowerCase().includes(playerName.toLowerCase()) ||
      playerName.toLowerCase().includes(scorer.playerName.toLowerCase())
    );

    return playerScored ? ' ✅' : ' ❌';
  } catch (error) {
    return ''; // Error loading data, don't mark
  }
}

function generateCombinedInterface(week: number, season: number = 2025) {
  console.log(`🏈 Generating Combined Tabbed Interface for Week ${week}...`);

  // Load all prediction data
  const dataDir = path.join(process.cwd(), 'data');

  // Traditional (Current) predictions
  let traditionalData: ModelData = { predictions: [] };
  const traditionalFile = path.join(dataDir, `week${week}-predictions.json`);
  if (fs.existsSync(traditionalFile)) {
    const data = JSON.parse(fs.readFileSync(traditionalFile, 'utf8'));
    traditionalData = {
      predictions: data.currentModel.predictions.map((p: any) => ({
        ...p,
        model: 'Current',
        Player: p.Player,
        Team: p.Team,
        Opponent: p.Opponent,
        Probability: p['Opponent Stat Value'] || p.mlProbability,
        'Historical vs Opponent': p['TDs vs Opponent Last Year (2024)'],
        actualResult: p.actualResult
      }))
    };
  }

  // ML Model predictions
  let mlData: ModelData = { predictions: [] };
  if (fs.existsSync(traditionalFile)) {
    const data = JSON.parse(fs.readFileSync(traditionalFile, 'utf8'));
    mlData = {
      predictions: data.mlModel.predictions.map((p: any) => ({
        ...p,
        model: 'ML',
        Player: p.player,
        Team: p.team,
        Opponent: p.opponent,
        Probability: `${(p.mlProbability * 100).toFixed(1)}%`,
        'Historical vs Opponent': p.keyFactors ? p.keyFactors.join('; ') : 'N/A',
        actualResult: p.actualResult
      }))
    };
  }

  // Volume predictions - try JSON first, fall back to extracting from combined data
  let volumeData: ModelData = { predictions: [] };
  const volumeFile = path.join(dataDir, `week${week}-volume-analysis.json`);
  if (fs.existsSync(volumeFile)) {
    const data = JSON.parse(fs.readFileSync(volumeFile, 'utf8'));
    volumeData = { predictions: data.players || [] };
  } else {
    // Use combined data as fallback for volume display
    const combinedFile = path.join(dataDir, `week${week}-combined-predictions.json`);
    if (fs.existsSync(combinedFile)) {
      const data = JSON.parse(fs.readFileSync(combinedFile, 'utf8'));
      volumeData = { predictions: data.predictions || [] };
    }
  }

  // Combined predictions
  let combinedData: ModelData = { predictions: [] };
  const combinedFile = path.join(dataDir, `week${week}-combined-predictions.json`);
  if (fs.existsSync(combinedFile)) {
    const data = JSON.parse(fs.readFileSync(combinedFile, 'utf8'));
    combinedData = { predictions: data.predictions || [] };
  }

  // Enhanced predictions
  let enhancedData: ModelData = { predictions: [] };
  const enhancedFile = path.join(dataDir, `week${week}-enhanced-predictions.json`);
  if (fs.existsSync(enhancedFile)) {
    const data = JSON.parse(fs.readFileSync(enhancedFile, 'utf8'));
    enhancedData = { predictions: data.predictions || [] };
  }

  const html = `<!DOCTYPE html>
<html>
<head>
    <title>Week ${week} Combined TD Predictions - ${season} NFL Season</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #0a0e1a;
            color: white;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            border-radius: 10px;
        }
        .tabs {
            display: flex;
            background-color: #1a1f2e;
            border-radius: 8px 8px 0 0;
            overflow: hidden;
            margin-bottom: 0;
        }
        .tab {
            flex: 1;
            padding: 15px;
            background-color: #2d3748;
            color: #a0aec0;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
            border: none;
            font-size: 14px;
            font-weight: bold;
        }
        .tab:hover {
            background-color: #4a5568;
            color: white;
        }
        .tab.active {
            background-color: #6366f1;
            color: white;
        }
        .tab-content {
            display: none;
            background-color: #1a1f2e;
            padding: 20px;
            border-radius: 0 0 8px 8px;
            min-height: 600px;
        }
        .tab-content.active {
            display: block;
        }
        .model-info {
            background-color: #2d3748;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #6366f1;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            background-color: #2d3748;
            border-radius: 8px;
            overflow: hidden;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #4a5568;
        }
        th {
            background-color: #6366f1;
            color: white;
            font-weight: bold;
            position: sticky;
            top: 0;
        }
        tr:hover {
            background-color: #4a5568;
        }
        .rank {
            font-weight: bold;
            color: #6366f1;
        }
        .player-name {
            font-weight: bold;
        }
        .score {
            font-weight: bold;
            color: #10b981;
        }
        .model-badge {
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: bold;
        }
        .current-badge { background-color: #3b82f6; color: white; }
        .ml-badge { background-color: #10b981; color: white; }
        .volume-badge { background-color: #f59e0b; color: white; }
        .combined-badge { background-color: #8b5cf6; color: white; }
        .enhanced-badge { background-color: #ec4899; color: white; }
        .injury-healthy { color: #48bb78; }
        .injury-questionable { color: #ed8936; }
        .injury-doubtful { color: #f56565; }
        .injury-out { color: #e53e3e; }
        .summary-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        .stat-card {
            background-color: #2d3748;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #6366f1;
        }
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            color: #6366f1;
        }
        .comparison-view {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .model-column {
            background-color: #2d3748;
            padding: 15px;
            border-radius: 8px;
        }
        .searchable {
            width: 100%;
            padding: 10px;
            margin-bottom: 15px;
            background-color: #2d3748;
            border: 1px solid #4a5568;
            border-radius: 4px;
            color: white;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏈 Week ${week} Combined TD Predictions</h1>
        <p>All prediction models in one interface | ${season} NFL Season</p>
        <p>Generated: ${new Date().toLocaleDateString()}</p>
    </div>

    <div class="tabs">
        <button class="tab active" onclick="showTab('traditional')">
            📊 Current (${traditionalData.predictions.length})
        </button>
        <button class="tab" onclick="showTab('ml')">
            🤖 ML Model (${mlData.predictions.length})
        </button>
        <button class="tab" onclick="showTab('volume')">
            📈 Volume (${volumeData.predictions.length})
        </button>
        <button class="tab" onclick="showTab('combined')">
            🎯 Combined (${combinedData.predictions.length})
        </button>
        <button class="tab" onclick="showTab('enhanced')">
            🚀 Enhanced (${enhancedData.predictions.length})
        </button>
        <button class="tab" onclick="showTab('comparison')">
            ⚖️ Compare All
        </button>
    </div>

    <!-- Current Model Tab -->
    <div id="traditional" class="tab-content active">
        <div class="model-info">
            <h3>📊 Current Model</h3>
            <p><strong>Methodology:</strong> Historical performance + defensive matchups + massive rookie boosts for hot performers.</p>
            <p><strong>Total Predictions:</strong> ${traditionalData.predictions.length}</p>
        </div>

        <input type="text" class="searchable" placeholder="Search players..." onkeyup="searchTable('traditional-table', this.value)">

        <table id="traditional-table">
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Team</th>
                    <th>vs</th>
                    <th>Model</th>
                    <th>Score/Probability</th>
                    <th>Historical vs Opp</th>
                </tr>
            </thead>
            <tbody>
                ${traditionalData.predictions.map((p, i) => `
                <tr>
                    <td class="rank">#${i + 1}</td>
                    <td class="player-name">${p.Player}${p.actualResult === true ? ' ✅' : p.actualResult === false ? ' ❌' : p.actualResult === undefined ? getResultMark(p.Player, p.Team, week, season) : ''}</td>
                    <td>${p.Team}</td>
                    <td>${p.Opponent || 'TBD'}</td>
                    <td><span class="model-badge ${p.model?.toLowerCase()}-badge">${p.model}</span></td>
                    <td class="score">${p.Probability || 'N/A'}</td>
                    <td>${p['Historical vs Opponent'] || 'N/A'}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <!-- ML Model Tab -->
    <div id="ml" class="tab-content">
        <div class="model-info">
            <h3>🤖 ML Model</h3>
            <p><strong>Methodology:</strong> Machine learning predictions using 2024 season data, opponent history, and recent form.</p>
            <p><strong>Total Predictions:</strong> ${mlData.predictions.length}</p>
        </div>

        <input type="text" class="searchable" placeholder="Search players..." onkeyup="searchTable('ml-table', this.value)">

        <table id="ml-table">
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Team</th>
                    <th>vs</th>
                    <th>Position</th>
                    <th>ML Probability</th>
                    <th>Key Factors</th>
                </tr>
            </thead>
            <tbody>
                ${mlData.predictions.map((p, i) => `
                <tr>
                    <td class="rank">#${i + 1}</td>
                    <td class="player-name">${p.Player}${p.actualResult === true ? ' ✅' : p.actualResult === false ? ' ❌' : p.actualResult === undefined ? getResultMark(p.Player, p.Team, week, season) : ''}</td>
                    <td>${p.Team}</td>
                    <td>${p.Opponent || 'TBD'}</td>
                    <td>${p.position || 'N/A'}</td>
                    <td class="score">${p.Probability || 'N/A'}</td>
                    <td>${p['Historical vs Opponent'] || 'N/A'}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <!-- Volume Predictions Tab -->
    <div id="volume" class="tab-content">
        <div class="model-info">
            <h3>📈 Volume-Based Model</h3>
            <p><strong>Methodology:</strong> Targets, carries, red zone opportunities, and defensive matchups.</p>
            <p><strong>Total Predictions:</strong> ${volumeData.predictions.length}</p>
        </div>

        <input type="text" class="searchable" placeholder="Search players..." onkeyup="searchTable('volume-table', this.value)">

        <table id="volume-table">
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Team</th>
                    <th>vs</th>
                    <th>Pos</th>
                    <th>Targets</th>
                    <th>Carries</th>
                    <th>RZ Opps</th>
                    <th>Defense Rank</th>
                </tr>
            </thead>
            <tbody>
                ${volumeData.predictions.map((p, i) => `
                <tr>
                    <td class="rank">#${i + 1}</td>
                    <td class="player-name">${p.playerName || p.Player}${getResultMark(p.playerName || p.Player, p.team || p.Team, week, season)}</td>
                    <td>${p.team || p.Team}</td>
                    <td>${p.opponent || p.Opponent || 'TBD'}</td>
                    <td>${p.position || p.Position}</td>
                    <td>${p.targets || 'N/A'}</td>
                    <td>${p.carries || 'N/A'}</td>
                    <td>${p.redZoneOpportunities || 'N/A'}</td>
                    <td>${p.defenseRank || p.defensiveRank || 'N/A'}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <!-- Combined Predictions Tab -->
    <div id="combined" class="tab-content">
        <div class="model-info">
            <h3>🎯 Combined Volume + Defense Model</h3>
            <p><strong>Formula:</strong> 60% Volume + 30% Defense + 10% Historical</p>
            <p><strong>Total Predictions:</strong> ${combinedData.predictions.length}</p>
        </div>

        <input type="text" class="searchable" placeholder="Search players..." onkeyup="searchTable('combined-table', this.value)">

        <table id="combined-table">
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Team</th>
                    <th>vs</th>
                    <th>Pos</th>
                    <th>Final Score</th>
                    <th>Volume</th>
                    <th>Defense</th>
                    <th>Injury</th>
                </tr>
            </thead>
            <tbody>
                ${combinedData.predictions.map((p, i) => `
                <tr>
                    <td class="rank">#${i + 1}</td>
                    <td class="player-name">${p.playerName}${getResultMark(p.playerName, p.team, week, season)}</td>
                    <td>${p.team}</td>
                    <td>${p.opponent}</td>
                    <td>${p.position}</td>
                    <td class="score">${p.finalScore}</td>
                    <td>${p.volumeScore}</td>
                    <td>${p.defenseScore}</td>
                    <td class="injury-${p.injuryStatus?.toLowerCase().replace(' ', '-') || 'healthy'}">${p.injuryStatus || 'Healthy'}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <!-- Enhanced Predictions Tab -->
    <div id="enhanced" class="tab-content">
        <div class="model-info">
            <h3>🚀 Enhanced Model v2.0</h3>
            <p><strong>Formula:</strong> 50% Volume + 25% Defense + 15% Game Script + 10% Usage Trends</p>
            <p><strong>Total Predictions:</strong> ${enhancedData.predictions.length}</p>
        </div>

        <input type="text" class="searchable" placeholder="Search players..." onkeyup="searchTable('enhanced-table', this.value)">

        <table id="enhanced-table">
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Team</th>
                    <th>vs</th>
                    <th>Pos</th>
                    <th>Final Score</th>
                    <th>Breakdown</th>
                    <th>Prediction</th>
                    <th>Injury</th>
                </tr>
            </thead>
            <tbody>
                ${enhancedData.predictions.map((p, i) => `
                <tr>
                    <td class="rank">#${i + 1}</td>
                    <td class="player-name">${p.playerName}${getResultMark(p.playerName, p.team, week, season)}</td>
                    <td>${p.team}</td>
                    <td>${p.opponent}</td>
                    <td>${p.position}</td>
                    <td class="score">${p.finalScore}</td>
                    <td>V:${p.volumeScore} D:${p.defenseScore} GS:${p.gameScriptScore} UT:${p.usageTrendScore}</td>
                    <td>${p.prediction}</td>
                    <td class="injury-${p.injuryStatus?.toLowerCase().replace(/[^a-z]/g, '') || 'healthy'}">${p.injuryStatus || 'Healthy'}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <!-- Comparison Tab -->
    <div id="comparison" class="tab-content">
        <div class="model-info">
            <h3>⚖️ Model Comparison</h3>
            <p>Side-by-side comparison of all prediction models</p>
        </div>

        <div class="summary-stats">
            <div class="stat-card">
                <div class="stat-number">${traditionalData.predictions.length}</div>
                <div>Current Model</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${mlData.predictions.length}</div>
                <div>ML Model</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${volumeData.predictions.length}</div>
                <div>Volume Picks</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${combinedData.predictions.length}</div>
                <div>Combined Picks</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${enhancedData.predictions.length}</div>
                <div>Enhanced Picks</div>
            </div>
        </div>

        ${(() => {
            // Find common players across all models
            const normalizePlayerName = (name: string) => name.toLowerCase().trim().replace(/[^a-z ]/g, '');

            // Create player sets for each model
            const traditionalPlayers = new Set(traditionalData.predictions.map(p => normalizePlayerName(p.Player)));
            const mlPlayers = new Set(mlData.predictions.map(p => normalizePlayerName(p.Player)));
            const volumePlayers = new Set(volumeData.predictions.map(p => normalizePlayerName(p.playerName || p.Player)));
            const combinedPlayers = new Set(combinedData.predictions.map(p => normalizePlayerName(p.playerName)));
            const enhancedPlayers = new Set(enhancedData.predictions.map(p => normalizePlayerName(p.playerName)));

            // Find players common to at least 2 models
            const allPlayers = new Set([
                ...traditionalPlayers,
                ...mlPlayers,
                ...volumePlayers,
                ...combinedPlayers,
                ...enhancedPlayers
            ]);

            const commonPlayers: {name: string, count: number, models: string[], team: string}[] = [];

            allPlayers.forEach(playerName => {
                let count = 0;
                const models: string[] = [];
                let team = '';

                if (traditionalPlayers.has(playerName)) {
                    count++;
                    models.push('Current');
                    const p = traditionalData.predictions.find(p => normalizePlayerName(p.Player) === playerName);
                    if (p) team = p.Team;
                }
                if (mlPlayers.has(playerName)) {
                    count++;
                    models.push('ML');
                    const p = mlData.predictions.find(p => normalizePlayerName(p.Player) === playerName);
                    if (p && !team) team = p.Team;
                }
                if (volumePlayers.has(playerName)) {
                    count++;
                    models.push('Volume');
                    const p = volumeData.predictions.find(p => normalizePlayerName(p.playerName || p.Player) === playerName);
                    if (p && !team) team = p.team || p.Team;
                }
                if (combinedPlayers.has(playerName)) {
                    count++;
                    models.push('Combined');
                    const p = combinedData.predictions.find(p => normalizePlayerName(p.playerName) === playerName);
                    if (p && !team) team = p.team;
                }
                if (enhancedPlayers.has(playerName)) {
                    count++;
                    models.push('Enhanced');
                    const p = enhancedData.predictions.find(p => normalizePlayerName(p.playerName) === playerName);
                    if (p && !team) team = p.team;
                }

                if (count >= 2) {
                    // Get the properly capitalized name
                    let displayName = playerName;
                    const trad = traditionalData.predictions.find(p => normalizePlayerName(p.Player) === playerName);
                    const ml = mlData.predictions.find(p => normalizePlayerName(p.Player) === playerName);
                    const vol = volumeData.predictions.find(p => normalizePlayerName(p.playerName || p.Player) === playerName);
                    const comb = combinedData.predictions.find(p => normalizePlayerName(p.playerName) === playerName);
                    const enh = enhancedData.predictions.find(p => normalizePlayerName(p.playerName) === playerName);

                    displayName = trad?.Player || ml?.Player || vol?.playerName || vol?.Player || comb?.playerName || enh?.playerName || playerName;

                    commonPlayers.push({ name: displayName, count, models, team });
                }
            });

            // Sort by count (most models first), then by name
            commonPlayers.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

            return `
        <div class="model-info" style="margin-top: 30px;">
            <h3>🎯 Common Players Across Models</h3>
            <p>Players that appear in multiple prediction models (${commonPlayers.length} total)</p>
        </div>

        <table style="margin-bottom: 30px;">
            <thead>
                <tr>
                    <th>Player</th>
                    <th>Team</th>
                    <th>Models</th>
                    <th>Appears In</th>
                </tr>
            </thead>
            <tbody>
                ${commonPlayers.map(cp => `
                <tr>
                    <td class="player-name">${cp.name}</td>
                    <td>${cp.team}</td>
                    <td><span class="score">${cp.count}/5</span> models</td>
                    <td>${cp.models.map(m => `<span class="model-badge ${m.toLowerCase()}-badge">${m}</span>`).join(' ')}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="comparison-view">
            <div class="model-column">
                <h4>📊 Top Current Picks</h4>
                ${traditionalData.predictions.slice(0, 10).map((p, i) => `
                <div>${i + 1}. <strong>${p.Player}${p.actualResult === true ? ' ✅' : p.actualResult === false ? ' ❌' : p.actualResult === undefined ? getResultMark(p.Player, p.Team, week, season) : ''}</strong> (${p.Team}) - ${p.Probability}</div>
                `).join('')}
            </div>

            <div class="model-column">
                <h4>🤖 Top ML Picks</h4>
                ${mlData.predictions.slice(0, 10).map((p, i) => `
                <div>${i + 1}. <strong>${p.Player}${p.actualResult === true ? ' ✅' : p.actualResult === false ? ' ❌' : p.actualResult === undefined ? getResultMark(p.Player, p.Team, week, season) : ''}</strong> (${p.Team}) - ${p.Probability}</div>
                `).join('')}
            </div>

            <div class="model-column">
                <h4>📈 Top Volume Picks</h4>
                ${volumeData.predictions.slice(0, 10).map((p, i) => `
                <div>${i + 1}. <strong>${p.playerName || p.Player}${getResultMark(p.playerName || p.Player, p.team || p.Team, week, season)}</strong> (${p.team || p.Team})</div>
                `).join('')}
            </div>

            <div class="model-column">
                <h4>🎯 Top Combined Picks</h4>
                ${combinedData.predictions.slice(0, 10).map((p, i) => `
                <div>${i + 1}. <strong>${p.playerName}${getResultMark(p.playerName, p.team, week, season)}</strong> (${p.team}) - ${p.finalScore}</div>
                `).join('')}
            </div>

            <div class="model-column">
                <h4>🚀 Top Enhanced Picks</h4>
                ${enhancedData.predictions.slice(0, 10).map((p, i) => `
                <div>${i + 1}. <strong>${p.playerName}${getResultMark(p.playerName, p.team, week, season)}</strong> (${p.team}) - ${p.finalScore}</div>
                `).join('')}
            </div>
        </div>
        `;
        })()}
    </div>
    </div>

    <script>
        function showTab(tabName) {
            // Hide all tab contents
            const contents = document.querySelectorAll('.tab-content');
            contents.forEach(content => content.classList.remove('active'));

            // Remove active class from all tabs
            const tabs = document.querySelectorAll('.tab');
            tabs.forEach(tab => tab.classList.remove('active'));

            // Show selected tab content
            document.getElementById(tabName).classList.add('active');

            // Add active class to clicked tab
            event.target.classList.add('active');
        }

        function searchTable(tableId, searchTerm) {
            const table = document.getElementById(tableId);
            const rows = table.getElementsByTagName('tr');

            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                const playerName = row.cells[1].textContent.toLowerCase();
                const team = row.cells[2].textContent.toLowerCase();

                if (playerName.includes(searchTerm.toLowerCase()) ||
                    team.includes(searchTerm.toLowerCase())) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            }
        }
    </script>
</body>
</html>`;

  const outputFile = path.join(dataDir, `week${week}-all-predictions.html`);
  fs.writeFileSync(outputFile, html);

  console.log(`✅ Combined interface generated: ${outputFile}`);
  console.log(`📊 Includes:`);
  console.log(`   • Current Model: ${traditionalData.predictions.length} predictions`);
  console.log(`   • ML Model: ${mlData.predictions.length} predictions`);
  console.log(`   • Volume: ${volumeData.predictions.length} predictions`);
  console.log(`   • Combined: ${combinedData.predictions.length} predictions`);
  console.log(`   • Enhanced: ${enhancedData.predictions.length} predictions`);
}

// Run if called directly
const week = parseInt(process.argv[2]);
const season = parseInt(process.argv[3]) || 2025;

if (!week) {
  console.error('Usage: npx tsx generate-combined-interface.ts <week> [season]');
  console.error('Example: npx tsx generate-combined-interface.ts 5 2025');
  process.exit(1);
}

generateCombinedInterface(week, season);

export { generateCombinedInterface };