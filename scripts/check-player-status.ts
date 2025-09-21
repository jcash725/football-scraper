#!/usr/bin/env tsx
// Check player active/inactive status using ESPN's more detailed APIs

async function checkPlayerStatus(playerName: string, teamAbbr?: string) {
  console.log(`🔍 Checking ${playerName} status via ESPN APIs...\n`);

  // Try multiple ESPN API endpoints that might have current roster/status data
  const endpoints = [
    // Team roster endpoint
    teamAbbr ? `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamAbbr}/roster` : null,
    // Current week scoreboard (has active player data)
    'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
    // Player search endpoint
    `https://site.api.espn.com/apis/site/v2/sports/football/nfl/athletes?limit=200&search=${encodeURIComponent(playerName)}`,
    // Depth chart endpoint (if available)
    teamAbbr ? `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamAbbr}/depthchart` : null
  ].filter(Boolean);

  for (const endpoint of endpoints) {
    try {
      console.log(`📡 Trying: ${endpoint}`);
      const response = await fetch(endpoint);

      if (!response.ok) {
        console.log(`   ❌ Failed: ${response.status}`);
        continue;
      }

      const data = await response.json();

      // Search for the player in the response
      const found = searchForPlayer(data, playerName);
      if (found) {
        console.log(`   ✅ Found ${playerName}:`);
        console.log(`   Status: ${found.status || 'Unknown'}`);
        console.log(`   Active: ${found.active}`);
        console.log(`   Team: ${found.team || 'Unknown'}`);
        console.log(`   Position: ${found.position || 'Unknown'}`);
        if (found.injury) {
          console.log(`   Injury: ${found.injury}`);
        }
        if (found.rawStatus) {
          console.log(`   Raw Status Object:`, JSON.stringify(found.rawStatus, null, 2));
        }
        return found;
      } else {
        console.log(`   ❌ Not found in this endpoint`);
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  return null;
}

function searchForPlayer(data: any, playerName: string): any {
  const searchName = playerName.toLowerCase();

  // Recursive search function
  function search(obj: any, path: string = ''): any {
    if (!obj || typeof obj !== 'object') return null;

    // Check if this object represents a player
    if (obj.displayName || obj.fullName || obj.name) {
      const name = (obj.displayName || obj.fullName || obj.name).toLowerCase();
      if (name.includes(searchName.split(' ')[0]) && name.includes(searchName.split(' ')[1])) {
        return {
          name: obj.displayName || obj.fullName || obj.name,
          status: obj.status?.name || obj.status?.type || obj.active || obj.gameStatus || 'Unknown',
          team: obj.team?.displayName || obj.team?.name,
          position: obj.position?.abbreviation || obj.position?.name,
          injury: obj.injury?.type || obj.injuryStatus,
          active: obj.active,
          rawStatus: obj.status,
          data: obj
        };
      }
    }

    // Recursively search arrays and objects
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const result = search(item, path);
        if (result) return result;
      }
    } else {
      for (const [key, value] of Object.entries(obj)) {
        const result = search(value, `${path}.${key}`);
        if (result) return result;
      }
    }

    return null;
  }

  return search(data);
}

// Check Jordan Addison specifically
async function main() {
  const players = [
    { name: 'Jordan Addison', team: 'min' },
    { name: 'Tee Higgins', team: 'cin' },
    { name: 'Malik Nabers', team: 'nyg' }
  ];

  for (const player of players) {
    await checkPlayerStatus(player.name, player.team);
    console.log('\n' + '='.repeat(50) + '\n');
  }
}

main().catch(console.error);