import { calculateDelta, formatCurrency, formatPercent } from './arReportUtils';

/**
 * Generate automatic insights from AR data
 * @param {Object} currentRun - Current run data
 * @param {Object} previousRun - Previous run data (can be null)
 * @returns {Array<string>} Array of insight strings
 */
export function generateInsights(currentRun, previousRun) {
  const insights = [];

  if (!currentRun) {
    return insights;
  }

  // Insight 1: Total overdue change
  if (previousRun) {
    const delta = calculateDelta(
      currentRun.summary.total_overdue,
      previousRun.summary.total_overdue
    );

    if (delta.percent !== 0) {
      const direction = delta.percent > 0 ? 'increased' : 'decreased';
      const absDelta = Math.abs(delta.percent);

      // Find which buckets contributed most
      const bucketChanges = [];
      ['31_60', '61_90', '90_plus'].forEach(bucket => {
        const bucketDelta = calculateDelta(
          currentRun.aging[bucket].amount,
          previousRun.aging[bucket].amount
        );
        if (Math.abs(bucketDelta.percent) > 5) {
          bucketChanges.push({
            bucket,
            percent: bucketDelta.percent,
            name: getBucketName(bucket)
          });
        }
      });

      let insight = `Total overdue AR ${direction} by ${absDelta.toFixed(1)}% since last run`;
      if (bucketChanges.length > 0) {
        const topBuckets = bucketChanges
          .sort((a, b) => Math.abs(b.percent) - Math.abs(a.percent))
          .slice(0, 2)
          .map(b => b.name)
          .join(' and ');
        insight += `, primarily driven by ${topBuckets} buckets`;
      }
      insight += '.';

      insights.push(insight);
    }
  }

  // Insight 2: Top customers concentration
  if (currentRun.top_customers && currentRun.top_customers.length > 0) {
    const top5Overdue = currentRun.top_customers
      .slice(0, 5)
      .reduce((sum, c) => sum + c.overdue_balance, 0);
    const totalOverdue = currentRun.summary.total_overdue;

    if (totalOverdue > 0) {
      const concentration = Math.round((top5Overdue / totalOverdue) * 100);
      insights.push(
        `Top 5 customers account for ${concentration}% of total overdue AR.`
      );
    }
  }

  // Insight 3: Aging drift analysis
  if (previousRun) {
    const driftInsight = analyzeAgingDrift(currentRun, previousRun);
    if (driftInsight) {
      insights.push(driftInsight);
    }
  }

  // Insight 4: Critical customers warning
  const criticalCustomers = currentRun.top_customers.filter(
    c => c.aging_buckets['90_plus'] > 0
  );
  if (criticalCustomers.length > 0) {
    insights.push(
      `${criticalCustomers.length} of the top 10 customers have invoices overdue by 90+ days, requiring immediate attention.`
    );
  }

  // Insight 5: Overall AR health
  const overduePct = currentRun.summary.overdue_pct;
  let healthStatus = '';
  if (overduePct < 15) {
    healthStatus = 'healthy';
  } else if (overduePct < 30) {
    healthStatus = 'moderate';
  } else {
    healthStatus = 'concerning';
  }

  insights.push(
    `Overall AR health is ${healthStatus} with ${overduePct.toFixed(1)}% of total AR overdue.`
  );

  return insights;
}

/**
 * Analyze aging drift between two runs
 * @param {Object} currentRun - Current run data
 * @param {Object} previousRun - Previous run data
 * @returns {string|null} Drift insight or null
 */
function analyzeAgingDrift(currentRun, previousRun) {
  const buckets = ['1_30', '31_60', '61_90', '90_plus'];
  const drifts = [];

  buckets.forEach(bucket => {
    const delta = calculateDelta(
      currentRun.aging[bucket].amount,
      previousRun.aging[bucket].amount
    );

    if (Math.abs(delta.percent) > 10) {
      drifts.push({
        bucket,
        percent: delta.percent,
        name: getBucketName(bucket)
      });
    }
  });

  if (drifts.length === 0) {
    return null;
  }

  // Find the most significant drift
  const significantDrift = drifts.sort(
    (a, b) => Math.abs(b.percent) - Math.abs(a.percent)
  )[0];

  if (significantDrift.percent > 0) {
    // Money is moving into older buckets
    const olderBucket = getNextOlderBucket(significantDrift.bucket);
    if (olderBucket) {
      return `Aging drift shows money moving from ${getBucketName(
        significantDrift.bucket
      )} → ${getBucketName(olderBucket)}, indicating invoices are getting older.`;
    } else {
      return `Significant increase in ${significantDrift.name} bucket, indicating invoices are aging.`;
    }
  }

  return null;
}

/**
 * Get human-readable bucket name
 * @param {string} bucket - Bucket key
 * @returns {string} Bucket name
 */
function getBucketName(bucket) {
  const names = {
    current: 'Current',
    '1_30': '1-30 days',
    '31_60': '31-60 days',
    '61_90': '61-90 days',
    '90_plus': '90+ days'
  };
  return names[bucket] || bucket;
}

/**
 * Get the next older bucket
 * @param {string} bucket - Current bucket
 * @returns {string|null} Next older bucket or null
 */
function getNextOlderBucket(bucket) {
  const sequence = {
    current: '1_30',
    '1_30': '31_60',
    '31_60': '61_90',
    '61_90': '90_plus',
    '90_plus': null
  };
  return sequence[bucket] || null;
}
