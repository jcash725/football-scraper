# Weekly NFL Prediction & Data Collection Workflow

This guide outlines the weekly process for generating predictions, collecting actual results, and tracking accuracy over time.

## 🏈 Weekly Process (Every Tuesday after MNF)

### Step 1: Generate Weekly Predictions
```bash
# This automatically saves predictions to prediction-history.json
npx tsx scripts/analyze-td-bets.ts
```
**What this does:**
- Generates top 20 predictions from both Current Model and Enhanced ML Model
- Saves predictions with probabilities and key factors
- Updates HTML recommendations file
- Tracks predictions for accuracy measurement

### Step 2: Collect Completed Week's Touchdown Data
```bash
# After games are complete, collect actual TD data
npx tsx scripts/collect-weekly-touchdowns.ts 1 2025
```
**What this does:**
- Fetches all games from the completed week
- Extracts touchdown performances from each game
- Updates the master touchdown database
- Shows summary of who actually scored TDs

### Step 3: Record Actual Results vs Predictions
```bash
# Compare predictions to actual results
npx tsx scripts/record-weekly-results.ts 1 2025
```
**What this does:**
- Matches actual TD scorers to previous week's predictions
- Records which predictions were correct/incorrect
- Calculates updated accuracy statistics
- Generates weekly accuracy report

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