import fs from 'fs';
import { TDRecommendation } from './types.js';

export function dataHasChanged(newData: TDRecommendation[], oldData: TDRecommendation[] | null): { hasChanged: boolean; summary: string } {
  if (!oldData) {
    return {
      hasChanged: true,
      summary: `New recommendations file created with ${newData.length} recommendations`
    };
  }
  
  // Compare the actual recommendation content, ignoring timestamps
  const newContent = JSON.stringify(newData.map(r => ({
    Player: r.Player,
    Team: r.Team,
    Opponent: r.Opponent,
    Basis: r.Basis,
    "Opponent Stat Value": r["Opponent Stat Value"],
    "Player TDs YTD": r["Player TDs YTD"],
    "TDs vs Opponent Last Year (2024)": r["TDs vs Opponent Last Year (2024)"],
    Reason: r.Reason
  })));
  
  const oldContent = JSON.stringify(oldData.map(r => ({
    Player: r.Player,
    Team: r.Team,
    Opponent: r.Opponent,
    Basis: r.Basis,
    "Opponent Stat Value": r["Opponent Stat Value"],
    "Player TDs YTD": r["Player TDs YTD"],
    "TDs vs Opponent Last Year (2024)": r["TDs vs Opponent Last Year (2024)"],
    Reason: r.Reason
  })));
  
  if (newContent === oldContent) {
    return {
      hasChanged: false,
      summary: `No changes detected (${newData.length} recommendations)`
    };
  }
  
  const changes: string[] = [];
  
  // Check if list size changed
  if (newData.length !== oldData.length) {
    changes.push(`recommendation count changed: ${oldData.length} → ${newData.length}`);
  }
  
  // Check for player changes
  const oldPlayers = new Set(oldData.map(r => `${r.Player} (${r.Team})`));
  const newPlayers = new Set(newData.map(r => `${r.Player} (${r.Team})`));
  
  const added = [...newPlayers].filter(p => !oldPlayers.has(p));
  const removed = [...oldPlayers].filter(p => !newPlayers.has(p));
  
  if (added.length > 0) {
    changes.push(`added ${added.length} players: ${added.slice(0, 3).join(', ')}${added.length > 3 ? '...' : ''}`);
  }
  
  if (removed.length > 0) {
    changes.push(`removed ${removed.length} players: ${removed.slice(0, 3).join(', ')}${removed.length > 3 ? '...' : ''}`);
  }
  
  if (changes.length === 0) {
    changes.push('ranking order changed');
  }
  
  return {
    hasChanged: true,
    summary: changes.join(', ')
  };
}

export async function loadExistingRecommendations(filePath: string): Promise<TDRecommendation[] | null> {
  try {
    const existingContent = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(existingContent);
    return parsed.recommendations || null;
  } catch (error) {
    return null;
  }
}