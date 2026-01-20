import { categorizeInvoicesByAge, getCustomerName } from './invoiceUtils';

/**
 * Calculate ConcernScore for a customer based on aging buckets
 * Formula: B1*1 + B2*2 + B3*3 + B4*5
 * @param {Object} buckets - Aging buckets {1_30, 31_60, 61_90, 90_plus}
 * @returns {number} ConcernScore
 */
export function calculateConcernScore(buckets) {
  const b1 = buckets['1_30'] || 0;
  const b2 = buckets['31_60'] || 0;
  const b3 = buckets['61_90'] || 0;
  const b4 = buckets['90_plus'] || 0;

  return b1 * 1 + b2 * 2 + b3 * 3 + b4 * 5;
}

/**
 * Calculate AR metrics from invoice data
 * @param {Array} invoices - All invoices (including no-contact customers)
 * @returns {Object} AR run data
 */
export function calculateARMetrics(invoices) {
  if (!invoices || invoices.length === 0) {
    return null;
  }

  // Group invoices by customer
  const customerGroups = {};
  invoices.forEach(invoice => {
    const customerName = getCustomerName(invoice);
    if (!customerName) return;

    if (!customerGroups[customerName]) {
      customerGroups[customerName] = [];
    }
    customerGroups[customerName].push(invoice);
  });

  // Initialize aging buckets
  const aging = {
    current: { amount: 0, count: 0 },
    '1_30': { amount: 0, count: 0 },
    '31_60': { amount: 0, count: 0 },
    '61_90': { amount: 0, count: 0 },
    '90_plus': { amount: 0, count: 0 }
  };

  let totalAR = 0;
  let totalOverdue = 0;
  let overdueCount = 0;

  // Process each customer and calculate metrics
  const customerMetrics = [];

  Object.entries(customerGroups).forEach(([customerName, customerInvoices]) => {
    const categorized = categorizeInvoicesByAge(customerInvoices);

    let customerTotalBalance = 0;
    let customerOverdueBalance = 0;
    let oldestInvoiceDays = 0;

    // Calculate customer-level metrics and aging buckets
    const customerBuckets = {
      '1_30': 0,
      '31_60': 0,
      '61_90': 0,
      '90_plus': 0
    };

    // Current invoices
    categorized.current.forEach(inv => {
      const amount = parseFloat(inv.Amount) || 0;
      aging.current.amount += amount;
      aging.current.count += 1;
      customerTotalBalance += amount;
      totalAR += amount;
    });

    // 1-30 days
    categorized.days1to30.forEach(inv => {
      const amount = parseFloat(inv.Amount) || 0;
      aging['1_30'].amount += amount;
      aging['1_30'].count += 1;
      customerTotalBalance += amount;
      customerOverdueBalance += amount;
      customerBuckets['1_30'] += amount;
      totalAR += amount;
      totalOverdue += amount;
      overdueCount += 1;
      oldestInvoiceDays = Math.max(oldestInvoiceDays, inv.daysPastDue || 0);
    });

    // 31-60 days
    categorized.days31to60.forEach(inv => {
      const amount = parseFloat(inv.Amount) || 0;
      aging['31_60'].amount += amount;
      aging['31_60'].count += 1;
      customerTotalBalance += amount;
      customerOverdueBalance += amount;
      customerBuckets['31_60'] += amount;
      totalAR += amount;
      totalOverdue += amount;
      overdueCount += 1;
      oldestInvoiceDays = Math.max(oldestInvoiceDays, inv.daysPastDue || 0);
    });

    // 61-90 days
    categorized.days61to90.forEach(inv => {
      const amount = parseFloat(inv.Amount) || 0;
      aging['61_90'].amount += amount;
      aging['61_90'].count += 1;
      customerTotalBalance += amount;
      customerOverdueBalance += amount;
      customerBuckets['61_90'] += amount;
      totalAR += amount;
      totalOverdue += amount;
      overdueCount += 1;
      oldestInvoiceDays = Math.max(oldestInvoiceDays, inv.daysPastDue || 0);
    });

    // 90+ days
    categorized.days91Plus.forEach(inv => {
      const amount = parseFloat(inv.Amount) || 0;
      aging['90_plus'].amount += amount;
      aging['90_plus'].count += 1;
      customerTotalBalance += amount;
      customerOverdueBalance += amount;
      customerBuckets['90_plus'] += amount;
      totalAR += amount;
      totalOverdue += amount;
      overdueCount += 1;
      oldestInvoiceDays = Math.max(oldestInvoiceDays, inv.daysPastDue || 0);
    });

    // Only add customers with non-zero balance
    if (customerTotalBalance > 0) {
      const concernScore = calculateConcernScore(customerBuckets);

      customerMetrics.push({
        customer_id: customerName,
        name: customerName,
        total_balance: Math.round(customerTotalBalance * 100) / 100,
        overdue_balance: Math.round(customerOverdueBalance * 100) / 100,
        oldest_invoice_days: oldestInvoiceDays,
        concern_score: Math.round(concernScore * 100) / 100,
        aging_buckets: customerBuckets
      });
    }
  });

  // Sort by ConcernScore and get top 10
  const topCustomers = customerMetrics
    .sort((a, b) => b.concern_score - a.concern_score)
    .slice(0, 10);

  // Round amounts
  aging.current.amount = Math.round(aging.current.amount * 100) / 100;
  aging['1_30'].amount = Math.round(aging['1_30'].amount * 100) / 100;
  aging['31_60'].amount = Math.round(aging['31_60'].amount * 100) / 100;
  aging['61_90'].amount = Math.round(aging['61_90'].amount * 100) / 100;
  aging['90_plus'].amount = Math.round(aging['90_plus'].amount * 100) / 100;

  totalAR = Math.round(totalAR * 100) / 100;
  totalOverdue = Math.round(totalOverdue * 100) / 100;

  const overduePct = totalAR > 0 ? Math.round((totalOverdue / totalAR) * 1000) / 10 : 0;

  return {
    run_id: new Date().toISOString().split('T')[0],
    run_timestamp: new Date().toISOString(),
    summary: {
      total_ar: totalAR,
      total_overdue: totalOverdue,
      overdue_pct: overduePct,
      overdue_count: overdueCount
    },
    aging,
    top_customers: topCustomers
  };
}

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format percentage for display
 * @param {number} percent - Percentage to format
 * @returns {string} Formatted percentage string
 */
export function formatPercent(percent) {
  return `${percent >= 0 ? '+' : ''}${percent.toFixed(1)}%`;
}

/**
 * Calculate delta between current and previous run
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {Object} Delta info {absolute, percent}
 */
export function calculateDelta(current, previous) {
  if (!previous || previous === 0) {
    return { absolute: current, percent: 0 };
  }

  const absolute = current - previous;
  const percent = (absolute / previous) * 100;

  return {
    absolute: Math.round(absolute * 100) / 100,
    percent: Math.round(percent * 10) / 10
  };
}
