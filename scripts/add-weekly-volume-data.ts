#!/usr/bin/env tsx
// Add weekly volume data for key players
// This script provides a structured way to input the most important volume metrics

import { ManualVolumeTracker } from './lib/manual-volume-tracker.js';

interface QuickVolumeEntry {
  playerName: string;
  team: string;
  position: string;
  targets: number;
  carries: number;
  redZoneOpportunities: number; // Combined red zone targets + carries
  teamPoints: number;
}

async function main() {
  const [week] = [parseInt(process.argv[2])];

  if (!week) {
    console.log('Usage: npx tsx add-weekly-volume-data.ts <week>');
    console.log('Example: npx tsx add-weekly-volume-data.ts 4');
    process.exit(1);
  }

  console.log(`📊 Adding volume data for Week ${week}...\n`);

  // These are the key players we should track based on TD prediction importance
  // Focus on high-target receivers, primary RBs, and red zone threats
  const weeklyVolumeData: QuickVolumeEntry[] = [
    // Example entries - these would be filled in with actual data
    // Week 4 key players (update with real data)

    // High-volume receivers
    { playerName: "CeeDee Lamb", team: "Dallas Cowboys", position: "WR", targets: 12, carries: 0, redZoneOpportunities: 3, teamPoints: 24 },
    { playerName: "Tyreek Hill", team: "Miami Dolphins", position: "WR", targets: 10, carries: 1, redZoneOpportunities: 2, teamPoints: 21 },
    { playerName: "Davante Adams", team: "Las Vegas Raiders", position: "WR", targets: 11, carries: 0, redZoneOpportunities: 4, teamPoints: 17 },

    // Primary running backs
    { playerName: "Christian McCaffrey", team: "San Francisco 49ers", position: "RB", targets: 6, carries: 18, redZoneOpportunities: 4, teamPoints: 28 },
    { playerName: "Josh Jacobs", team: "Green Bay Packers", position: "RB", targets: 3, carries: 15, redZoneOpportunities: 3, teamPoints: 24 },
    { playerName: "Derrick Henry", team: "Baltimore Ravens", position: "RB", targets: 2, carries: 20, redZoneOpportunities: 5, teamPoints: 31 },

    // Tight ends with high target share
    { playerName: "Travis Kelce", team: "Kansas City Chiefs", position: "TE", targets: 8, carries: 0, redZoneOpportunities: 2, teamPoints: 27 },
    { playerName: "Mark Andrews", team: "Baltimore Ravens", position: "TE", targets: 7, carries: 0, redZoneOpportunities: 3, teamPoints: 31 },
  ];

  // Convert to full PlayerVolumeData format
  const tracker = new ManualVolumeTracker();
  const fullVolumeData = weeklyVolumeData.map(entry => {
    // Calculate derived metrics
    const targetShare = entry.targets / 35; // Estimate based on ~35 team pass attempts average
    const touchShare = entry.carries / 25; // Estimate based on ~25 team rush attempts average
    const redZoneShare = entry.redZoneOpportunities / 6; // Estimate based on ~6 team red zone opportunities

    return {
      playerName: entry.playerName,
      team: entry.team,
      position: entry.position,
      week: week,
      season: 2025,

      // Core volume metrics
      carries: entry.carries,
      targets: entry.targets,
      receptions: Math.floor(entry.targets * 0.7), // Estimate ~70% catch rate
      redZoneTargets: entry.position === 'RB' ? Math.floor(entry.redZoneOpportunities * 0.3) : Math.floor(entry.redZoneOpportunities * 0.7),
      redZoneCarries: entry.position === 'RB' ? Math.floor(entry.redZoneOpportunities * 0.7) : Math.floor(entry.redZoneOpportunities * 0.3),
      snapCount: entry.targets + entry.carries + 10, // Rough estimate

      // Team context
      teamPoints: entry.teamPoints,
      teamPassingAttempts: 35, // NFL average
      teamRushingAttempts: 25, // NFL average

      // Derived metrics
      targetShare,
      touchShare,
      redZoneShare
    };
  });

  // Add the data
  tracker.addWeeklyData(week, fullVolumeData);

  // Generate a quick report
  tracker.generateVolumeReport(week);

  console.log(`\n💡 To add more players or update data:`);
  console.log(`   1. Edit this script with actual volume numbers`);
  console.log(`   2. Get data from sites like Pro Football Reference`);
  console.log(`   3. Focus on players with 6+ targets or 10+ carries`);
  console.log(`   4. Red zone opportunities are the strongest TD predictor`);
}

main().catch(console.error);