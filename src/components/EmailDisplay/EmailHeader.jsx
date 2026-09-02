"use client";

import {
  copyEmailToClipboard,
  copyEmailBodySync,
  buildOutlookDeeplink,
  OUTLOOK_TAB_NAME
} from '../../utils/emailGenerationUtils';

/**
 * Email display header with navigation and actions
 * @param {Object} props - Component props
 * @param {string} props.currentPhase - Current phase (current/overdue)
 * @param {number} props.currentEmailIndex - Current email index
 * @param {number} props.totalEmails - Total number of emails
 * @param {number} props.overdueEmailsCount - Number of overdue emails
 * @param {Object} props.currentEmail - Current email object
 * @param {Function} props.onPrevious - Previous email handler
 * @param {Function} props.onNext - Next email handler
 * @param {Function} props.onMarkSentAndNext - Mark sent and next handler
 * @param {boolean} props.canGoBack - Whether can go back
 * @param {boolean} props.canGoNext - Whether can go next
 * @param {boolean} props.canMarkSent - Whether can mark as sent
 * @returns {JSX.Element} Email header component
 */
const EmailHeader = ({
  currentPhase,
  currentEmailIndex,
  totalEmails,
  overdueEmailsCount,
  currentEmail,
  onPrevious,
  onNext,
  onMarkSentAndNext,
  canGoBack,
  canGoNext,
  canMarkSent
}) => {
  const handleCopyEmail = async () => {
    const success = await copyEmailToClipboard(currentEmail);
    if (success) {
      alert("Email copied to clipboard with formatting!");
    } else {
      alert("Failed to copy email to clipboard.");
    }
  };

  const handleSendEmail = () => {
    if (!currentEmail?.customerEmail) {
      alert("No email address set for this customer.");
      return;
    }

    // Copy first, synchronously, so the click's gesture context survives the
    // window.open below. Outlook's compose deeplink can prefill To/CC/Subject
    // but not the body — URL params are plain text — so the body rides the
    // clipboard and the user pastes it with Ctrl+V.
    const copied = copyEmailBodySync(currentEmail.content);

    const outlookTab = window.open(
      buildOutlookDeeplink(currentEmail),
      OUTLOOK_TAB_NAME
    );

    if (!outlookTab) {
      alert(
        "Outlook couldn't open — allow popups for this site, then click Send again.\n\nThe email body is already on your clipboard."
      );
      return;
    }

    try {
      outlookTab.focus();
    } catch {
      // Focus can be refused by the browser; the tab still opened.
    }

    if (!copied) {
      alert(
        "Outlook opened, but copying the body failed.\n\nUse the Copy button, then paste into the message."
      );
    }
  };

  return (
    <div
      className={`px-8 py-6 border-b ${
        currentPhase === "current"
          ? "bg-gradient-to-r from-slate-50 to-blue-50 border-slate-200"
          : "bg-gradient-to-r from-slate-50 to-orange-50 border-slate-200"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2
            className={`text-3xl font-bold mb-1 ${
              currentPhase === "current"
                ? "text-gray-800"
                : "text-gray-800"
            }`}
          >
            {currentPhase === "current"
              ? "Current Invoice Emails"
              : "Overdue Invoice Emails"}
          </h2>
          <p className="text-gray-600">
            Email {currentEmailIndex + 1} of {totalEmails} customers
            {currentPhase === "current" &&
              overdueEmailsCount > 0 && (
                <span className="ml-2 text-sm">
                  • {overdueEmailsCount} overdue emails to follow
                </span>
              )}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCopyEmail}
            className="flex items-center px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 hover:scale-105 active:scale-95 transition-all font-medium shadow-sm border border-emerald-100"
            title="Copy email to clipboard"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Copy
          </button>

          <button
            onClick={handleSendEmail}
            className="flex items-center px-5 py-2.5 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 hover:scale-105 active:scale-95 transition-all font-medium shadow-sm border border-blue-100"
            title="Copy body and open Outlook with To, CC and Subject filled"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Send Email
          </button>

          <button
            onClick={onPrevious}
            disabled={!canGoBack}
            className="flex items-center px-5 py-2.5 text-white rounded-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-md hover:shadow-lg"
            style={{
              background: "linear-gradient(to right, #6366f1, #8b5cf6)",
            }}
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Previous
          </button>

          {currentPhase === "current" && canMarkSent && (
            <button
              onClick={onMarkSentAndNext}
              className="flex items-center px-5 py-2.5 text-white rounded-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-md hover:shadow-lg"
              style={{
                background: "linear-gradient(to right, #6366f1, #8b5cf6)",
              }}
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Sent & Next
            </button>
          )}

          <button
            onClick={onNext}
            disabled={!canGoNext}
            className="flex items-center px-5 py-2.5 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
            style={{
              background: "linear-gradient(to right, #6366f1, #8b5cf6)",
            }}
          >
            {currentEmailIndex === totalEmails - 1 &&
            currentPhase === "current" &&
            overdueEmailsCount > 0
              ? "Switch to Overdue"
              : "Next"}
            <svg
              className="w-4 h-4 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailHeader;