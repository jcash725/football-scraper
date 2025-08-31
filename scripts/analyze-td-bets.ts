import fs from 'fs';
import path from 'path';
import { loadData } from './lib/data-loader.js';
import { generateTop20List } from './lib/top20-generator.js';
import { formatAsHTML } from './lib/html-generator.js';
import { dataHasChanged, loadExistingRecommendations } from './lib/change-detector.js';

async function main() {
  try {
    console.log("Generating Top 20 TD Bet Recommendations...");
    
    const data = loadData();
    const top20 = await generateTop20List(data);
    
    console.log(`Generated ${top20.length} recommendations`);
    
    const outputDir = path.join(process.cwd(), 'data');
    const jsonPath = path.join(outputDir, 'td-bet-recommendations.json');
    const htmlPath = path.join(outputDir, 'td-bet-recommendations.html');
    
    // Check for changes
    const existingRecommendations = await loadExistingRecommendations(jsonPath);
    const changeResult = dataHasChanged(top20, existingRecommendations);
    
    if (changeResult.hasChanged) {
      // Save JSON
      fs.writeFileSync(jsonPath, JSON.stringify({
        generatedAt: new Date().toISOString(),
        instructions: "🔒 Updated Instructions for TD Bets GPT",
        count: top20.length,
        recommendations: top20
      }, null, 2));
      
      // Save HTML
      fs.writeFileSync(htmlPath, formatAsHTML(top20));
      
      console.log(`✅ Updated TD recommendations - ${changeResult.summary}`);
      console.log("  - data/td-bet-recommendations.json");
      console.log("  - data/td-bet-recommendations.html");
    } else {
      console.log(`⏭️  Skipped TD recommendations - ${changeResult.summary}`);
    }
    
  } catch (error) {
    console.error("Error generating recommendations:", error);
    process.exit(1);
  }
}

main();