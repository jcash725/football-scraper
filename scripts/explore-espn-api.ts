#!/usr/bin/env tsx
// Explore ESPN API to see what player volume data is available

async function exploreESPNAPI() {
  // Use a recent game ID to explore available data
  const gameId = "401772938"; // Week 4 SEA @ ARI game

  console.log('🔍 Exploring ESPN API data structure...\n');

  try {
    // 1. Game Summary endpoint
    console.log('📡 1. Game Summary endpoint:');
    const summaryUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${gameId}`;
    console.log(`   ${summaryUrl}`);

    const summaryResponse = await fetch(summaryUrl);
    const summaryData = await summaryResponse.json();

    console.log('   Available sections:');
    console.log(`   - header: ${!!summaryData.header}`);
    console.log(`   - boxscore: ${!!summaryData.boxscore}`);
    console.log(`   - gameInfo: ${!!summaryData.gameInfo}`);
    console.log(`   - drives: ${!!summaryData.drives}`);
    console.log(`   - scoringPlays: ${!!summaryData.scoringPlays}`);
    console.log(`   - standings: ${!!summaryData.standings}`);

    // Check if boxscore has player stats
    if (summaryData.boxscore) {
      console.log('\n   📊 Boxscore structure:');
      console.log(`   - teams: ${summaryData.boxscore.teams?.length || 0} teams`);

      if (summaryData.boxscore.teams) {
        summaryData.boxscore.teams.forEach((team: any, i: number) => {
          console.log(`   Team ${i + 1} (${team.team?.displayName}):`);
          console.log(`     - statistics: ${team.statistics?.length || 0} stats`);
          console.log(`     - players: ${team.players?.length || 0} player groups`);

          if (team.statistics) {
            console.log('     Statistics available:', team.statistics.map((s: any) => s.name).slice(0, 5).join(', '));
          }

          if (team.players) {
            team.players.forEach((playerGroup: any, j: number) => {
              console.log(`     Player Group ${j + 1}: ${playerGroup.name} (${playerGroup.athletes?.length || 0} players)`);

              // Show first player's stats structure
              if (playerGroup.athletes && playerGroup.athletes[0]) {
                const firstPlayer = playerGroup.athletes[0];
                console.log(`       Example player: ${firstPlayer.athlete?.displayName}`);
                console.log(`       Stats available: ${firstPlayer.stats?.length || 0} stat categories`);

                if (firstPlayer.stats) {
                  firstPlayer.stats.forEach((statCategory: any, k: number) => {
                    console.log(`         ${k + 1}. ${statCategory.name}: ${statCategory.stats?.join(', ') || 'No stats'}`);
                  });
                }
              }
            });
          }
        });
      }
    }

    console.log('\n🔍 2. Checking alternative ESPN endpoints...');

    // 2. Try game details endpoint
    const detailsUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${gameId}&enable=roster,stats,odds`;
    console.log(`   📡 Game details with stats: ${detailsUrl}`);

    // 3. Try team roster endpoint
    const rosterUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/26/roster`; // Seahawks
    console.log(`   📡 Team roster: ${rosterUrl}`);

    console.log('\n💡 Recommendations:');
    console.log('   1. Check if boxscore.teams[].players[] contains volume stats');
    console.log('   2. Explore ESPN\'s detailed game endpoints');
    console.log('   3. Consider alternative sources like NFL.com or Pro Football Reference');
    console.log('   4. Look into fantasy sports APIs that track targets/carries');

  } catch (error) {
    console.error('❌ Error exploring ESPN API:', error);
  }
}

exploreESPNAPI().catch(console.error);