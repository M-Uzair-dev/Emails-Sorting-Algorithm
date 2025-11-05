"use client";

import CustomerEmailForm from './CustomerEmailForm';
import EmailCollectionNavigation from './EmailCollectionNavigation';
import { isValidURL } from '../../utils/invoiceUtils';

/**
 * Main email collection phase component
 * @param {Object} props - Component props
 * @param {Array} props.customersList - Array of customer names
 * @param {number} props.currentCustomerIndex - Current customer index
 * @param {Object} props.customerEmailData - Customer email data object
 * @param {Object} props.groupedInvoices - Grouped invoices by customer
 * @param {Object} props.invoiceLinksData - Pre-loaded invoice links
 * @param {Function} props.onCustomerEmailDataChange - Email data change handler
 * @param {Function} props.onPrevious - Previous customer handler
 * @param {Function} props.onNext - Next customer handler
 * @returns {JSX.Element} Email collection phase component
 */
const EmailCollectionPhase = ({
  customersList,
  currentCustomerIndex,
  customerEmailData,
  groupedInvoices,
  invoiceLinksData,
  onCustomerEmailDataChange,
  onPrevious,
  onNext
}) => {
  const currentCustomer = customersList[currentCustomerIndex];
  const currentCustomerData = customerEmailData[currentCustomer] || {};
  const customerInvoices = groupedInvoices[currentCustomer] || [];

  // Count pre-filled emails
  const preFilledCount = Object.keys(customerEmailData).filter(
    (key) => customerEmailData[key]?.email
  ).length;

  // Validation for current customer
  const hasEmail = currentCustomerData.email && currentCustomerData.email.trim() !== "";

  const hasAllInvoiceLinks = customerInvoices.every(invoice => {
    const invoiceNum = invoice.Num || invoice.num || invoice.Number || invoice.number || "";
    const link = currentCustomerData?.invoiceLinks?.[invoiceNum] || invoiceLinksData[invoiceNum] || "";
    return link && link.trim() !== "" && isValidURL(link.trim());
  });

  const canProceed = hasEmail && hasAllInvoiceLinks;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleNext = () => {
    if (!hasEmail) {
      alert("Please enter an email for this customer");
      return;
    }

    // Validate all invoice links
    const missingLinks = [];
    const invalidLinks = [];

    customerInvoices.forEach(invoice => {
      const invoiceNum = invoice.Num || invoice.num || invoice.Number || invoice.number || "";
      const link = currentCustomerData?.invoiceLinks?.[invoiceNum] || invoiceLinksData[invoiceNum] || "";

      if (!link || link.trim() === "") {
        missingLinks.push(invoiceNum);
      } else if (!isValidURL(link.trim())) {
        invalidLinks.push(invoiceNum);
      }
    });

    if (missingLinks.length > 0) {
      alert(`Please provide links for the following invoices: ${missingLinks.join(", ")}`);
      return;
    }

    if (invalidLinks.length > 0) {
      alert(`Please provide valid URLs for the following invoices: ${invalidLinks.join(", ")}`);
      return;
    }

    onNext();
  };

  const isPreFilled = currentCustomerData.email;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-100 mb-6">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              Customer Email Setup
            </h2>
            <p className="text-xs text-gray-600">
              Configure email addresses for invoice delivery
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Progress</div>
            <div className="text-sm font-bold text-gray-900">
              {currentCustomerIndex + 1} of {customersList.length}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {preFilledCount} pre-filled
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Customer Header */}
        <div className="mb-4">
          <div className="flex items-center justify-center w-10 h-10 bg-gray-900 rounded-full mx-auto mb-3">
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-gray-900">
              {currentCustomer}
            </h3>
            <button
              onClick={() => copyToClipboard(currentCustomer)}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Copy customer name"
            >
              <svg
                className="w-4 h-4 text-gray-600"
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
            </button>
          </div>
          <p className="text-xs text-gray-600 text-center">
            {isPreFilled
              ? "Email pre-filled from uploaded file - review and update if needed"
              : "Configure email delivery settings for this customer"
            }
          </p>
          {isPreFilled && (
            <div className="flex justify-center mt-2">
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium border border-green-300">
                ✓ Pre-filled from file
              </span>
            </div>
          )}
        </div>

        {/* Form */}
        <CustomerEmailForm
          customerName={currentCustomer}
          customerEmailData={currentCustomerData}
          customerInvoices={customerInvoices}
          invoiceLinksData={invoiceLinksData}
          onEmailDataChange={onCustomerEmailDataChange}
        />

        {/* Navigation */}
        <EmailCollectionNavigation
          currentIndex={currentCustomerIndex}
          totalCustomers={customersList.length}
          onPrevious={onPrevious}
          onNext={handleNext}
          canProceed={canProceed}
        />

        {/* Progress Bar */}
        <div className="mt-8 max-w-2xl mx-auto">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="h-3 rounded-full transition-all duration-500 ease-out"
              style={{
                background: "linear-gradient(to right, #6366f1, #8b5cf6)",
                width: `${
                  ((currentCustomerIndex + 1) / customersList.length) * 100
                }%`,
              }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>Customer Setup</span>
            <span>
              {Math.round(
                ((currentCustomerIndex + 1) / customersList.length) * 100
              )}% Complete
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailCollectionPhase;