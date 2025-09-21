#!/usr/bin/env tsx
// Check injury status for Week 3 predictions

import { InjuryTracker } from './lib/injury-tracker.js';

const currentModelPlayers = [
  'Ja\'Marr Chase', 'Mike Evans', 'Justin Jefferson', 'Quentin Johnston',
  'Tee Higgins', 'Brian Thomas Jr.', 'Marvin Harrison Jr.', 'Jordan Addison',
  'Courtland Sutton', 'Malik Nabers', 'Nico Collins', 'Nick Westbrook-Ikhine',
  'Ladd McConkey', 'Jalen McMillan', 'De\'Von Achane', 'Garrett Wilson', 'Alvin Kamara'
];

const mlModelOnlyPlayers = [
  'Sam LaPorta', 'Mark Andrews'
  // Note: Most ML model players overlap with Current Model
];

async function checkInjuries() {
  const tracker = new InjuryTracker();
  console.log('🏥 Checking injury status for Week 3 ML Model unique players...\n');

  const injuredPlayers = [];
  const healthyPlayers = [];

  for (const player of mlModelOnlyPlayers) {
    try {
      const result = await tracker.validatePlayerRecommendation(player);
      const status = result.injuryStatus || 'Healthy';
      const team = result.currentTeam || 'Unknown';
      const warning = result.warning ? ' ⚠️ ' + result.warning : '';

      console.log(`${result.isValid ? '✅' : '❌'} ${player} (${team}) - ${status}${warning}`);

      if (!result.isValid) {
        injuredPlayers.push({
          name: player,
          team,
          status,
          impact: result.impactLevel || 'Unknown',
          warning: result.warning
        });
        console.log(`   Impact: ${result.impactLevel || 'Unknown'}`);
      } else {
        healthyPlayers.push({ name: player, team });
      }
    } catch (error) {
      console.log(`❌ ${player} - Error checking status`);
      injuredPlayers.push({
        name: player,
        team: 'Unknown',
        status: 'Error checking',
        impact: 'Unknown'
      });
    }

    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n📋 SUMMARY:');
  console.log(`✅ Healthy players: ${healthyPlayers.length}`);
  console.log(`❌ Injured/Questionable: ${injuredPlayers.length}`);

  if (injuredPlayers.length > 0) {
    console.log('\n⚠️ PLAYERS TO REPLACE:');
    injuredPlayers.forEach(player => {
      console.log(`   ${player.name} (${player.team}) - ${player.status} - ${player.impact} impact`);
    });
  }

  return { injured: injuredPlayers, healthy: healthyPlayers };
}

checkInjuries().catch(console.error);