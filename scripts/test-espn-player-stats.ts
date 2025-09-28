#!/usr/bin/env tsx
// Test different ESPN endpoints to find player volume data

async function testESPNPlayerStats() {
  const gameId = "401772938"; // SEA @ ARI Week 4

  console.log('🔍 Testing ESPN endpoints for player stats...\n');

  // Test different ESPN endpoints that might have player data
  const endpoints = [
    `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${gameId}`,
    `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${gameId}&enable=boxscore`,
    `https://www.espn.com/nfl/game/_/gameId/${gameId}`, // Web version
    `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?event=${gameId}`,
    `https://site.api.espn.com/apis/site/v2/sports/football/nfl/events/${gameId}`,
    `https://site.api.espn.com/apis/site/v2/sports/football/nfl/events/${gameId}/competitions/${gameId}/boxscore`
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`📡 Testing: ${endpoint}`);
      const response = await fetch(endpoint);

      if (!response.ok) {
        console.log(`   ❌ Failed: ${response.status}`);
        continue;
      }

      const data = await response.json();

      // Look for player data
      let foundPlayerStats = false;

      // Check various paths where player stats might exist
      const paths = [
        'boxscore.teams',
        'competitions[0].competitors',
        'events[0].competitions[0].competitors',
        'teams',
        'gamepackageJSON.boxscore'
      ];

      for (const path of paths) {
        const pathData = getNestedValue(data, path);
        if (pathData && Array.isArray(pathData)) {
          console.log(`   ✅ Found team data at: ${path}`);

          pathData.forEach((team: any, i: number) => {
            if (team.players && Array.isArray(team.players)) {
              console.log(`     Team ${i + 1}: ${team.players.length} player groups`);
              foundPlayerStats = true;

              // Examine first player group
              if (team.players[0]) {
                const playerGroup = team.players[0];
                console.log(`       Group: ${playerGroup.name}`);

                if (playerGroup.athletes && playerGroup.athletes[0]) {
                  const player = playerGroup.athletes[0];
                  console.log(`       Player: ${player.athlete?.displayName || 'Unknown'}`);

                  if (player.stats) {
                    console.log(`       Stats: ${player.stats.length} categories`);
                    player.stats.forEach((stat: any) => {
                      console.log(`         - ${stat.name}: ${stat.stats?.join(', ') || 'No data'}`);
                    });
                  }
                }
              }
            } else if (team.statistics) {
              console.log(`     Team ${i + 1}: ${team.statistics.length} team stats (no individual players)`);
            }
          });
        }
      }

      if (!foundPlayerStats) {
        console.log(`   ⚠️  No individual player stats found`);
      }

      console.log('');

    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
    }
  }

  console.log('\n💡 Alternative Data Sources to Consider:');
  console.log('   1. NFL.com API (if publicly available)');
  console.log('   2. Pro Football Reference scraping');
  console.log('   3. Fantasy football APIs (ESPN Fantasy, Yahoo, etc.)');
  console.log('   4. Sports data services (SportsRadar, etc.)');
  console.log('   5. Manual data entry for key volume metrics');
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    if (key.includes('[') && key.includes(']')) {
      const arrayKey = key.substring(0, key.indexOf('['));
      const index = parseInt(key.substring(key.indexOf('[') + 1, key.indexOf(']')));
      return current?.[arrayKey]?.[index];
    }
    return current?.[key];
  }, obj);
}

testESPNPlayerStats().catch(console.error);