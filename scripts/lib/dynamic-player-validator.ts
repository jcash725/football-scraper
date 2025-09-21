// Dynamic player validator that uses touchdown history to determine teams

import { SimpleTouchdownTracker } from './simple-touchdown-tracker.js';

export interface PlayerValidation {
  name: string;
  isActive: boolean;
  status: string;
  expectedTeam?: string;
  currentTeam?: string;
  position?: string;
  reason?: string;
  replacementNeeded: boolean;
  teamChanged?: boolean;
  adjustedTDCounts?: {rushingTDs: number, receivingTDs: number, totalTDs: number} | null;
}

export class DynamicPlayerValidator {
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

  private touchdownTracker: SimpleTouchdownTracker;

  constructor() {
    this.touchdownTracker = new SimpleTouchdownTracker();
  }

  async validatePlayer(playerName: string): Promise<PlayerValidation> {
    try {
      // Get player's team from touchdown history
      const playerTeam = this.getPlayerTeamFromHistory(playerName);

      if (!playerTeam) {
        return {
          name: playerName,
          isActive: false,
          status: 'No History',
          reason: 'Player not found in touchdown history',
          replacementNeeded: true
        };
      }

      // Get team abbreviation
      const teamAbbr = this.teamAbbreviations[playerTeam];
      if (!teamAbbr) {
        return {
          name: playerName,
          isActive: false,
          status: 'Unknown Team',
          expectedTeam: playerTeam,
          reason: `Cannot find abbreviation for ${playerTeam}`,
          replacementNeeded: true
        };
      }

      // Check current roster status
      const rosterCheck = await this.checkTeamRoster(playerName, teamAbbr);

      const teamChanged = rosterCheck.currentTeam && rosterCheck.currentTeam !== playerTeam;

      return {
        name: playerName,
        isActive: rosterCheck.isActive,
        status: rosterCheck.status,
        expectedTeam: playerTeam,
        currentTeam: rosterCheck.currentTeam,
        position: rosterCheck.position,
        reason: rosterCheck.reason,
        replacementNeeded: !rosterCheck.isActive,
        teamChanged,
        adjustedTDCounts: teamChanged ? this.getPlayerTDsOnCurrentTeam(playerName, rosterCheck.currentTeam) : null
      };

    } catch (error) {
      return {
        name: playerName,
        isActive: false,
        status: 'Validation Error',
        reason: `Error: ${error.message}`,
        replacementNeeded: true
      };
    }
  }

  private getPlayerTeamFromHistory(playerName: string): string | null {
    // Load 2024 and 2025 touchdown data
    const data2024 = this.touchdownTracker.loadTouchdownDatabase(2024);
    const data2025 = this.touchdownTracker.loadTouchdownDatabase(2025);

    // Search in both years, prioritizing more recent data
    const allStats = [
      ...(data2025?.playerGameStats || []),
      ...(data2024?.playerGameStats || [])
    ];

    for (const stat of allStats) {
      if (this.namesMatch(stat.playerName, playerName)) {
        return stat.team;
      }
    }

    return null;
  }

  private namesMatch(name1: string, name2: string): boolean {
    const normalize = (name: string) => name.toLowerCase().replace(/['\.\-]/g, '').trim();
    const n1 = normalize(name1);
    const n2 = normalize(name2);

    // Exact match
    if (n1 === n2) return true;

    // Check if all parts of one name are in the other
    const parts1 = n1.split(/\s+/);
    const parts2 = n2.split(/\s+/);

    return parts1.every(part => n2.includes(part)) ||
           parts2.every(part => n1.includes(part));
  }

  private async checkTeamRoster(playerName: string, teamAbbr: string): Promise<{
    isActive: boolean;
    status: string;
    currentTeam?: string;
    position?: string;
    reason?: string;
  }> {
    try {
      const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamAbbr}/roster`;
      const response = await fetch(url);

      if (!response.ok) {
        return {
          isActive: false,
          status: 'API Error',
          reason: `Roster API failed: ${response.status}`
        };
      }

      const data = await response.json();
      const player = this.findPlayerInRoster(data, playerName);

      if (!player) {
        return {
          isActive: false,
          status: 'Not on Roster',
          reason: `Not found on ${teamAbbr.toUpperCase()} roster`
        };
      }

      const isActive = this.determineActiveStatus(player.rawStatus);

      return {
        isActive,
        status: player.status,
        currentTeam: player.team,
        position: player.position,
        reason: isActive ? undefined : `Status: ${player.status}`
      };

    } catch (error) {
      return {
        isActive: false,
        status: 'Check Failed',
        reason: `Roster check failed: ${error.message}`
      };
    }
  }

  private findPlayerInRoster(data: any, playerName: string): any {
    function search(obj: any): any {
      if (!obj || typeof obj !== 'object') return null;

      // Check if this object represents a player
      if (obj.displayName || obj.fullName || obj.name) {
        const name = obj.displayName || obj.fullName || obj.name;

        if (this.namesMatch(name, playerName)) {
          return {
            name,
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
          const result = search.call(this, item);
          if (result) return result;
        }
      } else {
        for (const value of Object.values(obj)) {
          const result = search.call(this, value);
          if (result) return result;
        }
      }

      return null;
    }

    return search.call(this, data);
  }

  private determineActiveStatus(statusObj: any): boolean {
    if (!statusObj) return true; // No status info usually means active

    const statusId = statusObj.id;
    const statusName = statusObj.name?.toLowerCase();

    // Status ID 1 = Active
    if (statusId === "1" || statusId === 1) return true;
    if (statusName === 'active') return true;

    // Known inactive statuses
    const inactiveStatuses = ['news', 'questionable', 'doubtful', 'out', 'ir', 'inactive', 'suspended'];
    if (inactiveStatuses.includes(statusName)) return false;

    // If uncertain, default to false for safety
    return false;
  }

  async validatePlayerList(playerNames: string[]): Promise<{
    activePlayers: string[],
    inactivePlayers: PlayerValidation[],
    teamChanges: PlayerValidation[],
    replacementsNeeded: number
  }> {
    console.log(`🔍 Validating ${playerNames.length} players using touchdown history...`);

    const activePlayers = [];
    const inactivePlayers = [];
    const teamChanges = [];

    for (const playerName of playerNames) {
      const validation = await this.validatePlayer(playerName);

      const statusIcon = validation.isActive ? '✅' : '❌';
      const teamInfo = validation.expectedTeam ? ` (${validation.expectedTeam})` : '';
      const reasonInfo = validation.reason ? ` - ${validation.reason}` : '';

      console.log(`${statusIcon} ${playerName}${teamInfo} - ${validation.status}${reasonInfo}`);

      if (validation.teamChanged) {
        const adjusted = validation.adjustedTDCounts;
        const adjustedInfo = adjusted ? ` (${adjusted.totalTDs} TDs on current team)` : '';
        console.log(`   🔄 Team change: ${validation.expectedTeam} → ${validation.currentTeam}${adjustedInfo}`);
        teamChanges.push(validation);
      }

      if (validation.isActive) {
        activePlayers.push(playerName);
      } else {
        inactivePlayers.push(validation);
      }

      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n📊 Validation Summary:`);
    console.log(`✅ Active: ${activePlayers.length}`);
    console.log(`❌ Inactive: ${inactivePlayers.length}`);
    console.log(`🔄 Team Changes: ${teamChanges.length}`);

    return {
      activePlayers,
      inactivePlayers,
      teamChanges,
      replacementsNeeded: inactivePlayers.length
    };
  }

  private getPlayerTDsOnCurrentTeam(playerName: string, currentTeam: string): {rushingTDs: number, receivingTDs: number, totalTDs: number} | null {
    if (!currentTeam) return null;

    // Get 2025 data to see TDs with current team
    const data2025 = this.touchdownTracker.loadTouchdownDatabase(2025);
    if (!data2025) return null;

    let rushingTDs = 0;
    let receivingTDs = 0;

    // Count TDs only when playing for current team
    for (const stat of data2025.playerGameStats) {
      if (this.namesMatch(stat.playerName, playerName) && stat.team === currentTeam) {
        rushingTDs += stat.rushingTouchdowns || 0;
        receivingTDs += stat.receivingTouchdowns || 0;
      }
    }

    return {
      rushingTDs,
      receivingTDs,
      totalTDs: rushingTDs + receivingTDs
    };
  }
}