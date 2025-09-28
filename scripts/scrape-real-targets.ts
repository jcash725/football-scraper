#!/usr/bin/env tsx
// Scrape real 2025 targets data from TeamRankings

async function scrapeTargetsData() {
  console.log('🔄 Scraping real 2025 receiving targets data...\n');

  try {
    const response = await fetch('https://www.teamrankings.com/nfl/player-stat/receiving-targeted');
    const html = await response.text();

    console.log('📄 Fetched HTML, parsing for target data...');

    // Extract data from HTML using regex patterns
    const players: { name: string; team: string; targets: number }[] = [];

    // Look for table rows or data patterns
    const tableRowPattern = /<tr[^>]*>.*?<\/tr>/gs;
    const rows = html.match(tableRowPattern) || [];

    console.log(`Found ${rows.length} potential table rows`);

    for (const row of rows) {
      // Look for player data pattern: name, targets, team
      const cellPattern = /<td[^>]*>(.*?)<\/td>/g;
      const cells = [];
      let match;

      while ((match = cellPattern.exec(row)) !== null) {
        cells.push(match[1].replace(/<[^>]*>/g, '').trim());
      }

      if (cells.length >= 3) {
        const playerName = cells[0];
        const targets = parseInt(cells[1]);
        const team = cells[2];

        if (playerName && !isNaN(targets) && team && targets > 10) {
          players.push({ name: playerName, team, targets });
        }
      }
    }

    // If table parsing didn't work, try different patterns
    if (players.length === 0) {
      console.log('🔍 Trying alternative data extraction...');

      // Look for JSON data or other patterns
      const jsonPattern = /"data":\s*\[(.*?)\]/s;
      const jsonMatch = html.match(jsonPattern);

      if (jsonMatch) {
        console.log('Found potential JSON data');
        // Parse JSON data if found
      }

      // Look for player name patterns
      const playerPattern = /([A-Z][a-z]+ [A-Z][a-z]+)\s+(\d+)\s+([A-Z]{2,3})/g;
      let playerMatch;

      while ((playerMatch = playerPattern.exec(html)) !== null) {
        const [, name, targets, team] = playerMatch;
        const targetNum = parseInt(targets);

        if (targetNum > 10) {
          players.push({ name, team, targets: targetNum });
        }
      }
    }

    console.log(`✅ Extracted ${players.length} players with target data`);

    if (players.length > 0) {
      console.log('\n📊 Top Target Leaders:');
      players.slice(0, 15).forEach((player, i) => {
        console.log(`   ${i + 1}. ${player.name} (${player.team}): ${player.targets} targets`);
      });
    } else {
      console.log('❌ No player data extracted. Website may use dynamic loading.');
    }

    return players;

  } catch (error) {
    console.error('❌ Error scraping data:', error);
    return [];
  }
}

scrapeTargetsData().catch(console.error);