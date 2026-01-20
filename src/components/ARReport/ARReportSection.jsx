"use client";

import { useState, useRef } from 'react';
import KPICards from './KPICards';
import ARDistributionChart from './ARDistributionChart';
import TopCustomersChart from './TopCustomersChart';
import InsightsSection from './InsightsSection';
import { calculateARMetrics } from '../../utils/arReportUtils';
import {
  initializeARHistory,
  readARHistoryFile,
  addRunToHistory,
  downloadARHistory,
  getPreviousRun
} from '../../utils/arHistoryUtils';

/**
 * AR Report Section Component
 */
export default function ARReportSection({ invoiceData }) {
  const [historyFile, setHistoryFile] = useState(null);
  const [arHistory, setARHistory] = useState(null);
  const [currentRun, setCurrentRun] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const reportRef = useRef(null);

  const handleHistoryFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setHistoryFile(null);
      return;
    }

    try {
      const history = await readARHistoryFile(file);
      setHistoryFile(file);
      setARHistory(history);
      console.log('AR history loaded:', history);
    } catch (error) {
      console.error('Error reading AR history file:', error);
      alert('Failed to read AR history file. Please check the file format.');
      setHistoryFile(null);
      setARHistory(null);
    }
  };

  const handleGenerateReport = async () => {
    if (!invoiceData || invoiceData.length === 0) {
      alert('No invoice data available. Please process files first.');
      return;
    }

    setIsGenerating(true);

    try {
      // Calculate current run metrics
      const currentRunData = calculateARMetrics(invoiceData);

      if (!currentRunData) {
        alert('Failed to calculate AR metrics from invoice data.');
        setIsGenerating(false);
        return;
      }

      setCurrentRun(currentRunData);

      // Initialize or update history
      let updatedHistory;
      if (arHistory) {
        updatedHistory = addRunToHistory(arHistory, currentRunData);
      } else {
        updatedHistory = initializeARHistory();
        updatedHistory = addRunToHistory(updatedHistory, currentRunData);
      }

      setARHistory(updatedHistory);
      setShowReport(true);

      console.log('AR Report generated:', {
        currentRun: currentRunData,
        history: updatedHistory
      });

      // Small delay to ensure DOM is rendered before scrolling
      setTimeout(() => {
        reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (error) {
      console.error('Error generating AR report:', error);
      alert('Failed to generate AR report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadJSON = () => {
    if (!arHistory) {
      alert('No history data available.');
      return;
    }

    const date = new Date().toISOString().split('T')[0];
    downloadARHistory(arHistory, `ar-history-${date}.json`);
  };

  const previousRun = arHistory ? getPreviousRun(arHistory) : null;

  return (
    <div className="mt-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              AR Report Generator
            </h2>
            <p className="text-sm text-gray-600">
              Generate comprehensive accounts receivable reports with insights and trends
            </p>
          </div>
          <svg
            className="w-12 h-12 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>

        {/* File Upload Section */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <label className="block mb-2">
            <span className="text-sm font-medium text-gray-700">
              Upload Previous AR History (Optional)
            </span>
            <span className="ml-2 text-xs text-gray-500">
              Upload your previous ar-history.json file to track trends
            </span>
          </label>

          <div className="flex items-center gap-4">
            <input
              type="file"
              accept=".json"
              onChange={handleHistoryFileChange}
              className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />

            {historyFile && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">Loaded</span>
              </div>
            )}
          </div>

          {arHistory && (
            <div className="mt-2 text-xs text-gray-600">
              {arHistory.runs.length} previous run(s) loaded
            </div>
          )}
        </div>

        {/* Generate Button */}
        <div className="flex gap-4">
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating || !invoiceData || invoiceData.length === 0}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              isGenerating || !invoiceData || invoiceData.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105 shadow-md'
            }`}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating Report...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Generate AR Report
              </>
            )}
          </button>

          {showReport && (
            <button
              onClick={handleDownloadJSON}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-all flex items-center gap-2 shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Download JSON
            </button>
          )}
        </div>
      </div>

      {/* Report Display */}
      {showReport && currentRun && (
        <div ref={reportRef} className="mt-8 space-y-6">
          {/* Report Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
            <h2 className="text-3xl font-bold mb-2">Accounts Receivable Report</h2>
            <p className="text-blue-100">
              Generated on {new Date(currentRun.run_timestamp).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          {/* KPI Cards */}
          <KPICards currentRun={currentRun} previousRun={previousRun} />

          {/* AR Distribution */}
          <ARDistributionChart currentRun={currentRun} />

          {/* Top Customers */}
          <TopCustomersChart currentRun={currentRun} />

          {/* Insights */}
          <InsightsSection currentRun={currentRun} previousRun={previousRun} />
        </div>
      )}
    </div>
  );
}
