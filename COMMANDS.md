# Football Scraper Commands Reference

## 🏈 Main Workflow Commands

### 📊 Weekly Results & Next Week Prep
```bash
npx tsx scripts/results.ts <week>
```
**What it does:** Complete weekly results processing and next week preparation
- Records results for the completed week with ✅/❌ marks
- Auto-scrapes volume data for next week from all sources
- Generates predictions for next week across all 5 models
- Creates the combined all-predictions interface

**Example:** `npx tsx scripts/results.ts 5`
- Records Week 5 results with checkmarks/X marks
- Auto-scrapes Week 6 volume data
- Generates Week 6 predictions (Current, ML, Volume, Combined, Enhanced)
- Creates `week6-all-predictions.html`

### 🔮 Generate Predictions for a Week
```bash
npx tsx scripts/generate-combined-interface.ts <week>
```
**What it does:** Generates the main all-predictions interface with all 5 models
- Combines Current, ML, Volume, Combined, and Enhanced predictions
- Creates tabbed interface for easy comparison
- Shows prediction counts for each model

**Example:** `npx tsx scripts/generate-combined-interface.ts 6`
- Creates `week6-all-predictions.html` with all prediction models

---

## 🤖 Data Collection Commands

### 📡 Auto-Scrape Volume Data
```bash
npx tsx scripts/auto-scrape-volume-data.ts <week>
```
**What it does:** Automatically collects volume data from multiple sources
- Scrapes TeamRankings.com for targets and carries
- Fetches ESPN player statistics
- Gets NFL.com receiving targets
- Pulls Pro Football Reference red zone data
- Generates volume data for 20+ players

**Example:** `npx tsx scripts/auto-scrape-volume-data.ts 6`
- Collects current season volume stats
- Converts to weekly projections
- Saves data for prediction models

### 🎯 Manual Volume Data Entry (Backup)
```bash
npx tsx scripts/volume-data-entry.ts <week>
```
**What it does:** Manual entry for volume data when auto-scraping fails
- Interactive template for entering targets, carries, red zone opportunities
- Use only when auto-scraping doesn't work
- Limited to manually entered players

**Example:** `npx tsx scripts/volume-data-entry.ts 6`

### 📊 Defense Data Scraping
```bash
npx tsx scripts/scrape-teamrankings.ts
```
**What it does:** Scrapes defensive rankings from TeamRankings
- Gets opponent rushing touchdowns allowed per game
- Gets opponent passing touchdowns allowed per game
- Updates defense data for all teams
- Creates `opponent-rushing-tds.json` and `opponent-passing-tds.json`

---

## 🎯 Individual Model Generation

### 📈 Current Model Predictions
```bash
npx tsx scripts/generate-weekly-predictions.ts <week> <year>
```
**What it does:** Generates predictions using historical performance + defensive matchups
- Uses 2024 season touchdown data
- Applies massive rookie boosts for hot performers
- Factors in defensive matchups
- Produces 20 predictions

**Example:** `npx tsx scripts/generate-weekly-predictions.ts 6 2025`

### 🤖 ML Model Predictions
```bash
npx tsx scripts/generate-ml-predictions.ts <week>
```
**What it does:** Machine learning predictions using 2024 data and recent form
- Analyzes 2024 season production
- Considers opponent history
- Factors in recent hot/cold streaks
- Generates probability percentages

**Example:** `npx tsx scripts/generate-ml-predictions.ts 6`

### 📊 Volume-Based Predictions
```bash
npx tsx scripts/generate-combined-predictions.ts <week>
```
**What it does:** Combined Volume + Defense model (60% volume + 30% defense + 10% historical)
- Requires volume data from auto-scraping or manual entry
- Analyzes targets, carries, red zone opportunities
- Factors in current defensive rankings
- Includes recent TD production

**Example:** `npx tsx scripts/generate-combined-predictions.ts 6`

### 🚀 Enhanced Model Predictions
```bash
npx tsx scripts/generate-enhanced-predictions.ts <week>
```
**What it does:** Most sophisticated model (50% volume + 25% defense + 15% game script + 10% usage trends)
- Requires volume data from auto-scraping or manual entry
- Advanced multi-factor analysis
- Game script predictions (blowout vs close games)
- Usage trend analysis

**Example:** `npx tsx scripts/generate-enhanced-predictions.ts 6`

---

## 📝 Results Recording Commands

### ✅ Auto-Record Results (Standalone)
```bash
npx tsx scripts/auto-record-results.ts <week> <year>
```
**What it does:** Records actual results against predictions
- Matches predictions against actual touchdown scorers
- Adds ✅ marks for correct predictions
- Adds ❌ marks for incorrect predictions
- Calculates accuracy percentages
- Updates all HTML files

**Example:** `npx tsx scripts/auto-record-results.ts 5 2025`

### 📊 Process Weekly Results (Full Workflow)
```bash
npx tsx scripts/process-weekly-results.ts <week> <year>
```
**What it does:** Comprehensive results processing + next week prep
- Records results for completed week
- Updates all-predictions.html with checkmarks/X marks
- Auto-scrapes volume data for next week
- Generates predictions for next week
- This is what `results.ts` calls internally

**Example:** `npx tsx scripts/process-weekly-results.ts 5 2025`

---

## 🔧 Utility Commands

### 🏥 Check Player Injuries
```bash
npx tsx scripts/lib/injury-checker.ts
```
**What it does:** Updates injury status for predictions
- Checks current injury reports
- Filters out players marked as "Out"
- Updates injury status in predictions

### 📅 Update Bye Week Filter
```bash
npx tsx scripts/lib/bye-week-filter.ts
```
**What it does:** Updates which teams are on bye for the current week
- Filters out players on bye week teams
- Ensures predictions only include active players

---

## 📊 Data Sources Being Scraped

### 🎯 Volume Data Sources:
- **TeamRankings.com:** `https://www.teamrankings.com/nfl/player-stat/receiving-targeted`
- **ESPN:** `https://www.espn.com/nfl/stats/player/_/stat/receiving`
- **NFL.com:** `https://www.nfl.com/stats/player-stats/category/receiving/2025/REG/all/receivingtargets/DESC`

### 🛡️ Defense Data Sources:
- **TeamRankings.com:**
  - `https://www.teamrankings.com/nfl/stat/opponent-rushing-touchdowns-per-game`
  - `https://www.teamrankings.com/nfl/stat/opponent-passing-touchdowns-per-game`

### 📅 Schedule Data Sources:
- **TeamRankings.com:** `https://www.teamrankings.com/nfl/schedules/season/`

### 🔴 Red Zone Data Sources:
- **Pro Football Reference** (currently uses hardcoded data, scraping TODO)

---

## 🚀 Quick Start

**Most common workflow:**

1. **When games finish:** `npx tsx scripts/results.ts 5`
   - This handles everything: results recording + next week prep

2. **To regenerate predictions:** `npx tsx scripts/generate-combined-interface.ts 6`
   - Creates the main prediction interface

3. **If auto-scraping fails:** `npx tsx scripts/auto-scrape-volume-data.ts 6`
   - Re-run the auto-scraping manually

**The system is designed to be fully automated - you should only need the `results.ts` command for week-to-week operations.**