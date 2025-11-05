"use client";

import { useState } from "react";
import { processWIPFile, downloadWIPFile } from "../../utils/wipFileUtils";
import Button from "../UI/Button";

/**
 * WIP File Processor Component
 * Allows users to upload a WIP Excel file and automatically adds status labels
 * @param {Object} props - Component props
 * @param {Array} props.noContactCustomers - Array of no-contact customer names
 * @param {Array} props.reminderSentCustomers - Array of customers with reminders already sent
 * @returns {JSX.Element} WIP file processor component
 */
const WIPFileProcessor = ({ noContactCustomers = [], reminderSentCustomers = [] }) => {
  const [wipFile, setWipFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState(null);
  const [processedWorkbook, setProcessedWorkbook] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setWipFile(file);
      setProcessResult(null);
      setProcessedWorkbook(null);
    }
  };

  const handleProcessFile = async () => {
    if (!wipFile) {
      alert("Please select a WIP file first");
      return;
    }

    setIsProcessing(true);
    setProcessResult(null);

    try {
      const result = await processWIPFile(
        wipFile,
        noContactCustomers,
        reminderSentCustomers
      );

      setProcessedWorkbook(result.workbook);
      setProcessResult({
        success: true,
        message: result.message,
        updatedCount: result.updatedCount,
      });
    } catch (error) {
      setProcessResult({
        success: false,
        message: `Error processing file: ${error.message}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (processedWorkbook && wipFile) {
      downloadWIPFile(processedWorkbook, wipFile.name);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            WIP File Status Updater
          </h2>
          <p className="text-sm text-gray-600">
            Upload your WIP file to automatically add customer status labels
          </p>
        </div>
      </div>

      {/* File Upload */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload WIP Excel File (Collection Notes Sheet)
        </label>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:border-purple-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
        />
        {wipFile && (
          <p className="mt-2 text-sm text-gray-600">
            Selected: <span className="font-medium">{wipFile.name}</span>
          </p>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex gap-2">
          <svg
            className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">What this does:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>
                Adds "No Contact Customer" label for all no-contact customers (
                {noContactCustomers.length} found)
              </li>
              <li>
                Adds "Reminder Already Sent" label for current invoices already
                sent ({reminderSentCustomers.length} found)
              </li>
              <li>Labels are added in the column next to "Sum of Open Balance"</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Process Button */}
      <div className="flex gap-3">
        <Button
          onClick={handleProcessFile}
          disabled={!wipFile || isProcessing}
          loading={isProcessing}
          variant="primary"
          size="md"
        >
          {isProcessing ? "Processing..." : "Process File"}
        </Button>

        {processedWorkbook && (
          <Button onClick={handleDownload} variant="success" size="md">
            Download Updated File
          </Button>
        )}
      </div>

      {/* Result Message */}
      {processResult && (
        <div
          className={`mt-4 p-4 rounded-lg ${
            processResult.success
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <p
            className={`text-sm font-medium ${
              processResult.success ? "text-green-800" : "text-red-800"
            }`}
          >
            {processResult.message}
          </p>
          {processResult.success && processResult.updatedCount > 0 && (
            <p className="text-sm text-green-700 mt-1">
              Click "Download Updated File" to get your processed file
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default WIPFileProcessor;
