// Dynamic player status validator for predictions

export interface PlayerValidation {
  name: string;
  isActive: boolean;
  status: string;
  team?: string;
  position?: string;
  reason?: string;
  replacementNeeded: boolean;
}

export class PlayerValidator {
  private teamAbbreviations: Record<string, string> = {
    'Arizona Cardinals': 'ari',
    'Atlanta Falcons': 'atl',
    'Baltimore Ravens': 'bal',
    'Buffalo Bills': 'buf',
    'Carolina Panthers': 'car',
    'Chicago Bears': 'chi',
    'Cincinnati Bengals': 'cin',
    'Cleveland Browns': 'cle',
    'Dallas Cowboys': 'dal',
    'Denver Broncos': 'den',
    'Detroit Lions': 'det',
    'Green Bay Packers': 'gb',
    'Houston Texans': 'hou',
    'Indianapolis Colts': 'ind',
    'Jacksonville Jaguars': 'jax',
    'Kansas City Chiefs': 'kc',
    'Las Vegas Raiders': 'lv',
    'Los Angeles Chargers': 'lac',
    'Los Angeles Rams': 'lar',
    'Miami Dolphins': 'mia',
    'Minnesota Vikings': 'min',
    'New England Patriots': 'ne',
    'New Orleans Saints': 'no',
    'New York Giants': 'nyg',
    'New York Jets': 'nyj',
    'Philadelphia Eagles': 'phi',
    'Pittsburgh Steelers': 'pit',
    'San Francisco 49ers': 'sf',
    'Seattle Seahawks': 'sea',
    'Tampa Bay Buccaneers': 'tb',
    'Tennessee Titans': 'ten',
    'Washington Commanders': 'wsh'
  };

  async validatePlayer(playerName: string, expectedTeam?: string): Promise<PlayerValidation> {
    try {
      // Get team abbreviation for API call
      const teamAbbr = expectedTeam ? this.teamAbbreviations[expectedTeam] : null;

      if (teamAbbr) {
        // Try team roster endpoint first
        const teamResult = await this.checkTeamRoster(playerName, teamAbbr);
        if (teamResult) {
          return teamResult;
        }
      }

      // Fallback to player search
      return await this.searchPlayer(playerName);

    } catch (error) {
      console.error(`Error validating ${playerName}:`, error);
      return {
        name: playerName,
        isActive: false,
        status: 'Error',
        reason: 'Failed to check status',
        replacementNeeded: true
      };
    }
  }

  private async checkTeamRoster(playerName: string, teamAbbr: string): Promise<PlayerValidation | null> {
    try {
      const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamAbbr}/roster`;
      const response = await fetch(url);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const player = this.findPlayerInData(data, playerName);

      if (player) {
        const isActive = this.determineActiveStatus(player.rawStatus);
        return {
          name: player.name,
          isActive,
          status: player.status,
          team: player.team,
          position: player.position,
          reason: isActive ? undefined : `Status: ${player.status}`,
          replacementNeeded: !isActive
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  private async searchPlayer(playerName: string): Promise<PlayerValidation> {
    try {
      const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/athletes?limit=200&search=${encodeURIComponent(playerName)}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      const player = this.findPlayerInData(data, playerName);

      if (player) {
        const isActive = this.determineActiveStatus(player.rawStatus);
        return {
          name: player.name,
          isActive,
          status: player.status,
          team: player.team,
          position: player.position,
          reason: isActive ? undefined : `Status: ${player.status}`,
          replacementNeeded: !isActive
        };
      }

      return {
        name: playerName,
        isActive: false,
        status: 'Not Found',
        reason: 'Player not found in search',
        replacementNeeded: true
      };

    } catch (error) {
      return {
        name: playerName,
        isActive: false,
        status: 'Search Error',
        reason: error.message,
        replacementNeeded: true
      };
    }
  }

  private findPlayerInData(data: any, playerName: string): any {
    const searchName = playerName.toLowerCase();
    const nameParts = searchName.split(' ');

    function search(obj: any): any {
      if (!obj || typeof obj !== 'object') return null;

      // Check if this object represents a player
      if (obj.displayName || obj.fullName || obj.name) {
        const name = (obj.displayName || obj.fullName || obj.name).toLowerCase();

        // Check if all name parts match
        const allPartsMatch = nameParts.every(part => name.includes(part));

        if (allPartsMatch) {
          return {
            name: obj.displayName || obj.fullName || obj.name,
            status: obj.status?.name || obj.status?.type || 'Unknown',
            team: obj.team?.displayName || obj.team?.name,
            position: obj.position?.abbreviation || obj.position?.name,
            rawStatus: obj.status
          };
        }
      }

      // Recursively search arrays and objects
      if (Array.isArray(obj)) {
        for (const item of obj) {
          const result = search(item);
          if (result) return result;
        }
      } else {
        for (const value of Object.values(obj)) {
          const result = search(value);
          if (result) return result;
        }
      }

      return null;
    }

    return search(data);
  }

  private determineActiveStatus(statusObj: any): boolean {
    if (!statusObj) return true; // No status info usually means active

    const statusId = statusObj.id;
    const statusName = statusObj.name?.toLowerCase();

    // Status ID 1 = Active
    if (statusId === "1" || statusId === 1) return true;

    // Known active status names
    if (statusName === 'active') return true;

    // Known inactive status IDs/names
    const inactiveStatuses = ['news', 'questionable', 'doubtful', 'out', 'ir', 'inactive', 'suspended'];
    if (inactiveStatuses.includes(statusName)) return false;

    // If uncertain, default to false for safety
    return false;
  }

  async validatePlayerList(players: Array<{name: string, team?: string}>): Promise<{
    activeePlayers: Array<{name: string, team?: string}>,
    inactivePlayers: PlayerValidation[],
    replacementsNeeded: number
  }> {
    console.log(`🔍 Validating ${players.length} players...`);

    const activePlayers = [];
    const inactivePlayers = [];

    for (const player of players) {
      const validation = await this.validatePlayer(player.name, player.team);

      console.log(`${validation.isActive ? '✅' : '❌'} ${player.name} - ${validation.status}${validation.reason ? ` (${validation.reason})` : ''}`);

      if (validation.isActive) {
        activePlayers.push(player);
      } else {
        inactivePlayers.push(validation);
      }

      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n📊 Validation Summary:`);
    console.log(`✅ Active: ${activePlayers.length}`);
    console.log(`❌ Inactive: ${inactivePlayers.length}`);

    return {
      activeePlayers: activePlayers,
      inactivePlayers,
      replacementsNeeded: inactivePlayers.length
    };
  }
}