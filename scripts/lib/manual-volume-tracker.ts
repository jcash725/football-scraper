#!/usr/bin/env tsx
// Manual volume tracking for key players
// Since ESPN API doesn't provide individual player volume stats,
// we'll track the most important metrics manually for prediction accuracy

import fs from 'fs';
import path from 'path';

interface PlayerVolumeData {
  playerName: string;
  team: string;
  position: string;
  week: number;
  season: number;

  // Core volume metrics that predict TDs
  carries: number;
  targets: number;
  receptions: number;
  redZoneTargets: number;
  redZoneCarries: number;
  snapCount: number;  // or snap percentage

  // Team context
  teamPoints: number;
  teamPassingAttempts: number;
  teamRushingAttempts: number;

  // Derived metrics
  targetShare: number;  // percentage of team targets
  touchShare: number;   // percentage of team carries
  redZoneShare: number; // percentage of team red zone opportunities
}

interface VolumeDatabase {
  generatedAt: string;
  season: number;
  weeks: {
    week: number;
    players: PlayerVolumeData[];
  }[];
}

export class ManualVolumeTracker {
  private dataDir = path.join(process.cwd(), 'data');
  private fileName = 'manual-volume-data.json';

  constructor() {
    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  loadDatabase(): VolumeDatabase {
    const filePath = path.join(this.dataDir, this.fileName);

    if (!fs.existsSync(filePath)) {
      return {
        generatedAt: new Date().toISOString(),
        season: 2025,
        weeks: []
      };
    }

    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  saveDatabase(database: VolumeDatabase): void {
    const filePath = path.join(this.dataDir, this.fileName);
    database.generatedAt = new Date().toISOString();
    fs.writeFileSync(filePath, JSON.stringify(database, null, 2));
  }

  addWeeklyData(week: number, playersData: PlayerVolumeData[]): void {
    const database = this.loadDatabase();

    // Remove existing data for this week if it exists
    database.weeks = database.weeks.filter(w => w.week !== week);

    // Add new data
    database.weeks.push({
      week,
      players: playersData
    });

    // Sort weeks
    database.weeks.sort((a, b) => a.week - b.week);

    this.saveDatabase(database);
    console.log(`✅ Added volume data for ${playersData.length} players in Week ${week}`);
  }

  getPlayerVolumeHistory(playerName: string): PlayerVolumeData[] {
    const database = this.loadDatabase();
    const history: PlayerVolumeData[] = [];

    database.weeks.forEach(week => {
      const playerData = week.players.find(p =>
        p.playerName.toLowerCase().includes(playerName.toLowerCase())
      );
      if (playerData) {
        history.push(playerData);
      }
    });

    return history.sort((a, b) => a.week - b.week);
  }

  getWeeklyVolumeLeaders(week: number): {
    topTargets: PlayerVolumeData[];
    topCarries: PlayerVolumeData[];
    topRedZone: PlayerVolumeData[];
  } {
    const database = this.loadDatabase();
    const weekData = database.weeks.find(w => w.week === week);

    if (!weekData) {
      return { topTargets: [], topCarries: [], topRedZone: [] };
    }

    const players = weekData.players;

    return {
      topTargets: players
        .filter(p => p.targets > 0)
        .sort((a, b) => b.targets - a.targets)
        .slice(0, 20),
      topCarries: players
        .filter(p => p.carries > 0)
        .sort((a, b) => b.carries - a.carries)
        .slice(0, 20),
      topRedZone: players
        .filter(p => (p.redZoneTargets + p.redZoneCarries) > 0)
        .sort((a, b) => (b.redZoneTargets + b.redZoneCarries) - (a.redZoneTargets + a.redZoneCarries))
        .slice(0, 20)
    };
  }

  predictTouchdownCandidates(week: number): PlayerVolumeData[] {
    const database = this.loadDatabase();
    const weekData = database.weeks.find(w => w.week === week);

    if (!weekData) return [];

    // Score players based on volume metrics that correlate with TDs
    const scoredPlayers = weekData.players.map(player => {
      let score = 0;

      // High-volume players (primary TD predictors)
      if (player.targets >= 8) score += 3;
      else if (player.targets >= 6) score += 2;
      else if (player.targets >= 4) score += 1;

      if (player.carries >= 15) score += 3;
      else if (player.carries >= 10) score += 2;
      else if (player.carries >= 6) score += 1;

      // Red zone opportunities (strongest TD predictor)
      score += (player.redZoneTargets + player.redZoneCarries) * 2;

      // Team scoring environment
      if (player.teamPoints >= 28) score += 2;
      else if (player.teamPoints >= 21) score += 1;

      // High snap count = more opportunities
      if (player.snapCount >= 60) score += 2;
      else if (player.snapCount >= 45) score += 1;

      // Market share bonuses
      if (player.targetShare >= 0.25) score += 2;
      if (player.touchShare >= 0.6) score += 2;

      return { ...player, tdPredictionScore: score };
    });

    // Return top candidates
    return scoredPlayers
      .filter(p => p.tdPredictionScore >= 3)
      .sort((a, b) => b.tdPredictionScore - a.tdPredictionScore)
      .slice(0, 25);
  }

  generateVolumeReport(week: number): void {
    const leaders = this.getWeeklyVolumeLeaders(week);
    const candidates = this.predictTouchdownCandidates(week);

    console.log(`\n📊 Week ${week} Volume Report`);
    console.log('=' .repeat(50));

    console.log('\n🎯 Top Target Leaders:');
    leaders.topTargets.slice(0, 10).forEach((player, i) => {
      console.log(`   ${i + 1}. ${player.playerName} (${player.team}): ${player.targets} targets`);
    });

    console.log('\n🏃 Top Carry Leaders:');
    leaders.topCarries.slice(0, 10).forEach((player, i) => {
      console.log(`   ${i + 1}. ${player.playerName} (${player.team}): ${player.carries} carries`);
    });

    console.log('\n🔴 Top Red Zone Opportunities:');
    leaders.topRedZone.slice(0, 10).forEach((player, i) => {
      const total = player.redZoneTargets + player.redZoneCarries;
      console.log(`   ${i + 1}. ${player.playerName} (${player.team}): ${total} red zone touches`);
    });

    console.log('\n🏆 Top TD Candidates (by volume score):');
    candidates.slice(0, 15).forEach((player, i) => {
      console.log(`   ${i + 1}. ${player.playerName} (${player.team}): Score ${player.tdPredictionScore}`);
    });
  }
}