"use client";

import { useEffect, useState } from 'react';

/**
 * Application header component
 * @returns {JSX.Element} Header component
 */
const Header = () => {
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    // Check if QuickBooks connection was successful
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('qbo_connected') === 'true') {
      setShowSuccessMessage(true);
      // Remove the query parameter
      window.history.replaceState({}, '', window.location.pathname);
      // Hide message after 5 seconds
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
  }, []);

  const handleConnectQuickBooks = () => {
    window.location.href = '/api/quickbooks/auth';
  };

  return (
    <div className="mb-8">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">QuickBooks connected successfully! Check console for customer data.</span>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 relative">
        {/* Connect QuickBooks Button - Top Right */}
        <div className="absolute top-4 right-4">
          <button
            onClick={handleConnectQuickBooks}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Connect QuickBooks
          </button>
        </div>

        {/* Header Content */}
        <div className="text-center pr-40">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Invoice Email Generator
          </h1>
          <p className="text-sm text-gray-600">
            Generate professional customer emails with invoice details
          </p>
        </div>
      </div>
    </div>
  );
};

export default Header;