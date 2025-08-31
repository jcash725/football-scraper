import fs from 'fs';
import path from 'path';
import { Player, TeamStat, Matchup, AnalysisData } from './types.js';

export function loadData(): AnalysisData {
  const dataDir = path.join(process.cwd(), 'data');
  
  const rushingPlayers: Player[] = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'rushing-touchdowns-players.json'), 'utf8')
  ).rows;
  
  const receivingPlayers: Player[] = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'receiving-touchdowns-players.json'), 'utf8')
  ).rows;
  
  const opponentRushTDs: TeamStat[] = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'opponent-rushing-tds.json'), 'utf8')
  ).rows;
  
  const opponentPassTDs: TeamStat[] = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'opponent-passing-tds.json'), 'utf8')
  ).rows;
  
  const matchups: Matchup[] = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'weekly-matchups.json'), 'utf8')
  ).rows;
  
  return {
    rushingPlayers,
    receivingPlayers,
    opponentRushTDs,
    opponentPassTDs,
    matchups
  };
}