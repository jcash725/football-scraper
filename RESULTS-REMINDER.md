# 🚨 IMPORTANT: Weekly Prediction Workflow

## When User Asks for Week Predictions

**ALWAYS use this command to generate ALL 5 models:**
```bash
npx tsx scripts/generate-all-week-predictions.ts <WEEK>
```

**Example:**
```bash
npx tsx scripts/generate-all-week-predictions.ts 8
```

**This generates:**
- ✅ Current Model (20 predictions)
- ✅ ML Model (20 predictions)
- ✅ Volume Model (20 predictions)
- ✅ Combined Model (20 predictions)
- ✅ Enhanced Model (20 predictions)
- ✅ Unified week{WEEK}-all-predictions.html with all tabs populated

## When User Asks for Week Results

**ALWAYS use this command:**
```bash
npx tsx scripts/process-weekly-results.ts <WEEK> 2025
```

**Example:**
```bash
npx tsx scripts/process-weekly-results.ts 7 2025
```

## What This Does Correctly

✅ Collects touchdown data from ESPN API
✅ Marks predictions with ✅ (scored) or ❌ (didn't score)
✅ Calculates accuracy **per model/tab** (not overall)
✅ Displays accuracy **inside each tab** (not at the top)
✅ Removes duplicate result headers from top of page
✅ Updates only `week{WEEK}-all-predictions.html` file
✅ Auto-scrapes volume data for next week
✅ Attempts to generate next week's predictions

## Expected Results Display

Each tab shows its own accuracy at the top:

**Current Model Tab:**
- Accuracy: 5/20 correct (25%)

**ML Model Tab:**
- Accuracy: 7/20 correct (35%)

**Volume Model Tab:**
- Accuracy: 11/20 correct (55%)

**Combined Model Tab:**
- Accuracy: 11/20 correct (55%)

**Enhanced Model Tab:**
- Accuracy: 11/20 correct (55%)

## Files to Clean Up After

Individual model HTML files should be deleted (only keep all-predictions):
```bash
rm data/week7-predictions.html data/week7-combined-predictions.html data/week7-enhanced-predictions.html
```

## ❌ DO NOT USE

~~`npx tsx scripts/auto-record-results.ts`~~ - This only updates individual model files, not the all-predictions file

## Key Points

1. **One file to rule them all**: Only `week{WEEK}-all-predictions.html` should have results
2. **Per-tab accuracy**: Each tab shows its own model's accuracy, not overall
3. **Clean header**: No duplicate result boxes at the top of the page
4. **Tab-specific results**: Accuracy appears inside each tab's content area

---

**Last Updated:** 2025-10-24
**Script Location:** `/Users/jojo/repos/football-scraper/scripts/process-weekly-results.ts`
