#!/usr/bin/env tsx
// Validate Week 3 predictions and suggest replacements

import { DynamicPlayerValidator } from './lib/dynamic-player-validator.js';
import fs from 'fs';

async function validateWeek3Predictions() {
  console.log('🏈 Validating Week 3 Predictions...\n');

  // Extract players from the HTML predictions file
  const htmlPath = 'data/week3-predictions.html';

  if (!fs.existsSync(htmlPath)) {
    console.log('❌ Week 3 predictions file not found. Run: npm run week 3 2025');
    return;
  }

  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  const players = extractPlayersFromHTML(htmlContent);

  console.log(`Found ${players.length} unique players in Week 3 predictions\n`);

  // Extract just player names for validation
  const playerNames = players.map(p => p.name);

  // Validate all players using touchdown history
  const validator = new DynamicPlayerValidator();
  const results = await validator.validatePlayerList(playerNames);

  // Report results
  if (results.inactivePlayers.length > 0) {
    console.log('\n⚠️  PLAYERS NEEDING REPLACEMENT:');
    results.inactivePlayers.forEach((player, index) => {
      console.log(`${index + 1}. ${player.name} (${player.expectedTeam}) - ${player.status} ${player.reason ? `(${player.reason})` : ''}`);
    });
  }

  if (results.teamChanges.length > 0) {
    console.log('\n🔄 PLAYERS WHO CHANGED TEAMS:');
    results.teamChanges.forEach((player, index) => {
      console.log(`${index + 1}. ${player.name} - ${player.expectedTeam} → ${player.currentTeam}`);
    });
  }

  if (results.replacementsNeeded > 0) {
    console.log(`\n🔄 ${results.replacementsNeeded} replacement(s) needed for optimal predictions`);
    console.log('💡 Consider finding backup players with similar TD potential');
  } else {
    console.log('\n✅ All predicted players are active and available!');
  }

  // Save results for reference
  const validationResult = {
    validatedAt: new Date().toISOString(),
    totalPlayers: playerNames.length,
    activePlayers: results.activePlayers.length,
    inactivePlayers: results.inactivePlayers.length,
    teamChanges: results.teamChanges.length,
    inactivePlayerDetails: results.inactivePlayers,
    teamChangeDetails: results.teamChanges
  };

  fs.writeFileSync('data/week3-validation.json', JSON.stringify(validationResult, null, 2));
  console.log('\n📝 Validation results saved to data/week3-validation.json');
}

function extractPlayersFromHTML(htmlContent: string): Array<{name: string, team?: string}> {
  const players = new Set<string>();
  const playerTeamMap = new Map<string, string>();

  // Extract player names from HTML table rows
  const playerRegex = /<td><strong>([^<#]+?)<\/strong><\/td>/g;
  const teamRegex = /<td>([^<]+?)<\/td>\s*<td>vs/g;

  let match;

  // Extract players
  while ((match = playerRegex.exec(htmlContent)) !== null) {
    const playerName = match[1].trim();
    if (!playerName.startsWith('#') && playerName.length > 2) {
      players.add(playerName);
    }
  }

  // Extract teams (this is a simplified approach)
  const lines = htmlContent.split('\n');
  let currentPlayer = '';

  for (const line of lines) {
    const playerMatch = line.match(/<td><strong>([^<#]+?)<\/strong><\/td>/);
    if (playerMatch) {
      currentPlayer = playerMatch[1].trim();
    }

    const teamMatch = line.match(/<td>([^<]+?)<\/td>/);
    if (teamMatch && currentPlayer && !teamMatch[1].includes('vs') && !teamMatch[1].includes('#')) {
      const team = teamMatch[1].trim();
      if (team.length > 3 && !team.match(/^\d+$/)) {
        playerTeamMap.set(currentPlayer, team);
      }
    }
  }

  // Convert to array with team info
  return Array.from(players).map(name => ({
    name,
    team: playerTeamMap.get(name)
  }));
}

validateWeek3Predictions().catch(console.error);