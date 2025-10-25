# Weekly NFL Prediction & Data Collection Workflow

This guide outlines the weekly process for generating predictions, collecting actual results, and tracking accuracy over time.

## 🏈 Weekly Process (Every Tuesday after MNF)

### Step 1: Generate Weekly Predictions (ALL MODELS)
```bash
# IMPORTANT: This generates ALL 5 models (Current, ML, Volume, Combined, Enhanced)
npx tsx scripts/generate-all-week-predictions.ts WEEK

# Example for Week 8:
npx tsx scripts/generate-all-week-predictions.ts 8
```
**What this does:**
- Generates Current Model (rookie-focused) + ML Model (2024 data)
- Generates Volume Model (targets/carries + defense)
- Generates Combined Model (volume + defense weighted)
- Generates Enhanced Model (volume + defense + game script)
- Creates unified week{WEEK}-all-predictions.html with all 5 models in tabs
- Saves predictions to prediction-history.json for tracking

### Step 2: Collect Completed Week's Touchdown Data
```bash
# After games are complete, collect actual TD data
# Replace WEEK with actual week number (e.g., 7)
npx tsx scripts/collect-weekly-touchdowns.ts WEEK 2025
```
**What this does:**
- Fetches all games from the completed week
- Extracts touchdown performances from each game
- Updates the master touchdown database (data/touchdown-history-2025.json)
- Shows summary of who actually scored TDs

### Step 3: Process Week Results and Update HTML
```bash
# Process results and update the all-predictions HTML file
# Replace WEEK with actual week number (e.g., 7)
npx tsx scripts/process-weekly-results.ts WEEK 2025
```
**What this does:**
- Adds ✅ and ❌ markers to all player predictions
- Calculates accuracy for EACH individual model/tab
- Displays accuracy percentage inside each tab (not at the top)
- Removes duplicate headers
- Updates only the week{WEEK}-all-predictions.html file
- Auto-scrapes volume data for next week
- Generates predictions for next week (if scripts exist)

### Step 4: Clean Up and Prepare for Commit
```bash
# Remove individual model HTML files (keep only all-predictions)
# Note: process-weekly-results.ts already handles most cleanup
rm data/week7-predictions.html data/week7-combined-predictions.html data/week7-enhanced-predictions.html 2>/dev/null

# Stage and commit changes
git add data/touchdown-history-2025.json data/week7-all-predictions.html data/week7-predictions.json
git add -u data/week7*.html
git commit -m "Update Week 7 results with touchdown data and accuracy tracking"
git push origin main
```

## 📝 Quick Command for Week Results (One-Liner)
```bash
# After all Week X games are complete, run this command:
WEEK=7
npx tsx scripts/process-weekly-results.ts $WEEK 2025 && \
rm data/week${WEEK}-predictions.html data/week${WEEK}-combined-predictions.html data/week${WEEK}-enhanced-predictions.html 2>/dev/null && \
git add data/touchdown-history-2025.json data/week${WEEK}-all-predictions.html data/week${WEEK}-predictions.json && \
git add -u data/week${WEEK}*.html && \
git commit -m "Update Week ${WEEK} results with touchdown data and accuracy tracking" && \
git push origin main
```

**Important Notes:**
- **Always use `process-weekly-results.ts`** instead of `auto-record-results.ts`
- This ensures accuracy is calculated **per tab** and displayed inside each tab
- No duplicate headers will appear at the top
- Only `week{WEEK}-all-predictions.html` will contain results

## 📊 Accuracy Tracking Features

The system automatically tracks:
- **Overall accuracy** for both models
- **Top 5 and Top 10 accuracy** rates
- **ML model probability analysis** (avg probability of correct vs incorrect predictions)
- **Weekly breakdown** of performance
- **Player-by-player results** history

## 📁 Generated Files

### Core Data Files
- `data/touchdown-history-2024.json` - Master touchdown database (973 performances)
- `data/prediction-history.json` - All weekly predictions and results
- `data/accuracy-report.json` - Detailed accuracy analysis

### Weekly Output
- `data/td-bet-recommendations.html` - Current week predictions (dual model view)
- `data/td-bet-recommendations.json` - Current model data
- `data/model-comparison.json` - Model agreement analysis

## 🎯 Prediction Models

### Current Model (Rule-based)
- Based on opponent defensive rankings
- Uses current season TD totals
- Factors in historical matchup data

### Enhanced ML Model (2024 Data-driven)
- **Actual 2024 touchdown history** (973 performances from 278 games)
- **Head-to-head matchup data** (real vs. opponent performance)
- **Opponent defensive analysis** (calculated from actual TDs allowed)
- **Home/away splits** and season trends
- **Probability-based predictions** with confidence levels

## 🔄 Continuous Improvement

The system gets smarter over time by:
1. **Adding new touchdown data** each week to the historical database
2. **Tracking prediction accuracy** to identify model strengths/weaknesses
3. **Learning from incorrect predictions** to refine algorithms
4. **Building larger dataset** for more reliable ML predictions

## 💡 Pro Tips

- Run the weekly collection **Tuesday morning** after all Monday Night games are complete
- The Enhanced ML Model will become more accurate as we collect more 2025 data
- Check the accuracy report regularly to see which model is performing better
- High-probability ML predictions (>60%) have historically been more reliable

## 🚀 Season-Long Goals

- **Track accuracy trends** throughout the 2025 season
- **Compare model performance** in different game situations
- **Build comprehensive multi-season database** for even better predictions
- **Identify top-performing prediction patterns** for key insights