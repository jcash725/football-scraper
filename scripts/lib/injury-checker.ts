#!/usr/bin/env tsx
// Injury report checking functionality

import fs from 'fs';
import path from 'path';

export interface InjuryReport {
  playerName: string;
  team: string;
  status: 'Healthy' | 'Questionable' | 'Doubtful' | 'Out' | 'IR';
  injury: string;
  lastUpdated: string;
  practiceStatus: string[];
}

export interface InjuryDatabase {
  generatedAt: string;
  week: number;
  season: number;
  reports: InjuryReport[];
}

export class InjuryChecker {
  private dataDir = path.join(process.cwd(), 'data');
  private fileName = 'injury-report.json'; // Changed from injury-reports.json to match InjuryTracker

  constructor() {
    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  loadInjuryDatabase(): InjuryDatabase {
    const filePath = path.join(this.dataDir, this.fileName);

    if (!fs.existsSync(filePath)) {
      return {
        generatedAt: new Date().toISOString(),
        week: 0,
        season: 2025,
        reports: []
      };
    }

    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  saveInjuryDatabase(database: InjuryDatabase): void {
    const filePath = path.join(this.dataDir, this.fileName);
    database.generatedAt = new Date().toISOString();
    fs.writeFileSync(filePath, JSON.stringify(database, null, 2));
  }

  getPlayerInjuryStatus(playerName: string): InjuryReport | null {
    try {
      // Try to load from InjuryTracker format first (injury-report.json with 'players' array)
      const trackerFilePath = path.join(this.dataDir, 'injury-report.json');
      if (fs.existsSync(trackerFilePath)) {
        const trackerData = JSON.parse(fs.readFileSync(trackerFilePath, 'utf8'));
        if (trackerData.players && Array.isArray(trackerData.players)) {
          const matchingPlayers = trackerData.players.filter((p: any) =>
            p.playerName.toLowerCase().includes(playerName.toLowerCase()) ||
            playerName.toLowerCase().includes(p.playerName.toLowerCase())
          );

          if (matchingPlayers.length > 0) {
            const player = matchingPlayers[0];
            // Convert InjuryTracker format to InjuryChecker format
            return {
              playerName: player.playerName,
              team: player.team,
              status: player.injuryStatus,
              injury: player.injuryType || player.notes || 'Unknown',
              lastUpdated: player.lastUpdated,
              practiceStatus: []
            };
          }
        }
      }

      // Fall back to old format (injury-reports.json with 'reports' array)
      const database = this.loadInjuryDatabase();
      const matchingReports = database.reports.filter(report =>
        report.playerName.toLowerCase().includes(playerName.toLowerCase()) ||
        playerName.toLowerCase().includes(report.playerName.toLowerCase())
      );

      if (matchingReports.length === 0) return null;

      return matchingReports.sort((a, b) =>
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      )[0];
    } catch (error) {
      console.error(`Error loading injury status for ${playerName}:`, error);
      return null;
    }
  }

  addInjuryReports(week: number, reports: InjuryReport[]): void {
    const database = this.loadInjuryDatabase();

    // Remove existing reports for this week
    database.reports = database.reports.filter(r => r.playerName !== '');

    // Add new reports
    database.reports.push(...reports);
    database.week = week;
    database.generatedAt = new Date().toISOString();

    this.saveInjuryDatabase(database);
    console.log(`✅ Added ${reports.length} injury reports for Week ${week}`);
  }

  // Mock injury data for common players (would integrate with real injury API)
  getMockInjuryReports(week: number): InjuryReport[] {
    return [
      {
        playerName: "Christian McCaffrey",
        team: "San Francisco 49ers",
        status: "Healthy",
        injury: "None",
        lastUpdated: new Date().toISOString(),
        practiceStatus: ["Full", "Full", "Full"]
      },
      {
        playerName: "CeeDee Lamb",
        team: "Dallas Cowboys",
        status: "Out",
        injury: "Ankle",
        lastUpdated: new Date().toISOString(),
        practiceStatus: ["DNP", "DNP", "DNP"]
      },
      {
        playerName: "Travis Kelce",
        team: "Kansas City Chiefs",
        status: "Healthy",
        injury: "None",
        lastUpdated: new Date().toISOString(),
        practiceStatus: ["Full", "Full", "Full"]
      },
      {
        playerName: "Davante Adams",
        team: "Las Vegas Raiders",
        status: "Doubtful",
        injury: "Hamstring",
        lastUpdated: new Date().toISOString(),
        practiceStatus: ["DNP", "Limited", "Limited"]
      },
      {
        playerName: "Tyreek Hill",
        team: "Miami Dolphins",
        status: "Questionable",
        injury: "Hip",
        lastUpdated: new Date().toISOString(),
        practiceStatus: ["Limited", "Full", "Full"]
      },
      {
        playerName: "Josh Jacobs",
        team: "Green Bay Packers",
        status: "Healthy",
        injury: "None",
        lastUpdated: new Date().toISOString(),
        practiceStatus: ["Full", "Full", "Full"]
      },
      {
        playerName: "Mark Andrews",
        team: "Baltimore Ravens",
        status: "Questionable",
        injury: "Knee",
        lastUpdated: new Date().toISOString(),
        practiceStatus: ["DNP", "Limited", "Full"]
      },
      {
        playerName: "Davante Adams",
        team: "New York Jets",
        status: "Out",
        injury: "Trade Request",
        lastUpdated: new Date().toISOString(),
        practiceStatus: ["DNP", "DNP", "DNP"]
      },
      {
        playerName: "Cooper Kupp",
        team: "Los Angeles Rams",
        status: "Questionable",
        injury: "Ankle",
        lastUpdated: new Date().toISOString(),
        practiceStatus: ["Limited", "Limited", "Full"]
      },
      {
        playerName: "Saquon Barkley",
        team: "Philadelphia Eagles",
        status: "Healthy",
        injury: "None",
        lastUpdated: new Date().toISOString(),
        practiceStatus: ["Full", "Full", "Full"]
      }
    ];
  }

  generateInjuryReport(week: number): void {
    const database = this.loadInjuryDatabase();

    if (database.reports.length === 0) {
      console.log('❌ No injury data available. Add injury reports first.');
      return;
    }

    console.log(`🏥 Week ${week} Injury Report`);
    console.log('=' .repeat(50));

    const statusGroups = {
      'Healthy': database.reports.filter(r => r.status === 'Healthy'),
      'Questionable': database.reports.filter(r => r.status === 'Questionable'),
      'Doubtful': database.reports.filter(r => r.status === 'Doubtful'),
      'Out': database.reports.filter(r => r.status === 'Out'),
      'IR': database.reports.filter(r => r.status === 'IR')
    };

    Object.entries(statusGroups).forEach(([status, players]) => {
      if (players.length > 0) {
        console.log(`\n${getStatusEmoji(status)} ${status.toUpperCase()}:`);
        players.forEach(player => {
          console.log(`   ${player.playerName} (${player.team})`);
          if (player.injury !== 'None') {
            console.log(`     Injury: ${player.injury}`);
            console.log(`     Practice: ${player.practiceStatus.join(' → ')}`);
          }
        });
      }
    });

    console.log(`\n📊 Summary:`);
    console.log(`   Total Players: ${database.reports.length}`);
    console.log(`   Healthy: ${statusGroups.Healthy.length}`);
    console.log(`   Questionable: ${statusGroups.Questionable.length}`);
    console.log(`   Doubtful: ${statusGroups.Doubtful.length}`);
    console.log(`   Out: ${statusGroups.Out.length}`);

    console.log(`\n💡 Fantasy Impact:`);
    console.log(`   • Questionable players typically have 75%+ chance to play`);
    console.log(`   • Doubtful players have <25% chance to play`);
    console.log(`   • Monitor practice participation throughout the week`);
  }

  getInjuryRisk(playerName: string): { risk: 'Low' | 'Medium' | 'High'; reason: string } {
    const injury = this.getPlayerInjuryStatus(playerName);

    if (!injury || injury.status === 'Healthy') {
      return { risk: 'Low', reason: 'No injury designation' };
    }

    if (injury.status === 'Out' || injury.status === 'IR') {
      return { risk: 'High', reason: 'Ruled out' };
    }

    if (injury.status === 'Doubtful') {
      return { risk: 'High', reason: 'Doubtful to play (<25% chance)' };
    }

    if (injury.status === 'Questionable') {
      const practiceTrend = injury.practiceStatus;
      const latestPractice = practiceTrend[practiceTrend.length - 1];

      if (latestPractice === 'Full') {
        return { risk: 'Low', reason: 'Questionable but practiced fully Friday' };
      } else if (latestPractice === 'Limited') {
        return { risk: 'Medium', reason: 'Limited practice Friday' };
      } else {
        return { risk: 'High', reason: 'Did not practice Friday' };
      }
    }

    return { risk: 'Medium', reason: 'Unknown status' };
  }
}

function getStatusEmoji(status: string): string {
  switch (status) {
    case 'Healthy': return '✅';
    case 'Questionable': return '⚠️';
    case 'Doubtful': return '🔶';
    case 'Out': return '❌';
    case 'IR': return '🔴';
    default: return '❓';
  }
}