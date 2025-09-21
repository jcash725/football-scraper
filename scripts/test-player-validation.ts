import { InjuryTracker } from './lib/injury-tracker.js';

async function testPlayerValidation() {
  const tracker = new InjuryTracker();

  // Test with a known player who might be injured
  const result1 = await tracker.validatePlayerRecommendation('Josh Jacobs', 'Green Bay Packers');
  console.log('Josh Jacobs validation:', result1);

  // Test with a player without expected team
  const result2 = await tracker.validatePlayerRecommendation('Christian McCaffrey');
  console.log('Christian McCaffrey validation:', result2);

  // Test with a made-up player
  const result3 = await tracker.validatePlayerRecommendation('Fake Player', 'Fake Team');
  console.log('Fake Player validation:', result3);
}

testPlayerValidation().catch(console.error);