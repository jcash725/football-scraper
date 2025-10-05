#!/usr/bin/env tsx
import { ByeWeekFilter } from './lib/bye-week-filter.js';

const filter = new ByeWeekFilter();

console.log('🚫 Teams on bye week:');
filter.getByeTeams().forEach(team => console.log(`   • ${team}`));

console.log('\n✅ Teams playing:');
filter.getPlayingTeams().forEach(team => console.log(`   • ${team}`));

console.log('\n🧪 Test specific teams:');
console.log(`Josh Jacobs (Green Bay Packers): ${filter.isTeamOnBye('Green Bay Packers') ? 'ON BYE' : 'PLAYING'}`);
console.log(`Christian McCaffrey (San Francisco 49ers): ${filter.isTeamOnBye('San Francisco 49ers') ? 'ON BYE' : 'PLAYING'}`);
console.log(`Saquon Barkley (Philadelphia Eagles): ${filter.isTeamOnBye('Philadelphia Eagles') ? 'ON BYE' : 'PLAYING'}`);