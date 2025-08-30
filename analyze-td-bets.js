import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Team name mapping from full names to short names
const TEAM_NAME_MAP = {
    "Philadelphia Eagles": "Philadelphia",
    "Dallas Cowboys": "Dallas",
    "Kansas City Chiefs": "Kansas City",
    "Los Angeles Chargers": "LA Chargers",
    "Washington Commanders": "Washington",
    "New York Giants": "NY Giants",
    "Pittsburgh Steelers": "Pittsburgh",
    "New York Jets": "NY Jets",
    "New Orleans Saints": "New Orleans",
    "Arizona Cardinals": "Arizona",
    "New England Patriots": "New England",
    "Las Vegas Raiders": "Las Vegas",
    "Jacksonville Jaguars": "Jacksonville",
    "Miami Dolphins": "Miami",
    "Indianapolis Colts": "Indianapolis",
    "Cincinnati Bengals": "Cincinnati",
    "Cleveland Browns": "Cleveland",
    "Tampa Bay Buccaneers": "Tampa Bay",
    "Atlanta Falcons": "Atlanta",
    "San Francisco 49ers": "San Francisco",
    "Seattle Seahawks": "Seattle",
    "Tennessee Titans": "Tennessee",
    "Denver Broncos": "Denver",
    "Detroit Lions": "Detroit",
    "Green Bay Packers": "Green Bay",
    "Houston Texans": "Houston",
    "Los Angeles Rams": "LA Rams",
    "Baltimore Ravens": "Baltimore",
    "Buffalo Bills": "Buffalo",
    "Minnesota Vikings": "Minnesota",
    "Chicago Bears": "Chicago",
    "Carolina Panthers": "Carolina"
};
function getShortTeamName(fullName) {
    return TEAM_NAME_MAP[fullName] || fullName;
}
// StatMuse team name mapping for URLs
const STATMUSE_TEAM_MAP = {
    "Philadelphia": "eagles",
    "Dallas": "cowboys",
    "Kansas City": "chiefs",
    "LA Chargers": "chargers",
    "Washington": "commanders",
    "NY Giants": "giants",
    "Pittsburgh": "steelers",
    "NY Jets": "jets",
    "New Orleans": "saints",
    "Arizona": "cardinals",
    "New England": "patriots",
    "Las Vegas": "raiders",
    "Jacksonville": "jaguars",
    "Miami": "dolphins",
    "Indianapolis": "colts",
    "Cincinnati": "bengals",
    "Cleveland": "browns",
    "Tampa Bay": "buccaneers",
    "Atlanta": "falcons",
    "San Francisco": "49ers",
    "Seattle": "seahawks",
    "Tennessee": "titans",
    "Denver": "broncos",
    "Detroit": "lions",
    "Green Bay": "packers",
    "Houston": "texans",
    "LA Rams": "rams",
    "Baltimore": "ravens",
    "Buffalo": "bills",
    "Minnesota": "vikings",
    "Chicago": "bears",
    "Carolina": "panthers"
};
function getStatMuseTeamName(shortName) {
    return STATMUSE_TEAM_MAP[shortName] || shortName.toLowerCase();
}
async function getPlayerTDsVsOpponent(playerName, team, opponent, tdType) {
    try {
        // Format player name for URL (replace spaces with -)
        const playerSlug = playerName.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9\-]/g, '');
        const opponentSlug = getStatMuseTeamName(opponent);
        const tdTypeText = tdType === 'rushing' ? 'rushing' : 'receiving';
        // StatMuse URL format: /nfl/ask/{player}-{tdtype}-touchdowns-vs-{opponent}-2024
        const url = `https://www.statmuse.com/nfl/ask/${playerSlug}-${tdTypeText}-touchdowns-vs-${opponentSlug}-2024`;
        console.log(`Checking ${playerName} ${tdTypeText} TDs vs ${opponent}: ${url}`);
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        if (!response.ok) {
            console.log(`Failed to fetch ${url}: ${response.status}`);
            return "N/A — not verifiable";
        }
        const html = await response.text();
        const $ = cheerio.load(html);
        // Look for TD stats in various StatMuse formats
        const text = $('body').text().toLowerCase();
        // Look for patterns like "2 rushing touchdowns", "0 touchdowns", etc.
        const tdMatches = text.match(new RegExp(`(\\d+)\\s+${tdTypeText}\\s+touchdowns?`, 'i')) ||
            text.match(/(\d+)\s+touchdowns?/i) ||
            text.match(/scored\s+(\d+)/i);
        if (tdMatches) {
            const tdCount = parseInt(tdMatches[1]);
            return tdCount.toString();
        }
        // If we can't parse specific data but page loaded, check for "no games" or "0"
        if (text.includes('no games') || text.includes('did not play') || text.includes('0 touchdowns')) {
            return "0";
        }
        return "N/A — not verifiable";
    }
    catch (error) {
        console.log(`Error fetching TD data for ${playerName} vs ${opponent}:`, error);
        return "N/A — not verifiable";
    }
}
function loadData() {
    const dataDir = path.join(process.cwd(), 'data');
    const rushingPlayers = JSON.parse(fs.readFileSync(path.join(dataDir, 'rushing-touchdowns-players.json'), 'utf8')).rows;
    const receivingPlayers = JSON.parse(fs.readFileSync(path.join(dataDir, 'receiving-touchdowns-players.json'), 'utf8')).rows;
    const opponentRushTDs = JSON.parse(fs.readFileSync(path.join(dataDir, 'opponent-rushing-tds.json'), 'utf8')).rows;
    const opponentPassTDs = JSON.parse(fs.readFileSync(path.join(dataDir, 'opponent-passing-tds.json'), 'utf8')).rows;
    const matchups = JSON.parse(fs.readFileSync(path.join(dataDir, 'weekly-matchups.json'), 'utf8')).rows;
    return {
        rushingPlayers,
        receivingPlayers,
        opponentRushTDs,
        opponentPassTDs,
        matchups
    };
}
function getOpponent(team, matchups) {
    for (const matchup of matchups) {
        if (matchup.home_team === team) {
            return matchup.away_team;
        }
        if (matchup.away_team === team) {
            return matchup.home_team;
        }
    }
    return null;
}
function getOpponentStat(opponent, stats) {
    const stat = stats.find(s => s.Team === opponent);
    return stat ? stat["2024"] : 0;
}
function generateBasicRecommendations(rushingPlayers, receivingPlayers, opponentRushTDs, opponentPassTDs, matchups) {
    const recommendations = [];
    // Add rusher recommendations
    const eligibleRushers = rushingPlayers.filter(p => p.Value >= 1);
    for (const player of eligibleRushers) {
        const shortTeamName = getShortTeamName(player.Team);
        const opponent = getOpponent(shortTeamName, matchups);
        if (!opponent)
            continue;
        const opponentStatValue = getOpponentStat(opponent, opponentRushTDs);
        recommendations.push({
            Player: player.Player,
            Team: shortTeamName,
            Opponent: opponent,
            Basis: "Opp Rush TD/G",
            "Opponent Stat Value": opponentStatValue,
            "Player TDs YTD": player.Value,
            "TDs vs Opponent Last Year (2024)": "N/A — not verifiable",
            Reason: `${shortTeamName} vs ${opponent} - opponent allows ${opponentStatValue} rush TDs/game`
        });
    }
    // Add receiver recommendations  
    const eligibleReceivers = receivingPlayers.filter(p => p.Value >= 1);
    for (const player of eligibleReceivers) {
        const shortTeamName = getShortTeamName(player.Team);
        const opponent = getOpponent(shortTeamName, matchups);
        if (!opponent)
            continue;
        const opponentStatValue = getOpponentStat(opponent, opponentPassTDs);
        recommendations.push({
            Player: player.Player,
            Team: shortTeamName,
            Opponent: opponent,
            Basis: "Opp Pass TD/G",
            "Opponent Stat Value": opponentStatValue,
            "Player TDs YTD": player.Value,
            "TDs vs Opponent Last Year (2024)": "N/A — not verifiable",
            Reason: `${shortTeamName} vs ${opponent} - opponent allows ${opponentStatValue} pass TDs/game`
        });
    }
    return recommendations;
}
async function generateTop20List() {
    const data = loadData();
    console.log("Generating initial recommendations...");
    const allRecs = generateBasicRecommendations(data.rushingPlayers, data.receivingPlayers, data.opponentRushTDs, data.opponentPassTDs, data.matchups);
    // Sort by opponent stat value (descending), then by player TDs (descending)
    allRecs.sort((a, b) => {
        if (b["Opponent Stat Value"] !== a["Opponent Stat Value"]) {
            return b["Opponent Stat Value"] - a["Opponent Stat Value"];
        }
        return b["Player TDs YTD"] - a["Player TDs YTD"];
    });
    // Get top 20
    const top20 = allRecs.slice(0, 20);
    console.log("Looking up historical TD data for top 20 players...");
    // Now add historical data for just these 20 players
    for (const rec of top20) {
        const tdType = rec.Basis.includes("Rush") ? "rushing" : "receiving";
        console.log(`Checking ${rec.Player} ${tdType} TDs vs ${rec.Opponent}...`);
        const historicalTDs = await getPlayerTDsVsOpponent(rec.Player, rec.Team, rec.Opponent, tdType);
        rec["TDs vs Opponent Last Year (2024)"] = historicalTDs;
    }
    return top20;
}
function formatAsTable(recommendations) {
    let output = "# 🏈 Top 20 TD Bet Recommendations\n\n";
    // Add a summary section
    const rushingCount = recommendations.filter(r => r.Basis.includes("Rush")).length;
    const receivingCount = recommendations.filter(r => r.Basis.includes("Pass")).length;
    output += `## Summary\n`;
    output += `- **${rushingCount}** Rushing TD opportunities\n`;
    output += `- **${receivingCount}** Receiving TD opportunities\n`;
    output += `- Based on opponent defensive weaknesses and player performance\n\n`;
    output += "---\n\n";
    recommendations.forEach((rec, index) => {
        const rank = `**#${index + 1}**`;
        const player = `**${rec.Player}**`;
        const matchup = `${rec.Team} @ ${rec.Opponent}`;
        const tdType = rec.Basis.includes("Rush") ? "🏃 Rushing" : "🎯 Receiving";
        const oppStat = `${rec["Opponent Stat Value"]} TDs/game`;
        const playerTDs = `${rec["Player TDs YTD"]} TDs YTD`;
        const historical = rec["TDs vs Opponent Last Year (2024)"];
        const historicalFormatted = historical === "N/A — not verifiable" ?
            "❓ *Not verifiable*" :
            historical === "0" ? "0️⃣ None" : `🎯 **${historical} TDs**`;
        output += `### ${rank} ${player}\n`;
        output += `**Matchup:** ${matchup}  \n`;
        output += `**Type:** ${tdType}  \n`;
        output += `**Opponent allows:** ${oppStat}  \n`;
        output += `**Player season:** ${playerTDs}  \n`;
        output += `**2024 vs opponent:** ${historicalFormatted}  \n`;
        output += `**Analysis:** ${rec.Reason}\n\n`;
    });
    output += "---\n\n";
    output += "🤖 *Generated with [Claude Code](https://claude.ai/code)*\n\n";
    output += `📅 *Last updated: ${new Date().toLocaleString()}*\n`;
    return output;
}
async function main() {
    try {
        console.log("Generating Top 20 TD Bet Recommendations...");
        const top20 = await generateTop20List();
        console.log(`Generated ${top20.length} recommendations`);
        // Save as JSON
        const outputDir = path.join(process.cwd(), 'data');
        fs.writeFileSync(path.join(outputDir, 'td-bet-recommendations.json'), JSON.stringify({
            generatedAt: new Date().toISOString(),
            instructions: "🔒 Updated Instructions for TD Bets GPT",
            count: top20.length,
            recommendations: top20
        }, null, 2));
        // Save as Markdown table
        const tableOutput = formatAsTable(top20);
        fs.writeFileSync(path.join(outputDir, 'td-bet-recommendations.md'), tableOutput);
        console.log("✅ Top 20 TD recommendations saved to:");
        console.log("  - data/td-bet-recommendations.json");
        console.log("  - data/td-bet-recommendations.md");
        // Also output to console for GitHub Actions
        console.log("\n" + tableOutput);
    }
    catch (error) {
        console.error("Error generating recommendations:", error);
        process.exit(1);
    }
}
// Run main function if this script is executed directly
main();
