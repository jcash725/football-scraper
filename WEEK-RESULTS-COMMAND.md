# Quick Command to Process Weekly Results

## 🎯 Single Command (Copy & Paste)

After all games for the week are complete, run this:

```bash
WEEK=7
npx tsx scripts/collect-weekly-touchdowns.ts $WEEK 2025 && \
npx tsx scripts/auto-record-results.ts $WEEK 2025 && \
rm data/week${WEEK}-predictions.html data/week${WEEK}-volume-analysis.html data/week${WEEK}-combined-predictions.html data/week${WEEK}-enhanced-predictions.html 2>/dev/null; \
git add data/touchdown-history-2025.json data/week${WEEK}-all-predictions.html data/accuracy-report.json data/prediction-history.json data/week${WEEK}-predictions.json && \
git add -u data/week${WEEK}*.html && \
git commit -m "Update Week ${WEEK} results with touchdown data and accuracy tracking" && \
git push origin main
```

## 📝 Step-by-Step (If you prefer)

```bash
# 1. Set the week number
WEEK=7

# 2. Collect touchdown data from ESPN
npx tsx scripts/collect-weekly-touchdowns.ts $WEEK 2025

# 3. Update HTML with checkmarks and accuracy
npx tsx scripts/auto-record-results.ts $WEEK 2025

# 4. Remove extra HTML files (keep only all-predictions)
rm data/week${WEEK}-predictions.html data/week${WEEK}-volume-analysis.html data/week${WEEK}-combined-predictions.html data/week${WEEK}-enhanced-predictions.html

# 5. Commit and push to GitHub
git add data/touchdown-history-2025.json data/week${WEEK}-all-predictions.html data/accuracy-report.json data/prediction-history.json data/week${WEEK}-predictions.json
git add -u data/week${WEEK}*.html
git commit -m "Update Week ${WEEK} results with touchdown data and accuracy tracking"
git push origin main
```

## 🔄 For Future Weeks

Just change the week number:
- Week 8: `WEEK=8`
- Week 9: `WEEK=9`
- Week 10: `WEEK=10`
- etc.

## ✅ What This Does

1. **Collects TD data** - Fetches all touchdowns from ESPN for the completed week
2. **Updates predictions** - Adds ✅/❌ to all players and calculates accuracy for each model
3. **Cleans up files** - Removes redundant HTML files
4. **Commits changes** - Saves everything to GitHub

## 📊 Expected Output

- `data/touchdown-history-2025.json` - Updated with new TDs
- `data/weekX-all-predictions.html` - Updated with results and accuracy summaries
- Each model tab shows its own accuracy (Current, ML, Volume, Combined, Enhanced)
