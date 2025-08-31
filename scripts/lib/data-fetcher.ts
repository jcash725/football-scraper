// Historical data fetching from multiple sources
import * as cheerio from 'cheerio';
import { getStatMuseTeamName } from './team-mappings.js';

export async function getPlayerTDsVsOpponent(playerName: string, team: string, opponent: string, tdType: 'rushing' | 'receiving'): Promise<string> {
  try {
    // Try multiple sources for better data coverage
    
    // Method 1: StatMuse (current approach)
    const statMuseResult = await tryStatMuse(playerName, opponent, tdType);
    if (statMuseResult !== "N/A — not verifiable") {
      return statMuseResult;
    }
    
    // Method 2: Try Pro Football Reference team matchup data
    const pfrResult = await tryProFootballReference(playerName, team, opponent, tdType);
    if (pfrResult !== "N/A — not verifiable") {
      return pfrResult;
    }
    
    return "N/A — not verifiable";
    
  } catch (error) {
    console.log(`Error fetching TD data for ${playerName} vs ${opponent}:`, error);
    return "N/A — not verifiable";
  }
}

async function tryStatMuse(playerName: string, opponent: string, tdType: 'rushing' | 'receiving'): Promise<string> {
  try {
    // Format player name for URL (replace spaces with -)
    const playerSlug = playerName.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '');
    
    const opponentSlug = getStatMuseTeamName(opponent);
    const tdTypeText = tdType === 'rushing' ? 'rushing' : 'receiving';
    
    // StatMuse URL format: /nfl/ask/{player}-{tdtype}-touchdowns-vs-{opponent}-2024
    const url = `https://www.statmuse.com/nfl/ask/${playerSlug}-${tdTypeText}-touchdowns-vs-${opponentSlug}-2024`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) {
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
    
  } catch (error) {
    return "N/A — not verifiable";
  }
}

async function tryProFootballReference(playerName: string, team: string, opponent: string, tdType: 'rushing' | 'receiving'): Promise<string> {
  try {
    // This is a simplified approach - in a real implementation, you'd need to:
    // 1. Find the player's PFR ID
    // 2. Get their game logs for 2024
    // 3. Filter for games against the specific opponent
    // 4. Sum up TDs from those games
    
    // For now, return not verifiable as this would require more complex scraping
    // But the structure is here for future enhancement
    return "N/A — not verifiable";
    
  } catch (error) {
    return "N/A — not verifiable";
  }
}