"use client";

import { isValidURL } from '../../utils/invoiceUtils';

/**
 * Form for collecting customer email and invoice links
 * @param {Object} props - Component props
 * @param {string} props.customerName - Current customer name
 * @param {Object} props.customerEmailData - Customer's email data
 * @param {Array} props.customerInvoices - Customer's invoices
 * @param {Object} props.invoiceLinksData - Pre-loaded invoice links
 * @param {Function} props.onEmailDataChange - Email data change handler
 * @returns {JSX.Element} Customer email form component
 */
const CustomerEmailForm = ({
  customerName,
  customerEmailData,
  customerInvoices,
  invoiceLinksData,
  onEmailDataChange
}) => {
  const handleEmailChange = (field, value) => {
    onEmailDataChange(customerName, {
      ...customerEmailData,
      [field]: value
    });
  };

  const handleInvoiceLinkChange = (invoiceNum, value) => {
    onEmailDataChange(customerName, {
      ...customerEmailData,
      invoiceLinks: {
        ...customerEmailData?.invoiceLinks,
        [invoiceNum]: value
      }
    });
  };

  return (
    <div className="max-w-xl mx-auto space-y-3">
      {/* Email Input */}
      <div className="bg-white rounded-lg p-3 border border-gray-200">
        <label className="block text-xs font-bold text-gray-800 mb-2">
          Primary Email Address *
        </label>
        <input
          type="email"
          value={customerEmailData?.email || ""}
          onChange={(e) => handleEmailChange('email', e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-300 bg-white text-gray-900 placeholder-gray-400 text-sm"
          placeholder="Enter customer email address"
          required
        />
      </div>

      {/* CC Input */}
      <div className="bg-white rounded-lg p-3 border border-gray-200">
        <label className="block text-xs font-bold text-gray-800 mb-2">
          CC Email Address (Optional)
        </label>
        <input
          type="email"
          value={customerEmailData?.cc || ""}
          onChange={(e) => handleEmailChange('cc', e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-300 bg-white text-gray-900 placeholder-gray-400 text-sm"
          placeholder="Enter CC email address (optional)"
        />
      </div>

      {/* Invoice Links Section */}
      <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
        <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          Invoice Links Required *
        </h3>
        <p className="text-xs text-gray-700 mb-3">
          Enter the payment link for each invoice. All links are required.
        </p>

        <div className="space-y-2">
          {customerInvoices.map((invoice, index) => {
            const invoiceNum =
              invoice.Num ||
              invoice.num ||
              invoice.Number ||
              invoice.number ||
              `Invoice ${index + 1}`;
            const dueDate = new Date(
              invoice["Due date"] ||
                invoice["due date"] ||
                invoice.duedate
            ).toLocaleDateString();

            return (
              <div
                key={index}
                className="bg-white rounded-lg p-2 border border-gray-200"
              >
                <label className="block text-xs font-medium text-gray-800 mb-1">
                  Invoice #{invoiceNum} (Due: {dueDate}) *
                </label>
                <input
                  type="url"
                  value={
                    customerEmailData?.invoiceLinks?.[invoiceNum] ||
                    invoiceLinksData[invoiceNum] ||
                    ""
                  }
                  onChange={(e) => handleInvoiceLinkChange(invoiceNum, e.target.value)}
                  className="w-full px-2 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-300 bg-white text-gray-900 placeholder-gray-400 text-xs"
                  placeholder="https://example.com/invoice-payment-link"
                  required
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CustomerEmailForm;