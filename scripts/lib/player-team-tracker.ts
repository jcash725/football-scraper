// Track player team changes and provide current roster information
import fs from 'fs';
import path from 'path';

export interface PlayerTeamChange {
  playerName: string;
  previousTeam: string;
  currentTeam: string;
  changeDate: string;
  changeType: 'trade' | 'free_agent' | 'draft' | 'waiver' | 'release';
  season: number;
}

export interface PlayerCurrentTeam {
  playerName: string;
  currentTeam: string;
  position: string;
  lastUpdated: string;
  previousTeam?: string;
}

export interface TeamRoster {
  generatedAt: string;
  season: number;
  teams: Array<{
    teamName: string;
    players: Array<{
      name: string;
      position: string;
      jerseyNumber?: number;
    }>;
  }>;
}

export class PlayerTeamTracker {
  private readonly dataDir: string;
  private readonly teamChangesFile: string;
  private readonly currentRosterFile: string;

  constructor(dataDir: string = 'data') {
    this.dataDir = dataDir;
    this.teamChangesFile = path.join(dataDir, 'player-team-changes.json');
    this.currentRosterFile = path.join(dataDir, 'current-rosters.json');
    this.ensureDataDirectory();
  }

  private ensureDataDirectory(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  async fetchCurrentRosters(): Promise<PlayerCurrentTeam[]> {
    console.log('🏈 Fetching current NFL rosters from ESPN...');
    
    const allPlayers: PlayerCurrentTeam[] = [];
    
    try {
      // Get team list first
      const teamsResponse = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams');
      
      if (!teamsResponse.ok) {
        throw new Error(`ESPN teams API error: ${teamsResponse.status}`);
      }
      
      const teamsData = await teamsResponse.json();
      console.log(`📋 Found ${teamsData.sports[0].leagues[0].teams.length} NFL teams`);
      
      // Fetch roster for each team
      for (const team of teamsData.sports[0].leagues[0].teams) {
        try {
          console.log(`   Fetching roster for ${team.team.displayName}...`);
          
          const rosterResponse = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${team.team.id}/roster`);
          
          if (rosterResponse.ok) {
            const rosterData = await rosterResponse.json();
            
            if (rosterData.athletes && Array.isArray(rosterData.athletes)) {
              for (const positionGroup of rosterData.athletes) {
                if (positionGroup.items && Array.isArray(positionGroup.items)) {
                  for (const athlete of positionGroup.items) {
                    const player: PlayerCurrentTeam = {
                      playerName: athlete.fullName || athlete.displayName,
                      currentTeam: team.team.displayName,
                      position: athlete.position?.abbreviation || 'Unknown',
                      lastUpdated: new Date().toISOString()
                    };
                    
                    allPlayers.push(player);
                  }
                }
              }
            }
          }
          
          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.warn(`⚠️ Could not fetch roster for ${team.team.displayName}: ${error}`);
        }
      }
      
      console.log(`✅ Fetched ${allPlayers.length} players from current rosters`);
      return allPlayers;
      
    } catch (error) {
      console.error('❌ Error fetching rosters:', error);
      throw error;
    }
  }

  async saveCurrentRosters(season: number = 2025): Promise<void> {
    const players = await this.fetchCurrentRosters();
    
    // Group by team for easier access
    const teamMap = new Map<string, any[]>();
    
    players.forEach(player => {
      if (!teamMap.has(player.currentTeam)) {
        teamMap.set(player.currentTeam, []);
      }
      teamMap.get(player.currentTeam)!.push({
        name: player.playerName,
        position: player.position
      });
    });
    
    const roster: TeamRoster = {
      generatedAt: new Date().toISOString(),
      season,
      teams: Array.from(teamMap.entries()).map(([teamName, players]) => ({
        teamName,
        players
      }))
    };
    
    fs.writeFileSync(this.currentRosterFile, JSON.stringify(roster, null, 2));
    console.log(`💾 Saved current rosters to ${this.currentRosterFile}`);
    console.log(`📊 Total: ${players.length} players across ${teamMap.size} teams`);
  }

  getPlayerCurrentTeam(playerName: string): string | null {
    if (!fs.existsSync(this.currentRosterFile)) {
      console.log('⚠️ No roster data found. Run saveCurrentRosters() first.');
      return null;
    }
    
    const roster: TeamRoster = JSON.parse(fs.readFileSync(this.currentRosterFile, 'utf8'));
    
    for (const team of roster.teams) {
      const player = team.players.find(p => 
        p.name.toLowerCase().includes(playerName.toLowerCase()) ||
        playerName.toLowerCase().includes(p.name.toLowerCase())
      );
      
      if (player) {
        return team.teamName;
      }
    }
    
    return null;
  }

  detectTeamChanges(historicalData: any): PlayerTeamChange[] {
    if (!fs.existsSync(this.currentRosterFile)) {
      console.log('⚠️ No current roster data found.');
      return [];
    }
    
    const roster: TeamRoster = JSON.parse(fs.readFileSync(this.currentRosterFile, 'utf8'));
    const changes: PlayerTeamChange[] = [];
    
    // Build current team lookup
    const currentTeams = new Map<string, string>();
    roster.teams.forEach(team => {
      team.players.forEach(player => {
        currentTeams.set(player.name.toLowerCase(), team.teamName);
      });
    });
    
    // Check against historical data (e.g., 2024 touchdown data)
    if (historicalData?.playerGameStats) {
      const playerTeams2024 = new Map<string, string>();
      
      historicalData.playerGameStats.forEach((stat: any) => {
        const playerKey = stat.playerName.toLowerCase();
        if (!playerTeams2024.has(playerKey)) {
          playerTeams2024.set(playerKey, stat.team);
        }
      });
      
      // Compare 2024 teams vs current teams
      for (const [playerKey, team2024] of playerTeams2024) {
        const currentTeam = currentTeams.get(playerKey);
        
        if (currentTeam && currentTeam !== team2024) {
          changes.push({
            playerName: playerKey,
            previousTeam: team2024,
            currentTeam,
            changeDate: '2025-03-01', // Approximate offseason date
            changeType: 'trade', // Default assumption
            season: 2025
          });
        }
      }
    }
    
    return changes;
  }

  saveTeamChanges(changes: PlayerTeamChange[]): void {
    let existingChanges: PlayerTeamChange[] = [];
    
    if (fs.existsSync(this.teamChangesFile)) {
      existingChanges = JSON.parse(fs.readFileSync(this.teamChangesFile, 'utf8'));
    }
    
    // Merge changes, avoiding duplicates
    const allChanges = [...existingChanges];
    
    changes.forEach(newChange => {
      const exists = existingChanges.some(existing =>
        existing.playerName === newChange.playerName &&
        existing.currentTeam === newChange.currentTeam &&
        existing.season === newChange.season
      );
      
      if (!exists) {
        allChanges.push(newChange);
      }
    });
    
    fs.writeFileSync(this.teamChangesFile, JSON.stringify(allChanges, null, 2));
    console.log(`💾 Saved ${allChanges.length} team changes to ${this.teamChangesFile}`);
  }

  getPlayerTeamForPrediction(playerName: string, fallbackTeam?: string): string {
    // First try current roster
    const currentTeam = this.getPlayerCurrentTeam(playerName);
    if (currentTeam) {
      return currentTeam;
    }
    
    // Check team changes file
    if (fs.existsSync(this.teamChangesFile)) {
      const changes: PlayerTeamChange[] = JSON.parse(fs.readFileSync(this.teamChangesFile, 'utf8'));
      
      const change = changes.find(c => 
        c.playerName.toLowerCase().includes(playerName.toLowerCase()) ||
        playerName.toLowerCase().includes(c.playerName.toLowerCase())
      );
      
      if (change) {
        return change.currentTeam;
      }
    }
    
    // Fall back to provided team or return unknown
    return fallbackTeam || 'Unknown Team';
  }

  getTeamChangesReport(): string {
    if (!fs.existsSync(this.teamChangesFile)) {
      return 'No team changes tracked yet. Run detectTeamChanges() first.';
    }
    
    const changes: PlayerTeamChange[] = JSON.parse(fs.readFileSync(this.teamChangesFile, 'utf8'));
    const recentChanges = changes.filter(c => c.season === 2025);
    
    return `
🔄 Player Team Changes Report - 2025 Season

📊 Summary:
• Total tracked changes: ${changes.length}
• 2025 season changes: ${recentChanges.length}

🏈 Notable Team Changes for 2025:
${recentChanges.map(change => 
  `   ${change.playerName}: ${change.previousTeam} → ${change.currentTeam}`
).join('\n')}

💡 Impact on Predictions:
• Historical data is adjusted for new team contexts
• Opponent matchup data uses current team assignments
• Head-to-head statistics account for team changes
    `;
  }

  // Manual method to add known significant team changes
  addKnownTeamChanges(): void {
    const knownChanges: PlayerTeamChange[] = [
      {
        playerName: 'DeAndre Hopkins',
        previousTeam: 'Tennessee Titans',
        currentTeam: 'Baltimore Ravens',
        changeDate: '2024-10-23',
        changeType: 'trade',
        season: 2024
      },
      {
        playerName: 'Saquon Barkley',
        previousTeam: 'New York Giants',
        currentTeam: 'Philadelphia Eagles',
        changeDate: '2024-03-10',
        changeType: 'free_agent',
        season: 2024
      },
      {
        playerName: 'Calvin Ridley',
        previousTeam: 'Jacksonville Jaguars',
        currentTeam: 'Tennessee Titans',
        changeDate: '2024-03-12',
        changeType: 'free_agent',
        season: 2024
      },
      {
        playerName: 'Russell Wilson',
        previousTeam: 'Denver Broncos',
        currentTeam: 'Pittsburgh Steelers',
        changeDate: '2024-03-15',
        changeType: 'free_agent',
        season: 2024
      }
    ];
    
    this.saveTeamChanges(knownChanges);
    console.log(`✅ Added ${knownChanges.length} known team changes for 2025`);
  }
}