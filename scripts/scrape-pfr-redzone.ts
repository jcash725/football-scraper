#!/usr/bin/env tsx
// Scrape Pro Football Reference red zone data

interface RedZoneData {
  playerName: string;
  team: string;
  redZoneTargets?: number;
  redZoneCarries?: number;
}

export async function scrapeRedZoneData(): Promise<RedZoneData[]> {
  console.log('🔴 Using Pro Football Reference red zone data...\n');

  // For now, use the data I extracted from WebFetch
  // TODO: Implement proper scraping once we can parse PFR tables
  const redZoneData: RedZoneData[] = [
    // Red zone receiving leaders
    { playerName: "Davante Adams", team: "LAR", redZoneTargets: 8 },
    { playerName: "Amon-Ra St. Brown", team: "DET", redZoneTargets: 8 },
    { playerName: "George Pickens", team: "DAL", redZoneTargets: 7 },
    { playerName: "Christian McCaffrey", team: "SFO", redZoneTargets: 6 },
    { playerName: "Hunter Renfrow", team: "CAR", redZoneTargets: 6 },
    { playerName: "Trey McBride", team: "ARI", redZoneTargets: 5 },
    { playerName: "Jake Ferguson", team: "DAL", redZoneTargets: 5 },
    { playerName: "Travis Kelce", team: "KAN", redZoneTargets: 5 },
    { playerName: "Mark Andrews", team: "BAL", redZoneTargets: 4 },
    { playerName: "CeeDee Lamb", team: "DAL", redZoneTargets: 4 },

    // Red zone rushing leaders
    { playerName: "Jonathan Taylor", team: "IND", redZoneCarries: 16 },
    { playerName: "Jahmyr Gibbs", team: "DET", redZoneCarries: 15 },
    { playerName: "Christian McCaffrey", team: "SFO", redZoneCarries: 13 },
    { playerName: "James Cook", team: "BUF", redZoneCarries: 12 },
    { playerName: "Josh Jacobs", team: "GNB", redZoneCarries: 12 },
    { playerName: "Jaylen Warren", team: "PIT", redZoneCarries: 12 },
    { playerName: "Saquon Barkley", team: "PHI", redZoneCarries: 11 },
    { playerName: "Zach Charbonnet", team: "SEA", redZoneCarries: 10 },
    { playerName: "Travis Etienne", team: "JAX", redZoneCarries: 10 },
    { playerName: "Jalen Hurts", team: "PHI", redZoneCarries: 10 },
    { playerName: "Derrick Henry", team: "BAL", redZoneCarries: 9 },
    { playerName: "Kenneth Walker III", team: "SEA", redZoneCarries: 8 },
    { playerName: "De'Von Achane", team: "MIA", redZoneCarries: 7 }
  ];

  // Merge players with both targets and carries
  const playerMap = new Map<string, RedZoneData>();

  redZoneData.forEach(player => {
    const key = player.playerName.toLowerCase();
    const existing = playerMap.get(key);

    if (existing) {
      // Merge data
      if (player.redZoneTargets) existing.redZoneTargets = player.redZoneTargets;
      if (player.redZoneCarries) existing.redZoneCarries = player.redZoneCarries;
    } else {
      playerMap.set(key, { ...player });
    }
  });

  const finalData = Array.from(playerMap.values());
  console.log(`✅ Loaded ${finalData.length} players with red zone data`);

  return finalData;
}

function parseRedZoneReceiving(html: string): RedZoneData[] {
  const players: RedZoneData[] = [];

  // Look for table rows with player data
  const patterns = [
    // Standard PFR table format
    /<tr[^>]*>[\s\S]*?<td[^>]*data-stat="player"[^>]*><a[^>]*>([^<]+)<\/a>[\s\S]*?<td[^>]*data-stat="team"[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*data-stat="targets"[^>]*>(\d+)<\/td>/g,
    // Alternative format
    /<td[^>]*><a[^>]*>([^<]+)<\/a><\/td>[\s\S]*?<td[^>]*>([A-Z]{3})<\/td>[\s\S]*?<td[^>]*>(\d+)<\/td>/g
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null && players.length < 50) {
      const [, name, team, targets] = match;
      const targetNum = parseInt(targets);

      if (name && team && targetNum > 0) {
        players.push({
          playerName: name.trim(),
          team: team.trim(),
          redZoneTargets: targetNum
        });
      }
    }
    if (players.length > 10) break;
  }

  return players;
}

function parseRedZoneRushing(html: string): RedZoneData[] {
  const players: RedZoneData[] = [];

  // Look for table rows with player data
  const patterns = [
    // Standard PFR table format
    /<tr[^>]*>[\s\S]*?<td[^>]*data-stat="player"[^>]*><a[^>]*>([^<]+)<\/a>[\s\S]*?<td[^>]*data-stat="team"[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*data-stat="rush_att"[^>]*>(\d+)<\/td>/g,
    // Alternative format
    /<td[^>]*><a[^>]*>([^<]+)<\/a><\/td>[\s\S]*?<td[^>]*>([A-Z]{3})<\/td>[\s\S]*?<td[^>]*>(\d+)<\/td>/g
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null && players.length < 50) {
      const [, name, team, carries] = match;
      const carryNum = parseInt(carries);

      if (name && team && carryNum > 0) {
        players.push({
          playerName: name.trim(),
          team: team.trim(),
          redZoneCarries: carryNum
        });
      }
    }
    if (players.length > 10) break;
  }

  return players;
}

async function main() {
  const redZoneData = await scrapeRedZoneData();

  console.log('\n🏆 Top Red Zone Players:');

  // Show top receiving targets
  const topTargets = redZoneData
    .filter(p => p.redZoneTargets && p.redZoneTargets > 0)
    .sort((a, b) => (b.redZoneTargets || 0) - (a.redZoneTargets || 0))
    .slice(0, 10);

  console.log('\n🎯 Red Zone Targets:');
  topTargets.forEach((player, i) => {
    console.log(`   ${i + 1}. ${player.playerName} (${player.team}): ${player.redZoneTargets} targets`);
  });

  // Show top carries
  const topCarries = redZoneData
    .filter(p => p.redZoneCarries && p.redZoneCarries > 0)
    .sort((a, b) => (b.redZoneCarries || 0) - (a.redZoneCarries || 0))
    .slice(0, 10);

  console.log('\n🏃 Red Zone Carries:');
  topCarries.forEach((player, i) => {
    console.log(`   ${i + 1}. ${player.playerName} (${player.team}): ${player.redZoneCarries} carries`);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}