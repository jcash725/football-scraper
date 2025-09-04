// Track prediction accuracy over time for both models
import fs from 'fs';
import path from 'path';

export interface WeeklyPrediction {
  week: number;
  year: number;
  generatedAt: string;
  currentModelPredictions: Array<{
    rank: number;
    player: string;
    team: string;
    opponent: string;
    basis: string;
    actualResult?: boolean; // true if scored TD, false if didn't, undefined if not yet recorded
  }>;
  mlModelPredictions: Array<{
    rank: number;
    player: string;
    team: string;
    opponent: string;
    probability: number;
    confidence: number;
    keyFactors: string[];
    actualResult?: boolean;
  }>;
}

export interface PredictionAccuracyStats {
  currentModelStats: {
    totalPredictions: number;
    correctPredictions: number;
    accuracy: number;
    top5Accuracy: number;
    top10Accuracy: number;
  };
  mlModelStats: {
    totalPredictions: number;
    correctPredictions: number;
    accuracy: number;
    top5Accuracy: number;
    top10Accuracy: number;
    avgProbabilityCorrect: number;
    avgProbabilityIncorrect: number;
  };
}

export interface PredictionHistory {
  createdAt: string;
  lastUpdated: string;
  weeks: WeeklyPrediction[];
  accuracyStats: PredictionAccuracyStats;
}

export class PredictionTracker {
  private readonly dataDir: string;
  private readonly historyFile: string;

  constructor(dataDir: string = 'data') {
    this.dataDir = dataDir;
    this.historyFile = path.join(dataDir, 'prediction-history.json');
    this.ensureDataDirectory();
  }

  private ensureDataDirectory(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  saveWeeklyPredictions(
    week: number, 
    year: number, 
    currentModel: any[], 
    mlModel: any[]
  ): void {
    const history = this.loadHistory();
    
    // Check if predictions for this week already exist
    const existingWeekIndex = history.weeks.findIndex(w => w.week === week && w.year === year);
    
    const weeklyPrediction: WeeklyPrediction = {
      week,
      year,
      generatedAt: new Date().toISOString(),
      currentModelPredictions: currentModel.map((pred, index) => ({
        rank: index + 1,
        player: pred.Player,
        team: pred.Team,
        opponent: pred.Opponent,
        basis: pred.Basis
      })),
      mlModelPredictions: mlModel.map((pred, index) => ({
        rank: index + 1,
        player: pred.player,
        team: pred.team,
        opponent: pred.opponent,
        probability: pred.mlProbability,
        confidence: pred.mlConfidence,
        keyFactors: pred.keyFactors
      }))
    };

    if (existingWeekIndex >= 0) {
      // Update existing week but preserve actual results
      const existing = history.weeks[existingWeekIndex];
      
      // Preserve actual results from existing predictions
      weeklyPrediction.currentModelPredictions.forEach((newPred, i) => {
        const existingPred = existing.currentModelPredictions.find(p => 
          p.player === newPred.player && p.opponent === newPred.opponent
        );
        if (existingPred?.actualResult !== undefined) {
          newPred.actualResult = existingPred.actualResult;
        }
      });

      weeklyPrediction.mlModelPredictions.forEach((newPred, i) => {
        const existingPred = existing.mlModelPredictions.find(p => 
          p.player === newPred.player && p.opponent === newPred.opponent
        );
        if (existingPred?.actualResult !== undefined) {
          newPred.actualResult = existingPred.actualResult;
        }
      });

      history.weeks[existingWeekIndex] = weeklyPrediction;
      console.log(`📝 Updated predictions for Week ${week} ${year}`);
    } else {
      // Add new week
      history.weeks.push(weeklyPrediction);
      console.log(`📝 Saved new predictions for Week ${week} ${year}`);
    }

    history.lastUpdated = new Date().toISOString();
    this.saveHistory(history);
  }

  recordActualResults(week: number, year: number, results: Array<{player: string, team: string, scoredTD: boolean}>): void {
    const history = this.loadHistory();
    const weekIndex = history.weeks.findIndex(w => w.week === week && w.year === year);
    
    if (weekIndex === -1) {
      console.log(`❌ No predictions found for Week ${week} ${year}`);
      return;
    }

    const weekData = history.weeks[weekIndex];
    let updatedCount = 0;

    // Update current model results
    weekData.currentModelPredictions.forEach(pred => {
      const result = results.find(r => 
        r.player.toLowerCase().includes(pred.player.toLowerCase()) &&
        r.team.toLowerCase().includes(pred.team.toLowerCase())
      );
      if (result) {
        pred.actualResult = result.scoredTD;
        updatedCount++;
      }
    });

    // Update ML model results  
    weekData.mlModelPredictions.forEach(pred => {
      const result = results.find(r => 
        r.player.toLowerCase().includes(pred.player.toLowerCase()) &&
        r.team.toLowerCase().includes(pred.team.toLowerCase())
      );
      if (result) {
        pred.actualResult = result.scoredTD;
        updatedCount++;
      }
    });

    // Recalculate accuracy stats
    history.accuracyStats = this.calculateAccuracyStats(history.weeks);
    history.lastUpdated = new Date().toISOString();
    
    this.saveHistory(history);
    console.log(`✅ Updated ${updatedCount} actual results for Week ${week} ${year}`);
    console.log(`📊 Current Accuracy - Current Model: ${history.accuracyStats.currentModelStats.accuracy.toFixed(1)}%, ML Model: ${history.accuracyStats.mlModelStats.accuracy.toFixed(1)}%`);
  }

  private calculateAccuracyStats(weeks: WeeklyPrediction[]): PredictionAccuracyStats {
    let currentTotal = 0, currentCorrect = 0, currentTop5Correct = 0, currentTop10Correct = 0;
    let mlTotal = 0, mlCorrect = 0, mlTop5Correct = 0, mlTop10Correct = 0;
    let mlCorrectProbs: number[] = [], mlIncorrectProbs: number[] = [];

    weeks.forEach(week => {
      // Current model stats
      week.currentModelPredictions.forEach((pred, index) => {
        if (pred.actualResult !== undefined) {
          currentTotal++;
          if (pred.actualResult) {
            currentCorrect++;
            if (index < 5) currentTop5Correct++;
            if (index < 10) currentTop10Correct++;
          }
        }
      });

      // ML model stats
      week.mlModelPredictions.forEach((pred, index) => {
        if (pred.actualResult !== undefined) {
          mlTotal++;
          if (pred.actualResult) {
            mlCorrect++;
            if (index < 5) mlTop5Correct++;
            if (index < 10) mlTop10Correct++;
            mlCorrectProbs.push(pred.probability);
          } else {
            mlIncorrectProbs.push(pred.probability);
          }
        }
      });
    });

    return {
      currentModelStats: {
        totalPredictions: currentTotal,
        correctPredictions: currentCorrect,
        accuracy: currentTotal > 0 ? (currentCorrect / currentTotal) * 100 : 0,
        top5Accuracy: currentTotal > 0 ? (currentTop5Correct / Math.min(currentTotal, weeks.length * 5)) * 100 : 0,
        top10Accuracy: currentTotal > 0 ? (currentTop10Correct / Math.min(currentTotal, weeks.length * 10)) * 100 : 0
      },
      mlModelStats: {
        totalPredictions: mlTotal,
        correctPredictions: mlCorrect,
        accuracy: mlTotal > 0 ? (mlCorrect / mlTotal) * 100 : 0,
        top5Accuracy: mlTotal > 0 ? (mlTop5Correct / Math.min(mlTotal, weeks.length * 5)) * 100 : 0,
        top10Accuracy: mlTotal > 0 ? (mlTop10Correct / Math.min(mlTotal, weeks.length * 10)) * 100 : 0,
        avgProbabilityCorrect: mlCorrectProbs.length > 0 ? mlCorrectProbs.reduce((a, b) => a + b) / mlCorrectProbs.length : 0,
        avgProbabilityIncorrect: mlIncorrectProbs.length > 0 ? mlIncorrectProbs.reduce((a, b) => a + b) / mlIncorrectProbs.length : 0
      }
    };
  }

  getWeeklyReport(week: number, year: number): string {
    const history = this.loadHistory();
    const weekData = history.weeks.find(w => w.week === week && w.year === year);
    
    if (!weekData) {
      return `No predictions found for Week ${week} ${year}`;
    }

    const currentCorrect = weekData.currentModelPredictions.filter(p => p.actualResult === true).length;
    const currentTotal = weekData.currentModelPredictions.filter(p => p.actualResult !== undefined).length;
    const mlCorrect = weekData.mlModelPredictions.filter(p => p.actualResult === true).length;
    const mlTotal = weekData.mlModelPredictions.filter(p => p.actualResult !== undefined).length;

    return `
📊 Week ${week} ${year} Results:
Current Model: ${currentCorrect}/${currentTotal} correct (${currentTotal > 0 ? (currentCorrect/currentTotal*100).toFixed(1) : 0}%)
ML Model: ${mlCorrect}/${mlTotal} correct (${mlTotal > 0 ? (mlCorrect/mlTotal*100).toFixed(1) : 0}%)

✅ Successful Predictions:
${weekData.currentModelPredictions.filter(p => p.actualResult === true).map(p => `   ${p.player} (${p.team})`).join('\n')}
${weekData.mlModelPredictions.filter(p => p.actualResult === true).map(p => `   ${p.player} (${p.team}) - ${(p.probability*100).toFixed(1)}%`).join('\n')}
    `;
  }

  private loadHistory(): PredictionHistory {
    if (!fs.existsSync(this.historyFile)) {
      return {
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        weeks: [],
        accuracyStats: {
          currentModelStats: {
            totalPredictions: 0,
            correctPredictions: 0,
            accuracy: 0,
            top5Accuracy: 0,
            top10Accuracy: 0
          },
          mlModelStats: {
            totalPredictions: 0,
            correctPredictions: 0,
            accuracy: 0,
            top5Accuracy: 0,
            top10Accuracy: 0,
            avgProbabilityCorrect: 0,
            avgProbabilityIncorrect: 0
          }
        }
      };
    }

    return JSON.parse(fs.readFileSync(this.historyFile, 'utf8'));
  }

  private saveHistory(history: PredictionHistory): void {
    fs.writeFileSync(this.historyFile, JSON.stringify(history, null, 2));
  }

  exportAccuracyReport(): void {
    const history = this.loadHistory();
    const reportPath = path.join(this.dataDir, 'accuracy-report.json');
    
    const report = {
      generatedAt: new Date().toISOString(),
      totalWeeks: history.weeks.length,
      ...history.accuracyStats,
      weeklyBreakdown: history.weeks.map(week => {
        const currentCorrect = week.currentModelPredictions.filter(p => p.actualResult === true).length;
        const currentTotal = week.currentModelPredictions.filter(p => p.actualResult !== undefined).length;
        const mlCorrect = week.mlModelPredictions.filter(p => p.actualResult === true).length;
        const mlTotal = week.mlModelPredictions.filter(p => p.actualResult !== undefined).length;
        
        return {
          week: week.week,
          year: week.year,
          currentModelAccuracy: currentTotal > 0 ? (currentCorrect / currentTotal * 100) : 0,
          mlModelAccuracy: mlTotal > 0 ? (mlCorrect / mlTotal * 100) : 0,
          correctPredictions: {
            current: week.currentModelPredictions.filter(p => p.actualResult === true).map(p => p.player),
            ml: week.mlModelPredictions.filter(p => p.actualResult === true).map(p => p.player)
          }
        };
      })
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📈 Accuracy report exported to ${reportPath}`);
  }
}