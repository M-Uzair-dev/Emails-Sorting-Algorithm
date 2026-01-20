"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/arReportUtils';

/**
 * Custom Tooltip for Top Customers Chart
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const customer = payload[0].payload;
    const total = payload.reduce((sum, entry) => sum + entry.value, 0);

    return (
      <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3 max-w-xs">
        <p className="font-semibold mb-2">{label}</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Total Balance:</span>
            <span className="font-semibold">{formatCurrency(customer.total_balance)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Overdue Balance:</span>
            <span className="font-semibold text-red-600">{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Oldest Invoice:</span>
            <span className="font-semibold">{customer.oldest_invoice_days} days</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Concern Score:</span>
            <span className="font-semibold">{customer.concern_score.toFixed(0)}</span>
          </div>
        </div>

        {payload.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-xs font-semibold mb-1">Overdue Breakdown:</p>
            {payload.map((entry, index) => (
              entry.value > 0 && (
                <div key={index} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span>{entry.name}:</span>
                  <span className="font-semibold">{formatCurrency(entry.value)}</span>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    );
  }
  return null;
};

/**
 * Top Customers Chart Component
 */
export default function TopCustomersChart({ currentRun }) {
  if (!currentRun || !currentRun.top_customers || currentRun.top_customers.length === 0) {
    return null;
  }

  // Prepare data for stacked bar chart
  const data = currentRun.top_customers.slice(0, 10).map(customer => ({
    name: customer.name.length > 40 ? customer.name.substring(0, 40) + '...' : customer.name,
    fullName: customer.name,
    '1-30 Days': customer.aging_buckets['1_30'] || 0,
    '31-60 Days': customer.aging_buckets['31_60'] || 0,
    '61-90 Days': customer.aging_buckets['61_90'] || 0,
    '90+ Days': customer.aging_buckets['90_plus'] || 0,
    total_balance: customer.total_balance,
    overdue_balance: customer.overdue_balance,
    oldest_invoice_days: customer.oldest_invoice_days,
    concern_score: customer.concern_score
  }));

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Top 10 Customers by Risk</h2>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-sm text-gray-600 mb-4">
          Ranked by Concern Score (weighted by aging severity)
        </p>

        <ResponsiveContainer width="100%" height={600}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
            <YAxis type="category" dataKey="name" width={250} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            <Bar dataKey="1-30 Days" stackId="a" fill="#f97316" />
            <Bar dataKey="31-60 Days" stackId="a" fill="#fb923c" />
            <Bar dataKey="61-90 Days" stackId="a" fill="#ef4444" />
            <Bar dataKey="90+ Days" stackId="a" fill="#991b1b" />
          </BarChart>
        </ResponsiveContainer>

        {/* Legend for Concern Score */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs font-semibold text-gray-700 mb-1">Concern Score Formula:</p>
          <p className="text-xs text-gray-600">
            (1-30 days × 1) + (31-60 days × 2) + (61-90 days × 3) + (90+ days × 5)
          </p>
        </div>
      </div>
    </div>
  );
}
