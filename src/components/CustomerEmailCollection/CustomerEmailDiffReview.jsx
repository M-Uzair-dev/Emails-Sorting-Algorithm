"use client";

import { useState } from "react";
import { parseEmailList } from "../../utils/customerDiffUtils";

/**
 * Renders one address field as a stacked list, so multi-address values
 * stay readable instead of running off the edge of the row.
 */
const EmailList = ({ value, tone }) => {
  const addresses = parseEmailList(value);

  if (addresses.length === 0) {
    return <span className="text-xs text-gray-400 italic">none</span>;
  }

  return (
    <div className="space-y-0.5">
      {addresses.map((address, index) => (
        <div key={index} className={`text-xs break-all ${tone}`}>
          {address}
        </div>
      ))}
    </div>
  );
};

/**
 * Review panel for customer email changes detected in a QuickBooks export.
 * Nothing is applied until the user confirms; CC values are never modified.
 *
 * @param {Object} props - Component props
 * @param {Object} props.diff - Diff from buildCustomerEmailDiff
 * @param {Function} props.onApply - Called with the approved entries
 * @param {Function} props.onSkip - Called when all changes are declined
 * @returns {JSX.Element} Diff review component
 */
const CustomerEmailDiffReview = ({ diff, onApply, onSkip }) => {
  const { changed = [], added = [], keptNotInQuickBooks = [], unchangedCount = 0 } = diff || {};

  // Default to approving everything — these are genuine QuickBooks updates,
  // and unticking the rare exception is faster than ticking the rest.
  const [approved, setApproved] = useState(() => {
    const initial = {};
    changed.forEach((entry) => { initial[`changed:${entry.customerName}`] = true; });
    added.forEach((entry) => { initial[`added:${entry.customerName}`] = true; });
    return initial;
  });

  const [showKept, setShowKept] = useState(false);

  const toggle = (id) => setApproved((prev) => ({ ...prev, [id]: !prev[id] }));

  const setAll = (value) => {
    const next = {};
    changed.forEach((entry) => { next[`changed:${entry.customerName}`] = value; });
    added.forEach((entry) => { next[`added:${entry.customerName}`] = value; });
    setApproved(next);
  };

  const approvedCount = Object.values(approved).filter(Boolean).length;
  const totalCount = changed.length + added.length;

  const handleApply = () => {
    const entries = [
      ...changed.filter((e) => approved[`changed:${e.customerName}`]),
      ...added.filter((e) => approved[`added:${e.customerName}`]),
    ];
    onApply(entries);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-100 mb-6">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              Customer Email Changes
            </h2>
            <p className="text-xs text-gray-600">
              Compared against your QuickBooks export. Nothing is applied until you continue.
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs text-gray-500">To review</div>
            <div className="text-sm font-bold text-gray-900">
              {totalCount}
            </div>
          </div>
        </div>

        {/* Summary counters */}
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
            {unchangedCount} unchanged
          </span>
          {changed.length > 0 && (
            <span className="text-xs px-2 py-1 rounded-md bg-amber-50 text-amber-700 font-medium">
              {changed.length} updated in QuickBooks
            </span>
          )}
          {added.length > 0 && (
            <span className="text-xs px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 font-medium">
              {added.length} new this week
            </span>
          )}
          {keptNotInQuickBooks.length > 0 && (
            <button
              onClick={() => setShowKept(!showKept)}
              className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-600 font-medium hover:bg-slate-200 transition-colors"
            >
              {keptNotInQuickBooks.length} not in QuickBooks (kept) {showKept ? "▲" : "▼"}
            </button>
          )}
        </div>

        {showKept && (
          <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-gray-600 mb-2">
              These stay exactly as they are — nothing is deleted or overwritten.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {keptNotInQuickBooks.map((name) => (
                <span key={name} className="text-xs px-2 py-0.5 bg-white border border-slate-200 rounded text-gray-700">
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Select all / none */}
      {totalCount > 0 && (
        <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-3">
          <button
            onClick={() => setAll(true)}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            Select all
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={() => setAll(false)}
            className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            Select none
          </button>
          <span className="text-xs text-gray-500 ml-auto">
            {approvedCount} of {totalCount} selected
          </span>
        </div>
      )}

      {/* Changed rows */}
      <div className="divide-y divide-gray-100">
        {changed.map((entry) => {
          const id = `changed:${entry.customerName}`;
          const isOn = !!approved[id];

          return (
            <label
              key={id}
              className={`flex gap-3 p-4 cursor-pointer transition-colors ${
                isOn ? "bg-white" : "bg-gray-50"
              } hover:bg-slate-50`}
            >
              <input
                type="checkbox"
                checked={isOn}
                onChange={() => toggle(id)}
                className="mt-1 w-4 h-4 accent-blue-600 shrink-0 cursor-pointer"
              />

              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-gray-900 mb-2">
                  {entry.customerName}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-gray-500 mb-1">Current</div>
                    <EmailList value={entry.currentEmail} tone="text-gray-500 line-through" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-emerald-700 mb-1">QuickBooks</div>
                    <EmailList value={entry.quickBooksEmail} tone="text-emerald-700 font-medium" />
                  </div>
                </div>

                {entry.cc && (
                  <div className="mt-2 text-xs text-gray-500">
                    CC preserved: <span className="text-gray-700">{entry.cc}</span>
                  </div>
                )}
              </div>
            </label>
          );
        })}

        {/* Added rows */}
        {added.map((entry) => {
          const id = `added:${entry.customerName}`;
          const isOn = !!approved[id];

          return (
            <label
              key={id}
              className={`flex gap-3 p-4 cursor-pointer transition-colors ${
                isOn ? "bg-white" : "bg-gray-50"
              } hover:bg-slate-50`}
            >
              <input
                type="checkbox"
                checked={isOn}
                onChange={() => toggle(id)}
                className="mt-1 w-4 h-4 accent-emerald-600 shrink-0 cursor-pointer"
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {entry.customerName}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                    new
                  </span>
                </div>
                <div className="text-xs font-medium text-emerald-700 mb-1">QuickBooks</div>
                <EmailList value={entry.quickBooksEmail} tone="text-emerald-700 font-medium" />
              </div>
            </label>
          );
        })}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3 sm:justify-end">
        <button
          onClick={onSkip}
          className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 active:scale-95 transition-all"
        >
          Skip all changes
        </button>
        <button
          onClick={handleApply}
          className="px-5 py-2.5 rounded-xl text-white font-medium shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
          style={{ background: "linear-gradient(to right, #6366f1, #8b5cf6)" }}
        >
          {approvedCount > 0
            ? `Apply ${approvedCount} and continue`
            : "Continue without changes"}
        </button>
      </div>
    </div>
  );
};

export default CustomerEmailDiffReview;
