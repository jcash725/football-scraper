# ✅ Weekly Prediction Generation Checklist

## 🚨 CRITICAL: Use This Every Week

When generating predictions for a new week, **ALWAYS** run this command:

```bash
npx tsx scripts/generate-all-week-predictions.ts <WEEK>
```

**This automatically:**
1. ✅ **Fetches the correct Week {WEEK} matchups from ESPN API first**
2. ✅ Generates all 5 prediction models with the right opponents
3. ✅ Creates the unified week{WEEK}-all-predictions.html file
4. ✅ Updates data/weekly-matchups.json with current week's schedule

## ✅ What Should Happen

After running the command, verify:

1. **File Created**: `data/week{WEEK}-all-predictions.html` exists
2. **All 5 Tabs Populated**:
   - Current Model: 20 predictions ✅
   - ML Model: 20 predictions ✅
   - Volume Model: 20 predictions ✅
   - Combined Model: 20 predictions ✅
   - Enhanced Model: 20 predictions ✅

## 🔍 Quick Verification

```bash
# Check total predictions (should be 120 = 20 × 5 models)
grep -c '<td class="player-name">' data/week{WEEK}-all-predictions.html

# Expected output: 120
```

## ❌ Common Mistakes

**DON'T** run just:
- ❌ `npx tsx scripts/analyze-td-bets.ts` - Only generates 2 models, uses OLD matchups
- ❌ `npx tsx scripts/generate-weekly-predictions.ts` - Only generates Current model
- ❌ `npx tsx scripts/fetch-current-matchups.ts` then running other scripts - Easy to forget matchups

**DO** run:
- ✅ `npx tsx scripts/generate-all-week-predictions.ts <WEEK>` - **Fetches matchups FIRST**, then generates all 5 models

### 🚨 Why Matchups Matter

If you don't fetch the correct week's matchups:
- Predictions will use the **previous week's opponents** ❌
- Examples from Week 8 when Week 7 matchups were cached:
  - Houston predicted vs Seattle (wrong!) instead of vs San Francisco
  - Carolina predicted vs Jets (wrong!) instead of vs Buffalo
  - Dallas predicted vs Washington (wrong!) instead of vs Denver

**Solution:** The `generate-all-week-predictions.ts` script now fetches matchups automatically as Step 0!

## 📝 What Gets Generated

### Individual Model Files (will be deleted after results):
- `week{WEEK}-predictions.html` - Current model only
- `week{WEEK}-combined-predictions.html` - Volume model
- `week{WEEK}-enhanced-predictions.html` - Enhanced model
- `week{WEEK}-predictions.json` - JSON data

### The ONLY File That Matters:
- `week{WEEK}-all-predictions.html` - **ALL 5 MODELS IN ONE FILE**

This is the file that:
- Contains all 5 model predictions in separate tabs
- Gets updated with results (✅/❌) when you run `process-weekly-results.ts`
- Shows accuracy per tab when results are added
- Should be the ONLY HTML file you keep after results

## 🔄 Full Weekly Workflow

1. **Tuesday AM (before games)**: Generate predictions
   ```bash
   npx tsx scripts/generate-all-week-predictions.ts <WEEK>
   ```

2. **Tuesday PM (after all games complete)**: Get results
   ```bash
   npx tsx scripts/process-weekly-results.ts <WEEK> 2025
   ```

3. **Clean up**: Delete individual model HTML files
   ```bash
   rm data/week{WEEK}-predictions.html data/week{WEEK}-combined-predictions.html data/week{WEEK}-enhanced-predictions.html
   ```

4. **Verify**: Only `week{WEEK}-all-predictions.html` remains with all results

---

**Last Updated**: 2025-10-24
**Script Location**: `/Users/jojo/repos/football-scraper/scripts/generate-all-week-predictions.ts`
