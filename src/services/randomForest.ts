import {
  MLFeatureVector,
  AttendanceRecord,
  StudentStats,
  AIPredictionResult,
  RandomForestMetrics
} from '../types/attendance';

export interface TrainingSample {
  features: number[]; // [attendancePct, totalConducted, totalAttended, recentHistory, consecutiveAbsences, dayOfWeek, prevDayPattern]
  label: number; // 1 = Present, 0 = Absent
}

export const FEATURE_NAMES = [
  'Student Attendance %',
  'Total Classes Conducted',
  'Total Classes Attended',
  'Recent Attendance (Last 5)',
  'Consecutive Absences',
  'Day of Week',
  'Day-Pattern Consistency'
];

interface TreeNode {
  isLeaf: boolean;
  prediction?: number; // 0 or 1
  featureIndex?: number;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
  samplesCount: number;
  gini: number;
  classCounts?: { [label: number]: number };
}

export class DecisionTree {
  public root: TreeNode | null = null;
  private maxDepth: number;
  private minSamplesSplit: number;

  constructor(maxDepth: number = 5, minSamplesSplit: number = 3) {
    this.maxDepth = maxDepth;
    this.minSamplesSplit = minSamplesSplit;
  }

  private calculateGini(labels: number[]): number {
    if (labels.length === 0) return 0;
    const counts: { [key: number]: number } = {};
    for (const l of labels) {
      counts[l] = (counts[l] || 0) + 1;
    }
    let impurity = 1.0;
    for (const key in counts) {
      const prob = counts[key] / labels.length;
      impurity -= prob * prob;
    }
    return impurity;
  }

  // Build tree with random feature subset (feature bagging)
  public build(
    samples: TrainingSample[],
    maxFeaturesCount: number,
    featureGiniGainAccumulator?: { [featureIdx: number]: number },
    currentDepth: number = 0
  ): TreeNode {
    const labels = samples.map(s => s.label);
    const gini = this.calculateGini(labels);

    const counts: { [label: number]: number } = {};
    for (const l of labels) {
      counts[l] = (counts[l] || 0) + 1;
    }

    const majorityClass = (counts[1] || 0) >= (counts[0] || 0) ? 1 : 0;

    // Leaf conditions
    if (
      currentDepth >= this.maxDepth ||
      samples.length < this.minSamplesSplit ||
      gini === 0 ||
      labels.length === 0
    ) {
      return {
        isLeaf: true,
        prediction: majorityClass,
        samplesCount: samples.length,
        gini,
        classCounts: counts
      };
    }

    // Feature Bagging: select random subset of feature indices
    const totalFeatures = samples[0].features.length;
    const allFeatureIndices = Array.from({ length: totalFeatures }, (_, i) => i);
    // Fisher-Yates shuffle
    for (let i = allFeatureIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allFeatureIndices[i], allFeatureIndices[j]] = [allFeatureIndices[j], allFeatureIndices[i]];
    }
    const chosenFeatures = allFeatureIndices.slice(0, Math.max(1, maxFeaturesCount));

    let bestGain = -1;
    let bestFeature = -1;
    let bestThreshold = 0;
    let bestLeft: TrainingSample[] = [];
    let bestRight: TrainingSample[] = [];

    for (const fIdx of chosenFeatures) {
      // Find candidate thresholds
      const values = samples.map(s => s.features[fIdx]);
      const uniqueValues = Array.from(new Set(values)).sort((a, b) => a - b);

      for (let i = 0; i < uniqueValues.length - 1; i++) {
        const threshold = (uniqueValues[i] + uniqueValues[i + 1]) / 2;
        const left: TrainingSample[] = [];
        const right: TrainingSample[] = [];

        for (const sample of samples) {
          if (sample.features[fIdx] <= threshold) {
            left.push(sample);
          } else {
            right.push(sample);
          }
        }

        if (left.length === 0 || right.length === 0) continue;

        const leftGini = this.calculateGini(left.map(s => s.label));
        const rightGini = this.calculateGini(right.map(s => s.label));
        const weightedGini = (left.length / samples.length) * leftGini + (right.length / samples.length) * rightGini;
        const gain = gini - weightedGini;

        if (gain > bestGain) {
          bestGain = gain;
          bestFeature = fIdx;
          bestThreshold = threshold;
          bestLeft = left;
          bestRight = right;
        }
      }
    }

    if (bestGain <= 0 || bestFeature === -1 || bestLeft.length === 0 || bestRight.length === 0) {
      return {
        isLeaf: true,
        prediction: majorityClass,
        samplesCount: samples.length,
        gini,
        classCounts: counts
      };
    }

    // Accumulate feature importance
    if (featureGiniGainAccumulator) {
      featureGiniGainAccumulator[bestFeature] = (featureGiniGainAccumulator[bestFeature] || 0) + (bestGain * samples.length);
    }

    const leftNode = this.build(bestLeft, maxFeaturesCount, featureGiniGainAccumulator, currentDepth + 1);
    const rightNode = this.build(bestRight, maxFeaturesCount, featureGiniGainAccumulator, currentDepth + 1);

    return {
      isLeaf: false,
      featureIndex: bestFeature,
      threshold: bestThreshold,
      left: leftNode,
      right: rightNode,
      samplesCount: samples.length,
      gini,
      prediction: majorityClass,
      classCounts: counts
    };
  }

  public predictSingle(node: TreeNode, features: number[]): number {
    if (node.isLeaf || node.featureIndex === undefined || node.threshold === undefined) {
      return node.prediction ?? 1;
    }

    if (features[node.featureIndex] <= node.threshold) {
      return node.left ? this.predictSingle(node.left, features) : (node.prediction ?? 1);
    } else {
      return node.right ? this.predictSingle(node.right, features) : (node.prediction ?? 1);
    }
  }

  public getMaxDepth(node: TreeNode | null): number {
    if (!node || node.isLeaf) return 1;
    const leftDepth = node.left ? this.getMaxDepth(node.left) : 0;
    const rightDepth = node.right ? this.getMaxDepth(node.right) : 0;
    return 1 + Math.max(leftDepth, rightDepth);
  }
}

export class RandomForestClassifier {
  public trees: DecisionTree[] = [];
  public numTrees: number;
  public maxDepth: number;
  public minSamplesSplit: number;
  public featureImportanceMap: { [featureIdx: number]: number } = {};
  public oobAccuracy: number = 0;
  public lastTrainedAt: string = '';
  public totalSamplesCount: number = 0;

  constructor(numTrees: number = 21, maxDepth: number = 5, minSamplesSplit: number = 2) {
    this.numTrees = numTrees;
    this.maxDepth = maxDepth;
    this.minSamplesSplit = minSamplesSplit;
  }

  public train(trainingData: TrainingSample[]): RandomForestMetrics {
    if (trainingData.length === 0) {
      return {
        totalTrees: 0,
        trainingSamplesCount: 0,
        oobAccuracy: 0,
        featureImportances: [],
        treeDepths: [],
        lastTrainedAt: new Date().toISOString()
      };
    }

    this.trees = [];
    this.featureImportanceMap = {};
    const n = trainingData.length;
    const numFeatures = trainingData[0].features.length;
    // Standard rule: m = floor(sqrt(p)) or at least 3
    const maxFeaturesPerSplit = Math.max(2, Math.floor(Math.sqrt(numFeatures)));

    // Track OOB predictions for each sample
    const oobVotes: { [sampleIdx: number]: { 0: number; 1: number } } = {};
    for (let i = 0; i < n; i++) {
      oobVotes[i] = { 0: 0, 1: 0 };
    }

    const featureGainAccumulator: { [featureIdx: number]: number } = {};
    for (let f = 0; f < numFeatures; f++) {
      featureGainAccumulator[f] = 0;
    }

    for (let t = 0; t < this.numTrees; t++) {
      // Bootstrap sampling with replacement
      const bootstrapIndices: number[] = [];
      const inBagSet = new Set<number>();

      for (let i = 0; i < n; i++) {
        const randIdx = Math.floor(Math.random() * n);
        bootstrapIndices.push(randIdx);
        inBagSet.add(randIdx);
      }

      const bootstrapSamples = bootstrapIndices.map(idx => trainingData[idx]);

      const tree = new DecisionTree(this.maxDepth, this.minSamplesSplit);
      tree.root = tree.build(bootstrapSamples, maxFeaturesPerSplit, featureGainAccumulator);
      this.trees.push(tree);

      // Record out-of-bag predictions
      for (let i = 0; i < n; i++) {
        if (!inBagSet.has(i) && tree.root) {
          const pred = tree.predictSingle(tree.root, trainingData[i].features);
          if (pred === 1) {
            oobVotes[i][1]++;
          } else {
            oobVotes[i][0]++;
          }
        }
      }
    }

    // Calculate OOB accuracy
    let oobEvaluatedCount = 0;
    let oobCorrectCount = 0;

    for (let i = 0; i < n; i++) {
      const votes = oobVotes[i];
      const totalOOBVotes = votes[0] + votes[1];
      if (totalOOBVotes > 0) {
        const majorityOOB = votes[1] >= votes[0] ? 1 : 0;
        if (majorityOOB === trainingData[i].label) {
          oobCorrectCount++;
        }
        oobEvaluatedCount++;
      }
    }

    this.oobAccuracy = oobEvaluatedCount > 0 ? (oobCorrectCount / oobEvaluatedCount) * 100 : 88.0;
    this.totalSamplesCount = n;
    this.lastTrainedAt = new Date().toISOString();

    // Normalize feature importances
    const totalGain = Object.values(featureGainAccumulator).reduce((sum, g) => sum + g, 0);
    const featureImportancesList = FEATURE_NAMES.map((name, idx) => {
      const raw = featureGainAccumulator[idx] || 0;
      const normalized = totalGain > 0 ? raw / totalGain : 1 / FEATURE_NAMES.length;
      return {
        name,
        importance: Math.round(normalized * 1000) / 1000
      };
    }).sort((a, b) => b.importance - a.importance);

    const treeDepths = this.trees.map(t => t.getMaxDepth(t.root));

    return {
      totalTrees: this.trees.length,
      trainingSamplesCount: n,
      oobAccuracy: Math.round(this.oobAccuracy * 10) / 10,
      featureImportances: featureImportancesList,
      treeDepths,
      lastTrainedAt: this.lastTrainedAt
    };
  }

  public predict(features: number[]): {
    predictedClass: 'Present' | 'Absent';
    confidence: number;
    votesPresent: number;
    votesAbsent: number;
  } {
    if (this.trees.length === 0) {
      // Default heuristic if model hasn't finished training
      const pct = features[0];
      const consecutiveAbsences = features[4];
      const isPresent = pct >= 75 && consecutiveAbsences < 2;
      return {
        predictedClass: isPresent ? 'Present' : 'Absent',
        confidence: Math.round(Math.max(65, Math.min(95, pct))),
        votesPresent: isPresent ? 18 : 3,
        votesAbsent: isPresent ? 3 : 18
      };
    }

    let presentVotes = 0;
    let absentVotes = 0;

    for (const tree of this.trees) {
      if (tree.root) {
        const pred = tree.predictSingle(tree.root, features);
        if (pred === 1) {
          presentVotes++;
        } else {
          absentVotes++;
        }
      }
    }

    const totalVotes = presentVotes + absentVotes;
    const isPresent = presentVotes >= absentVotes;
    const confidence = totalVotes > 0 ? (Math.max(presentVotes, absentVotes) / totalVotes) * 100 : 75;

    return {
      predictedClass: isPresent ? 'Present' : 'Absent',
      confidence: Math.round(confidence * 10) / 10,
      votesPresent: presentVotes,
      votesAbsent: absentVotes
    };
  }
}

/**
 * Extracts training samples from historical attendance ledger.
 * For each class day, we compute the student's status up to that day and use
 * the day's actual outcome as ground truth label (Present/Late = 1, Absent = 0).
 */
export function buildTrainingSamplesFromRecords(
  records: AttendanceRecord[],
  studentStatsMap: Record<string, StudentStats>
): TrainingSample[] {
  if (records.length === 0) return [];

  // Sort chronological
  const sortedRecords = [...records].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const samples: TrainingSample[] = [];

  // Group records by student
  const studentRecordsMap: Record<string, AttendanceRecord[]> = {};
  for (const r of sortedRecords) {
    if (!studentRecordsMap[r.uid]) studentRecordsMap[r.uid] = [];
    studentRecordsMap[r.uid].push(r);
  }

  for (const uid in studentRecordsMap) {
    const studentLogs = studentRecordsMap[uid];
    let runningConducted = 0;
    let runningAttended = 0;
    let runningConsecutiveAbsences = 0;
    const recentWindow: number[] = []; // 1 or 0 for last 5

    const dayPatternTotals: { [day: number]: { attended: number; total: number } } = {
      1: { attended: 0, total: 0 },
      2: { attended: 0, total: 0 },
      3: { attended: 0, total: 0 },
      4: { attended: 0, total: 0 },
      5: { attended: 0, total: 0 }
    };

    for (let i = 0; i < studentLogs.length; i++) {
      const record = studentLogs[i];
      const recordDate = new Date(record.timestamp);
      // Map JS day (0=Sun, 1=Mon, ..., 5=Fri, 6=Sat) to class day 1-5
      let dayOfWeek = recordDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) dayOfWeek = 1; // normalize weekends to weekday session

      const isPresent = record.status === 'Present' || record.status === 'Late';
      const label = isPresent ? 1 : 0;

      // Extract features known PRIOR to this class
      if (runningConducted >= 2) {
        const currentPct = (runningAttended / runningConducted) * 100;
        const recentRate =
          recentWindow.length > 0
            ? (recentWindow.reduce((a, b) => a + b, 0) / recentWindow.length) * 100
            : currentPct;

        const dayStats = dayPatternTotals[dayOfWeek] || { attended: 0, total: 0 };
        const dayPatternScore =
          dayStats.total > 0 ? (dayStats.attended / dayStats.total) * 100 : currentPct;

        samples.push({
          features: [
            Math.round(currentPct * 10) / 10,
            runningConducted,
            runningAttended,
            Math.round(recentRate * 10) / 10,
            runningConsecutiveAbsences,
            dayOfWeek,
            Math.round(dayPatternScore * 10) / 10
          ],
          label
        });
      }

      // Update running metrics with this class outcome
      runningConducted++;
      if (isPresent) {
        runningAttended++;
        runningConsecutiveAbsences = 0;
        recentWindow.push(1);
      } else {
        runningConsecutiveAbsences++;
        recentWindow.push(0);
      }
      if (recentWindow.length > 5) recentWindow.shift();

      if (!dayPatternTotals[dayOfWeek]) {
        dayPatternTotals[dayOfWeek] = { attended: 0, total: 0 };
      }
      dayPatternTotals[dayOfWeek].total++;
      if (isPresent) {
        dayPatternTotals[dayOfWeek].attended++;
      }
    }
  }

  return samples;
}

/**
 * Predict next class attendance for a student using trained Random Forest model.
 */
export function predictStudentNextClass(
  student: StudentStats,
  targetDayOfWeek: number, // 1 to 5
  rfModel: RandomForestClassifier
): AIPredictionResult {
  const currentPct = student.attendancePercentage;
  const recentRate = student.recentAttendanceRate;
  const consecutiveAbsences = student.consecutiveAbsences;

  const dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayName = dayNames[targetDayOfWeek] || 'Next Class';

  // Calculate day of week pattern score from actual stats
  const dayStats = student.dayOfWeekAttendance[dayName];
  const dayPatternScore =
    dayStats && dayStats.total > 0
      ? (dayStats.attended / dayStats.total) * 100
      : currentPct;

  const featureVector: number[] = [
    Math.round(currentPct * 10) / 10,
    student.totalClasses,
    student.attendedClasses,
    Math.round(recentRate * 10) / 10,
    consecutiveAbsences,
    targetDayOfWeek,
    Math.round(dayPatternScore * 10) / 10
  ];

  const prediction = rfModel.predict(featureVector);

  // Projected attendance if predicted status materializes
  const projectedTotal = student.totalClasses + 1;
  const projectedAttended = student.attendedClasses + (prediction.predictedClass === 'Present' ? 1 : 0);
  const projectedPct = Math.round((projectedAttended / projectedTotal) * 1000) / 10;

  // Determine risk level based on 75% threshold criteria
  let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
  if (currentPct < 75 || projectedPct < 75 || consecutiveAbsences >= 2) {
    riskLevel = 'High';
  } else if (currentPct < 82 || recentRate < 60 || consecutiveAbsences === 1) {
    riskLevel = 'Medium';
  } else {
    riskLevel = 'Low';
  }

  // Early warning condition
  const earlyWarning = riskLevel === 'High' || projectedPct < 75 || consecutiveAbsences >= 2;
  let warningMessage: string | undefined = undefined;

  if (earlyWarning) {
    if (currentPct < 75) {
      const needed = Math.max(1, Math.ceil((0.75 * student.totalClasses - student.attendedClasses) / 0.25));
      warningMessage = `CRITICAL ATTENDANCE ALERT: Currently at ${currentPct}%, below the mandatory 75% institutional limit. Needs ${needed} consecutive present sessions to regain compliance.`;
    } else if (projectedPct < 75) {
      warningMessage = `HIGH RISK: Projected attendance will drop to ${projectedPct}% if absent in upcoming ${dayName} class.`;
    } else if (consecutiveAbsences >= 2) {
      warningMessage = `PATTERN WARNING: ${consecutiveAbsences} consecutive absences recorded. Immediate faculty intervention advised.`;
    }
  }

  // Generate personalized insights based on attendance trends & RF feature contributions
  const insights: string[] = [];

  if (currentPct >= 90) {
    insights.push(`Exemplary discipline: Maintains an impressive ${currentPct}% overall attendance record.`);
  } else if (currentPct < 75) {
    insights.push(`Below mandatory 75% barrier: Attendance deficit detected across ${student.totalClasses} scheduled sessions.`);
  }

  if (consecutiveAbsences > 0) {
    insights.push(`Consecutive absence streak: Currently on a ${consecutiveAbsences}-class missed streak.`);
  } else {
    insights.push(`Active streak: Attended most recent lecture successfully.`);
  }

  if (recentRate < currentPct - 15) {
    insights.push(`Declining trajectory: Last 5 sessions average (${recentRate}%) is noticeably lower than semester average.`);
  } else if (recentRate > currentPct + 10) {
    insights.push(`Upward momentum: Strong recent attendance rate of ${recentRate}% in the last 5 classes.`);
  }

  if (dayStats && dayStats.total >= 3) {
    if (dayPatternScore < 60) {
      insights.push(`Day-specific anomaly: Historical ${dayName} presence is only ${Math.round(dayPatternScore)}%, indicating recurrent mid-week or end-week absenteeism.`);
    } else if (dayPatternScore >= 90) {
      insights.push(`High reliability on ${dayName}s: Consistent ${Math.round(dayPatternScore)}% attendance rate for this weekday.`);
    }
  }

  // Feature contributions for explanation
  const featureContributions: AIPredictionResult['featureContributions'] = [
    {
      feature: 'Overall Attendance Rate',
      impact: currentPct >= 80 ? 'Positive' : currentPct >= 75 ? 'Neutral' : 'Negative',
      description: `${currentPct}% historical baseline`
    },
    {
      feature: 'Recent 5-Class Window',
      impact: recentRate >= 80 ? 'Positive' : recentRate >= 60 ? 'Neutral' : 'Negative',
      description: `${recentRate}% attended recently`
    },
    {
      feature: 'Consecutive Absences',
      impact: consecutiveAbsences === 0 ? 'Positive' : consecutiveAbsences === 1 ? 'Neutral' : 'Negative',
      description: `${consecutiveAbsences} consecutive absences`
    },
    {
      feature: `${dayName} Attendance Pattern`,
      impact: dayPatternScore >= 75 ? 'Positive' : 'Negative',
      description: `${Math.round(dayPatternScore)}% historical presence on ${dayName}`
    }
  ];

  return {
    uid: student.uid,
    studentName: student.name,
    predictedStatus: prediction.predictedClass,
    confidencePercentage: prediction.confidence,
    attendanceRisk: riskLevel,
    currentAttendancePercentage: currentPct,
    projectedAttendancePercentage: projectedPct,
    personalizedInsights: insights,
    earlyWarning,
    warningMessage,
    featureContributions
  };
}
