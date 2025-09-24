"use client";

import EmailHeader from './EmailHeader';
import EmailStats from './EmailStats';
import EmailContactInfo from './EmailContactInfo';
import EmailContent from './EmailContent';

/**
 * Complete email display section
 * @param {Object} props - Component props
 * @param {Array} props.processedEmails - Array of processed emails
 * @param {number} props.currentEmailIndex - Current email index
 * @param {string} props.currentPhase - Current phase (current/overdue)
 * @param {number} props.overdueEmailsCount - Number of overdue emails
 * @param {string} props.emailSignature - Email signature HTML
 * @param {Function} props.onPrevious - Previous email handler
 * @param {Function} props.onNext - Next email handler
 * @param {Function} props.onMarkSentAndNext - Mark sent and next handler
 * @returns {JSX.Element} Email display section component
 */
const EmailDisplaySection = ({
  processedEmails,
  currentEmailIndex,
  currentPhase,
  overdueEmailsCount,
  emailSignature,
  onPrevious,
  onNext,
  onMarkSentAndNext
}) => {
  if (processedEmails.length === 0) return null;

  const currentEmail = processedEmails[currentEmailIndex];
  if (!currentEmail) return null;

  // Navigation logic
  const canGoBack = currentEmailIndex > 0 || (currentPhase === "overdue");
  const canGoNext = currentEmailIndex < processedEmails.length - 1 || (currentPhase === "current" && overdueEmailsCount > 0);
  const canMarkSent = currentPhase === "current" && (currentEmailIndex < processedEmails.length - 1 || overdueEmailsCount > 0);

  return (
    <div
      className={`rounded-2xl shadow-2xl border overflow-hidden ${
        currentPhase === "current"
          ? "bg-white border-gray-100"
          : "bg-white border-gray-100"
      }`}
    >
      {/* Email Header with Navigation */}
      <EmailHeader
        currentPhase={currentPhase}
        currentEmailIndex={currentEmailIndex}
        totalEmails={processedEmails.length}
        overdueEmailsCount={overdueEmailsCount}
        currentEmail={currentEmail}
        onPrevious={onPrevious}
        onNext={onNext}
        onMarkSentAndNext={onMarkSentAndNext}
        canGoBack={canGoBack}
        canGoNext={canGoNext}
        canMarkSent={canMarkSent}
      />

      {/* Email Stats */}
      <EmailStats
        currentPhase={currentPhase}
        email={currentEmail}
      />

      {/* Email Contact Info */}
      <EmailContactInfo
        currentPhase={currentPhase}
        email={currentEmail}
      />

      {/* Email Content */}
      <EmailContent
        email={currentEmail}
        emailSignature={emailSignature}
      />
    </div>
  );
};

export default EmailDisplaySection;