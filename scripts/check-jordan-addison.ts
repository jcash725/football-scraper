#!/usr/bin/env tsx
// Check Jordan Addison's current injury status

async function checkJordanAddison() {
  console.log('🔍 Checking Jordan Addison injury status from ESPN API...\n');

  try {
    const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/injuries');

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Search through all teams for Jordan Addison
    let foundPlayer = null;

    if (data.injuries && Array.isArray(data.injuries)) {
      for (const teamData of data.injuries) {
        if (teamData.athletes && Array.isArray(teamData.athletes)) {
          for (const athlete of teamData.athletes) {
            const name = athlete.displayName || athlete.fullName || '';
            if (name.toLowerCase().includes('jordan') && name.toLowerCase().includes('addison')) {
              foundPlayer = {
                name: name,
                team: teamData.team?.displayName || 'Unknown',
                status: athlete.status || 'Unknown',
                injury: athlete.injury || null,
                position: athlete.position?.abbreviation || 'Unknown'
              };
              break;
            }
          }
        }
        if (foundPlayer) break;
      }
    }

    if (foundPlayer) {
      console.log('✅ Found Jordan Addison in injury report:');
      console.log(`   Name: ${foundPlayer.name}`);
      console.log(`   Team: ${foundPlayer.team}`);
      console.log(`   Status: ${foundPlayer.status}`);
      console.log(`   Position: ${foundPlayer.position}`);

      if (foundPlayer.injury) {
        console.log(`   Injury: ${foundPlayer.injury.type || 'N/A'}`);
        console.log(`   Description: ${foundPlayer.injury.description || 'N/A'}`);
      }

      if (foundPlayer.status !== 'Active') {
        console.log('\n⚠️  WARNING: Jordan Addison is NOT active!');
        console.log('   Consider replacing him in Week 3 predictions.');
      }
    } else {
      console.log('❌ Jordan Addison not found in injury report');
      console.log('   This could mean:');
      console.log('   1. He is healthy (not on injury report)');
      console.log('   2. The API data is outdated/incomplete');
      console.log('   3. Name variations not captured');

      // Let's also check the raw team data for Minnesota Vikings
      console.log('\n🔍 Checking Minnesota Vikings roster specifically...');

      for (const teamData of data.injuries) {
        if (teamData.team?.displayName?.includes('Vikings') || teamData.team?.displayName?.includes('Minnesota')) {
          console.log(`   Found ${teamData.team.displayName}:`);
          if (teamData.athletes) {
            teamData.athletes.forEach((athlete: any) => {
              console.log(`     ${athlete.displayName || athlete.fullName} - ${athlete.status}`);
            });
          }
          break;
        }
      }
    }

  } catch (error) {
    console.error('❌ Error checking Jordan Addison status:', error);
  }
}

checkJordanAddison();