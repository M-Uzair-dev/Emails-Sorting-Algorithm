"use client";

import { formatCurrency, calculateDelta, formatPercent } from '../../utils/arReportUtils';

/**
 * Individual KPI Card Component
 */
const KPICard = ({ title, value, delta, color, icon }) => {
  const hasPositiveDelta = delta && delta.percent > 0;
  const hasNegativeDelta = delta && delta.percent < 0;
  const deltaColor = hasPositiveDelta ? 'text-red-600' : hasNegativeDelta ? 'text-green-600' : 'text-gray-600';

  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    red: 'bg-red-50 border-red-200',
    orange: 'bg-orange-50 border-orange-200',
    darkred: 'bg-red-100 border-red-300'
  };

  const iconColorClasses = {
    blue: 'text-blue-600',
    red: 'text-red-600',
    orange: 'text-orange-600',
    darkred: 'text-red-700'
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-4 transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        <div className={`${iconColorClasses[color]}`}>{icon}</div>
      </div>

      <div className="mt-2">
        <p className="text-2xl font-bold text-gray-900">{formatCurrency(value)}</p>

        {delta && (
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className={`font-medium ${deltaColor}`}>
              {hasPositiveDelta && '↑'} {hasNegativeDelta && '↓'} {formatPercent(delta.percent)}
            </span>
            <span className="text-gray-600">
              ({hasPositiveDelta ? '+' : ''}{formatCurrency(delta.absolute)})
            </span>
          </div>
        )}

        {!delta && <div className="mt-2 text-sm text-gray-500">No previous data</div>}
      </div>
    </div>
  );
};

/**
 * KPI Cards Grid Component
 */
export default function KPICards({ currentRun, previousRun }) {
  if (!currentRun) {
    return null;
  }

  const totalARDelta = previousRun
    ? calculateDelta(currentRun.summary.total_ar, previousRun.summary.total_ar)
    : null;

  const totalOverdueDelta = previousRun
    ? calculateDelta(currentRun.summary.total_overdue, previousRun.summary.total_overdue)
    : null;

  const bucket1_30Delta = previousRun
    ? calculateDelta(currentRun.aging['1_30'].amount, previousRun.aging['1_30'].amount)
    : null;

  const bucket31_60Delta = previousRun
    ? calculateDelta(currentRun.aging['31_60'].amount, previousRun.aging['31_60'].amount)
    : null;

  const bucket61_90Delta = previousRun
    ? calculateDelta(currentRun.aging['61_90'].amount, previousRun.aging['61_90'].amount)
    : null;

  const bucket90PlusDelta = previousRun
    ? calculateDelta(currentRun.aging['90_plus'].amount, previousRun.aging['90_plus'].amount)
    : null;

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Key Performance Indicators</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          title="Total AR"
          value={currentRun.summary.total_ar}
          delta={totalARDelta}
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <KPICard
          title="Total Overdue"
          value={currentRun.summary.total_overdue}
          delta={totalOverdueDelta}
          color="red"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />

        <KPICard
          title="1-30 Days"
          value={currentRun.aging['1_30'].amount}
          delta={bucket1_30Delta}
          color="orange"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <KPICard
          title="31-60 Days"
          value={currentRun.aging['31_60'].amount}
          delta={bucket31_60Delta}
          color="orange"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <KPICard
          title="61-90 Days"
          value={currentRun.aging['61_90'].amount}
          delta={bucket61_90Delta}
          color="red"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />

        <KPICard
          title="90+ Days"
          value={currentRun.aging['90_plus'].amount}
          delta={bucket90PlusDelta}
          color="darkred"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
      </div>
    </div>
  );
}
