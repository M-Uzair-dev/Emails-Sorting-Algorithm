"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency } from '../../utils/arReportUtils';

/**
 * Custom Tooltip for Distribution Chart
 */
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum, entry) => sum + entry.value, 0);

    return (
      <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
        <p className="font-semibold mb-2">AR Distribution</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: entry.color }}
            />
            <span>{entry.name}:</span>
            <span className="font-semibold">{formatCurrency(entry.value)}</span>
            <span className="text-gray-600">
              ({((entry.value / total) * 100).toFixed(1)}%)
            </span>
          </div>
        ))}
        <div className="mt-2 pt-2 border-t border-gray-200">
          <span className="font-semibold">Total: {formatCurrency(total)}</span>
        </div>
      </div>
    );
  }
  return null;
};

/**
 * AR Distribution Stacked Bar Chart Component
 */
export default function ARDistributionChart({ currentRun }) {
  if (!currentRun || !currentRun.aging) {
    return null;
  }

  const data = [
    {
      name: 'Current Week AR',
      'Current': currentRun.aging.current.amount,
      '1-30 Days': currentRun.aging['1_30'].amount,
      '31-60 Days': currentRun.aging['31_60'].amount,
      '61-90 Days': currentRun.aging['61_90'].amount,
      '90+ Days': currentRun.aging['90_plus'].amount
    }
  ];

  const total = currentRun.summary.total_ar;

  // Calculate percentages
  const percentages = {
    current: ((currentRun.aging.current.amount / total) * 100).toFixed(1),
    '1_30': ((currentRun.aging['1_30'].amount / total) * 100).toFixed(1),
    '31_60': ((currentRun.aging['31_60'].amount / total) * 100).toFixed(1),
    '61_90': ((currentRun.aging['61_90'].amount / total) * 100).toFixed(1),
    '90_plus': ((currentRun.aging['90_plus'].amount / total) * 100).toFixed(1)
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">AR Distribution</h2>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
            <YAxis type="category" dataKey="name" />
            <Tooltip content={<CustomTooltip />} />

            <Bar dataKey="Current" stackId="a" fill="#3b82f6" />
            <Bar dataKey="1-30 Days" stackId="a" fill="#f97316" />
            <Bar dataKey="31-60 Days" stackId="a" fill="#fb923c" />
            <Bar dataKey="61-90 Days" stackId="a" fill="#ef4444" />
            <Bar dataKey="90+ Days" stackId="a" fill="#991b1b" />
          </BarChart>
        </ResponsiveContainer>

        {/* Distribution Summary */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="w-full h-2 bg-blue-500 rounded mb-2" />
            <p className="text-xs text-gray-600">Current</p>
            <p className="text-sm font-semibold text-gray-900">{percentages.current}%</p>
            <p className="text-xs text-gray-500">{formatCurrency(currentRun.aging.current.amount)}</p>
          </div>

          <div className="text-center">
            <div className="w-full h-2 bg-orange-500 rounded mb-2" />
            <p className="text-xs text-gray-600">1-30 Days</p>
            <p className="text-sm font-semibold text-gray-900">{percentages['1_30']}%</p>
            <p className="text-xs text-gray-500">{formatCurrency(currentRun.aging['1_30'].amount)}</p>
          </div>

          <div className="text-center">
            <div className="w-full h-2 bg-orange-400 rounded mb-2" />
            <p className="text-xs text-gray-600">31-60 Days</p>
            <p className="text-sm font-semibold text-gray-900">{percentages['31_60']}%</p>
            <p className="text-xs text-gray-500">{formatCurrency(currentRun.aging['31_60'].amount)}</p>
          </div>

          <div className="text-center">
            <div className="w-full h-2 bg-red-500 rounded mb-2" />
            <p className="text-xs text-gray-600">61-90 Days</p>
            <p className="text-sm font-semibold text-gray-900">{percentages['61_90']}%</p>
            <p className="text-xs text-gray-500">{formatCurrency(currentRun.aging['61_90'].amount)}</p>
          </div>

          <div className="text-center">
            <div className="w-full h-2 bg-red-800 rounded mb-2" />
            <p className="text-xs text-gray-600">90+ Days</p>
            <p className="text-sm font-semibold text-gray-900">{percentages['90_plus']}%</p>
            <p className="text-xs text-gray-500">{formatCurrency(currentRun.aging['90_plus'].amount)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
