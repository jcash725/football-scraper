// Track player injury status for more accurate touchdown predictions
import fs from 'fs';
import path from 'path';

export interface PlayerInjuryStatus {
  playerName: string;
  team: string;
  position: string;
  injuryStatus: 'Active' | 'Questionable' | 'Doubtful' | 'Out' | 'IR' | 'Inactive';
  injuryType?: string;
  notes?: string;
  lastUpdated: string;
  impactLevel: 'None' | 'Low' | 'Medium' | 'High'; // Impact on TD probability
}

export interface InjuryReport {
  generatedAt: string;
  season: number;
  week: number;
  players: PlayerInjuryStatus[];
}

export class InjuryTracker {
  private readonly dataDir: string;
  private readonly injuryFile: string;

  constructor(dataDir: string = 'data') {
    this.dataDir = dataDir;
    this.injuryFile = path.join(dataDir, 'injury-report.json');
    this.ensureDataDirectory();
  }

  private ensureDataDirectory(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  async fetchCurrentInjuries(): Promise<PlayerInjuryStatus[]> {
    console.log('🏥 Fetching current NFL injury report from ESPN...');
    
    try {
      const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/injuries');
      
      if (!response.ok) {
        throw new Error(`ESPN API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`📋 Found injury data for ${data.injuries?.length || 0} teams`);
      
      const allPlayers: PlayerInjuryStatus[] = [];
      
      if (data.injuries && Array.isArray(data.injuries)) {
        for (const teamData of data.injuries) {
          if (teamData.injuries && Array.isArray(teamData.injuries)) {
            for (const injuryRecord of teamData.injuries) {
              const athlete = injuryRecord.athlete;
              if (athlete) {
                const player: PlayerInjuryStatus = {
                  playerName: athlete.displayName || athlete.fullName || 'Unknown',
                  team: teamData.displayName || 'Unknown',
                  position: athlete.position?.abbreviation || 'Unknown',
                  injuryStatus: this.parseInjuryStatus(injuryRecord.status),
                  injuryType: this.extractInjuryType(injuryRecord.shortComment || injuryRecord.longComment),
                  notes: injuryRecord.shortComment || '',
                  lastUpdated: injuryRecord.date || new Date().toISOString(),
                  impactLevel: this.calculateImpactLevel(
                    injuryRecord.status, 
                    athlete.position?.abbreviation, 
                    injuryRecord.shortComment || injuryRecord.longComment
                  )
                };
                
                allPlayers.push(player);
              }
            }
          }
        }
      }
      
      console.log(`✅ Processed ${allPlayers.length} player injury statuses`);
      return allPlayers;
      
    } catch (error) {
      console.error('❌ Error fetching injury data:', error);
      throw error;
    }
  }

  private parseInjuryStatus(status: string): PlayerInjuryStatus['injuryStatus'] {
    if (!status) return 'Active';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('questionable')) return 'Questionable';
    if (statusLower.includes('doubtful')) return 'Doubtful';
    if (statusLower.includes('out')) return 'Out';
    if (statusLower.includes('ir') || statusLower.includes('injured reserve')) return 'IR';
    if (statusLower.includes('inactive')) return 'Inactive';
    
    return 'Active';
  }

  private extractInjuryType(note: string): string | undefined {
    if (!note) return undefined;
    
    const injuryTypes = [
      'knee', 'ankle', 'shoulder', 'hamstring', 'quad', 'calf', 'back', 'neck',
      'concussion', 'hand', 'wrist', 'finger', 'toe', 'foot', 'hip', 'groin',
      'chest', 'rib', 'elbow', 'acl', 'mcl', 'achilles', 'covid'
    ];
    
    const noteLower = note.toLowerCase();
    for (const type of injuryTypes) {
      if (noteLower.includes(type)) {
        return type.charAt(0).toUpperCase() + type.slice(1);
      }
    }
    
    return undefined;
  }

  private calculateImpactLevel(
    status: string, 
    position: string, 
    note: string
  ): PlayerInjuryStatus['impactLevel'] {
    const statusLower = status?.toLowerCase() || '';
    const noteLower = note?.toLowerCase() || '';
    const skillPositions = ['qb', 'rb', 'wr', 'te'];
    const isSkillPosition = skillPositions.includes(position?.toLowerCase() || '');
    
    // High impact scenarios - players who can't play
    if (statusLower.includes('out') || statusLower.includes('ir') || statusLower.includes('inactive')) {
      return 'High';
    }
    
    // High impact for skill position players with serious injuries
    const seriousInjuries = ['acl', 'concussion', 'achilles'];
    if (isSkillPosition && seriousInjuries.some(injury => noteLower.includes(injury))) {
      return 'High';
    }
    
    // Medium impact for skill positions with questionable/doubtful status
    if (isSkillPosition && (statusLower.includes('questionable') || statusLower.includes('doubtful'))) {
      return 'Medium';
    }
    
    // Medium impact for moderate injuries on skill positions
    const moderateInjuries = ['knee', 'shoulder', 'hamstring', 'quad', 'back'];
    if (isSkillPosition && moderateInjuries.some(injury => noteLower.includes(injury))) {
      return statusLower.includes('questionable') ? 'Medium' : 'Low';
    }
    
    // Low impact for minor issues
    if (statusLower.includes('questionable') && 
        ['ankle', 'toe', 'finger', 'wrist', 'foot'].some(minor => noteLower.includes(minor))) {
      return 'Low';
    }
    
    return 'None';
  }

  async saveInjuryReport(week: number, season: number = 2025): Promise<void> {
    const injuries = await this.fetchCurrentInjuries();

    // Merge with manual IR list
    const manualIRFile = path.join(this.dataDir, 'manual-ir-list.json');
    if (fs.existsSync(manualIRFile)) {
      try {
        const manualIR = JSON.parse(fs.readFileSync(manualIRFile, 'utf8'));
        if (manualIR.players && Array.isArray(manualIR.players)) {
          for (const irPlayer of manualIR.players) {
            // Check if player already exists in ESPN data
            const existing = injuries.find(p =>
              p.playerName.toLowerCase() === irPlayer.playerName.toLowerCase() &&
              p.team.toLowerCase().includes(irPlayer.team.toLowerCase().split(' ').pop())
            );

            if (!existing) {
              // Add manual IR player to the list
              injuries.push({
                playerName: irPlayer.playerName,
                team: irPlayer.team,
                position: irPlayer.position,
                injuryStatus: 'IR',
                notes: irPlayer.reason || 'Manually added to IR list',
                lastUpdated: manualIR.lastUpdated || new Date().toISOString(),
                impactLevel: 'High'
              });
            } else if (existing.injuryStatus !== 'IR') {
              // Update existing player to IR status
              existing.injuryStatus = 'IR';
              existing.impactLevel = 'High';
              existing.notes = `${existing.notes || ''} | ${irPlayer.reason || 'On IR'}`.trim();
            }
          }
          console.log(`✅ Merged ${manualIR.players.length} manual IR entries`);
        }
      } catch (error) {
        console.warn('⚠️ Could not load manual IR list:', error);
      }
    }

    const report: InjuryReport = {
      generatedAt: new Date().toISOString(),
      season,
      week,
      players: injuries
    };

    fs.writeFileSync(this.injuryFile, JSON.stringify(report, null, 2));
    console.log(`💾 Saved injury report to ${this.injuryFile}`);
    console.log(`📊 Summary: ${injuries.filter(p => p.injuryStatus !== 'Active').length} players with injury concerns`);
  }

  getPlayerInjuryStatus(playerName: string, teamName?: string): PlayerInjuryStatus | null {
    if (!fs.existsSync(this.injuryFile)) {
      console.log('⚠️ No injury report found. Run saveInjuryReport() first.');
      return null;
    }
    
    const report: InjuryReport = JSON.parse(fs.readFileSync(this.injuryFile, 'utf8'));
    
    return report.players.find(player => {
      const nameMatch = player.playerName.toLowerCase().includes(playerName.toLowerCase()) ||
                       playerName.toLowerCase().includes(player.playerName.toLowerCase());
      const teamMatch = !teamName || player.team.toLowerCase().includes(teamName.toLowerCase());
      
      return nameMatch && teamMatch;
    }) || null;
  }

  getInjuryAdjustmentFactor(playerName: string, teamName?: string): number {
    const injury = this.getPlayerInjuryStatus(playerName, teamName);
    
    if (!injury || injury.injuryStatus === 'Active') {
      return 1.0; // No adjustment
    }
    
    // Adjustment factors based on injury impact
    switch (injury.impactLevel) {
      case 'High':
        return injury.injuryStatus === 'Out' || injury.injuryStatus === 'IR' ? 0.0 : 0.3;
      case 'Medium':
        return 0.6;
      case 'Low':
        return 0.85;
      default:
        return 1.0;
    }
  }

  async validatePlayerRecommendation(playerName: string, expectedTeam?: string): Promise<{
    isValid: boolean;
    currentTeam?: string;
    injuryStatus?: string;
    injuryType?: string;
    impactLevel?: string;
    warning?: string;
  }> {
    console.log(`🔍 Validating player recommendation: ${playerName}${expectedTeam ? ` (${expectedTeam})` : ''}`);

    try {
      const currentInjuries = await this.fetchCurrentInjuries();
      const playerRecord = currentInjuries.find(player => {
        const nameMatch = player.playerName.toLowerCase().includes(playerName.toLowerCase()) ||
                         playerName.toLowerCase().includes(player.playerName.toLowerCase());
        return nameMatch;
      });

      if (!playerRecord) {
        return {
          isValid: true,
          warning: `Player not found in injury report - likely healthy and active`
        };
      }

      const teamMismatch = expectedTeam &&
        !playerRecord.team.toLowerCase().includes(expectedTeam.toLowerCase()) &&
        !expectedTeam.toLowerCase().includes(playerRecord.team.toLowerCase());

      const hasInjuryConcern = playerRecord.injuryStatus !== 'Active';
      const isHighImpact = playerRecord.impactLevel === 'High';

      let warning = '';
      if (teamMismatch) {
        warning += `Team mismatch: Expected ${expectedTeam}, found on ${playerRecord.team}. `;
      }
      if (hasInjuryConcern) {
        warning += `Injury concern: ${playerRecord.injuryStatus}${playerRecord.injuryType ? ` (${playerRecord.injuryType})` : ''}. `;
      }

      return {
        isValid: !isHighImpact && !teamMismatch,
        currentTeam: playerRecord.team,
        injuryStatus: playerRecord.injuryStatus,
        injuryType: playerRecord.injuryType,
        impactLevel: playerRecord.impactLevel,
        warning: warning.trim() || undefined
      };

    } catch (error) {
      console.error('❌ Error validating player:', error);
      return {
        isValid: false,
        warning: 'Unable to verify player status due to API error'
      };
    }
  }

  getInjuryReport(): string {
    if (!fs.existsSync(this.injuryFile)) {
      return 'No injury report available. Run saveInjuryReport() first.';
    }

    const report: InjuryReport = JSON.parse(fs.readFileSync(this.injuryFile, 'utf8'));
    const injured = report.players.filter(p => p.injuryStatus !== 'Active');
    const skillPositions = injured.filter(p => ['QB', 'RB', 'WR', 'TE'].includes(p.position));

    return `
🏥 Injury Report - Week ${report.week} ${report.season}
Generated: ${new Date(report.generatedAt).toLocaleString()}

📊 Summary:
• Total players monitored: ${report.players.length}
• Players with injury concerns: ${injured.length}
• Skill position players affected: ${skillPositions.length}

🚨 High Impact Injuries:
${injured.filter(p => p.impactLevel === 'High').map(p =>
  `   ${p.playerName} (${p.team} ${p.position}) - ${p.injuryStatus}${p.injuryType ? ` (${p.injuryType})` : ''}`
).join('\n')}

⚠️ Medium Impact Injuries:
${injured.filter(p => p.impactLevel === 'Medium').map(p =>
  `   ${p.playerName} (${p.team} ${p.position}) - ${p.injuryStatus}${p.injuryType ? ` (${p.injuryType})` : ''}`
).join('\n')}

💡 Low Impact Injuries:
${injured.filter(p => p.impactLevel === 'Low').map(p =>
  `   ${p.playerName} (${p.team} ${p.position}) - ${p.injuryStatus}${p.injuryType ? ` (${p.injuryType})` : ''}`
).join('\n')}
    `;
  }
}