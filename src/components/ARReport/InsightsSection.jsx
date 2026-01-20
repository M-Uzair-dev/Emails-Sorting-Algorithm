"use client";

import { generateInsights } from '../../utils/arInsightsUtils';

/**
 * Insights Section Component
 */
export default function InsightsSection({ currentRun, previousRun }) {
  if (!currentRun) {
    return null;
  }

  const insights = generateInsights(currentRun, previousRun);

  if (insights.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Key Insights</h2>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
        <div className="flex items-start gap-3 mb-4">
          <svg
            className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Automated Analysis
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Based on current AR data and historical trends
            </p>
          </div>
        </div>

        <ul className="space-y-3">
          {insights.map((insight, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold mt-0.5">
                {index + 1}
              </div>
              <p className="text-gray-800 leading-relaxed">{insight}</p>
            </li>
          ))}
        </ul>

        {/* Action Items */}
        <div className="mt-6 pt-6 border-t border-blue-200">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Recommended Actions
          </h4>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-orange-600">•</span>
              <span>Follow up with top 10 high-risk customers immediately</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-600">•</span>
              <span>Review and escalate accounts in the 90+ days bucket</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-600">•</span>
              <span>Monitor aging drift to prevent current invoices from becoming overdue</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
