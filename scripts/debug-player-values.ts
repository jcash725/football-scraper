import { loadSeasonData } from './generate-weekly-predictions.js';

async function debugPlayerValues() {
  try {
    console.log('Loading 2024 season data...');
    const season2024 = await loadSeasonData('./data/2024-season');
    console.log('Loading 2025 season data...');
    const season2025 = await loadSeasonData('./data');

    console.log('\n=== 2024 Season Top Rushing TDs ===');
    season2024.rushingPlayers.sort((a,b) => b.Value - a.Value).slice(0,10).forEach(p => {
      console.log(`${p.Player} (${p.Team}) - ${p.Value} TDs`);
    });

    console.log('\n=== 2025 Season Top Rushing TDs ===');
    season2025.rushingPlayers.sort((a,b) => b.Value - a.Value).slice(0,10).forEach(p => {
      console.log(`${p.Player} (${p.Team}) - ${p.Value} TDs`);
    });

    console.log('\n=== 2024 Season Top Receiving TDs ===');
    season2024.receivingPlayers.sort((a,b) => b.Value - a.Value).slice(0,10).forEach(p => {
      console.log(`${p.Player} (${p.Team}) - ${p.Value} TDs`);
    });

    console.log('\n=== 2025 Season Top Receiving TDs ===');
    season2025.receivingPlayers.sort((a,b) => b.Value - a.Value).slice(0,10).forEach(p => {
      console.log(`${p.Player} (${p.Team}) - ${p.Value} TDs`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

debugPlayerValues();