"use client";

import ExportCard from './ExportCard';
import { exportToExcel } from '../../utils/excelUtils';

/**
 * Export section component that handles all export operations
 * @param {Object} props - Component props
 * @param {Array} props.pendingSentEntries - Pending sent invoices entries
 * @param {Array} props.pendingCustomerEmailEntries - Pending customer email entries
 * @param {Array} props.pendingInvoiceLinksEntries - Pending invoice links entries
 * @param {Array} props.sentInvoicesData - Complete sent invoices data
 * @param {Object} props.invoiceLinksData - Invoice links data
 * @param {Function} props.onSentInvoicesExported - Callback after sent invoices export
 * @param {Function} props.onCustomerEmailsExported - Callback after customer emails export
 * @param {Function} props.onInvoiceLinksExported - Callback after invoice links export
 * @returns {JSX.Element} Export section component
 */
const ExportSection = ({
  pendingSentEntries,
  pendingCustomerEmailEntries,
  pendingInvoiceLinksEntries,
  sentInvoicesData,
  invoiceLinksData,
  onSentInvoicesExported,
  onCustomerEmailsExported,
  onInvoiceLinksExported
}) => {
  const handleSentInvoicesExport = () => {
    if (pendingSentEntries.length === 0) {
      alert("No new entries to save!");
      return;
    }

    try {
      const worksheetData = sentInvoicesData.map((invoiceNum) => ({
        "Invoice Number": invoiceNum,
      }));

      exportToExcel(worksheetData, "SentInvoices.xlsx", "SentInvoices");

      alert(
        `✅ Exported complete SentInvoices.xlsx file!\n\n📊 Total entries: ${sentInvoicesData.length}\n📝 New entries added: ${pendingSentEntries.length}\n\n📁 Replace your original SentInvoices.xlsx with the downloaded file.`
      );

      onSentInvoicesExported();
    } catch (error) {
      alert("Error exporting file.");
    }
  };

  const handleCustomerEmailsExport = () => {
    if (pendingCustomerEmailEntries.length === 0) {
      alert("No customer email data to save!");
      return;
    }

    try {
      const worksheetData = pendingCustomerEmailEntries.map((entry) => ({
        "Customer Name": entry.customerName,
        Email: entry.email,
        CC: entry.cc,
      }));

      exportToExcel(worksheetData, "CustomerEmails.xlsx", "CustomerEmails");

      alert(
        `✅ Exported CustomerEmails.xlsx file!\n\n📊 Total entries: ${pendingCustomerEmailEntries.length} customers\n\n📁 Use this file next time to pre-fill customer email addresses.`
      );

      onCustomerEmailsExported();
    } catch (error) {
      alert("Error exporting customer emails file.");
    }
  };

  const handleInvoiceLinksExport = () => {
    if (pendingInvoiceLinksEntries.length === 0) {
      alert("No invoice links data to save!");
      return;
    }

    try {
      // Get all current invoice numbers from the invoice data
      const groupedByCustomer = window.tempGroupedByCustomer || {};
      const currentInvoiceNumbers = new Set();

      Object.values(groupedByCustomer).forEach(invoices => {
        invoices.forEach(invoice => {
          const invoiceNum = invoice.Num || invoice.num || invoice.Number || invoice.number || "";
          if (invoiceNum) {
            currentInvoiceNumbers.add(invoiceNum.toString().trim());
          }
        });
      });

      // Combine existing invoice links data with new pending entries
      const allInvoiceLinks = { ...invoiceLinksData };

      // Add/update with new pending entries
      pendingInvoiceLinksEntries.forEach((entry) => {
        allInvoiceLinks[entry.Invoice] = entry.Link;
      });

      // Filter invoice links to only include invoices that exist in current data
      const filteredInvoiceLinks = {};
      Object.entries(allInvoiceLinks).forEach(([invoice, link]) => {
        if (currentInvoiceNumbers.has(invoice.toString().trim())) {
          filteredInvoiceLinks[invoice] = link;
        }
      });

      // Convert filtered invoice links to worksheet format
      const worksheetData = Object.entries(filteredInvoiceLinks).map(([invoice, link]) => ({
        Invoice: invoice,
        Link: link,
      }));

      exportToExcel(worksheetData, "invoice-links.xlsx", "InvoiceLinks");

      const removedCount = Object.keys(allInvoiceLinks).length - Object.keys(filteredInvoiceLinks).length;
      const alertMessage = removedCount > 0
        ? `✅ Exported invoice-links.xlsx file!\n\n📊 Total entries: ${worksheetData.length} invoice links\n📝 New entries added: ${pendingInvoiceLinksEntries.length}\n🗑️ Removed ${removedCount} links for paid/deleted invoices\n\n📁 Replace your original InvoiceLinks.xlsx with the downloaded file.`
        : `✅ Exported invoice-links.xlsx file!\n\n📊 Total entries: ${worksheetData.length} invoice links\n📝 New entries added: ${pendingInvoiceLinksEntries.length}\n\n📁 Replace your original InvoiceLinks.xlsx with the downloaded file.`;

      alert(alertMessage);

      onInvoiceLinksExported(filteredInvoiceLinks);
    } catch (error) {
      alert("Error exporting invoice links file.");
    }
  };

  const warningIcon = (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
      />
    </svg>
  );

  const emailIcon = (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 8l7.89 2.26a2 2 0 001.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );

  const linkIcon = (
    <svg
      className="w-5 h-5"
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
  );

  return (
    <>
      {/* Export Updates Section */}
      {pendingSentEntries.length > 0 && (
        <ExportCard
          title="Updates Pending"
          description={`📝 ${pendingSentEntries.length} pending entries to save`}
          iconColor="text-orange-600"
          bgColor="bg-orange-50"
          borderColor="border-orange-200"
          onExport={handleSentInvoicesExport}
          buttonText="Export Updates"
          icon={warningIcon}
        />
      )}

      {/* Export Customer Emails Section */}
      {pendingCustomerEmailEntries.length > 0 && (
        <ExportCard
          title="Customer Emails Ready"
          description={`📧 ${pendingCustomerEmailEntries.length} customer email addresses to save`}
          iconColor="text-purple-600"
          bgColor="bg-purple-50"
          borderColor="border-purple-200"
          onExport={handleCustomerEmailsExport}
          buttonText="Export Customer Emails"
          icon={emailIcon}
        />
      )}

      {/* Export Invoice Links Section */}
      {pendingInvoiceLinksEntries.length > 0 && (
        <ExportCard
          title="Invoice Links Ready"
          description={`🔗 ${pendingInvoiceLinksEntries.length} invoice links to save`}
          iconColor="text-orange-600"
          bgColor="bg-orange-50"
          borderColor="border-orange-200"
          onExport={handleInvoiceLinksExport}
          buttonText="Export Invoice Links"
          icon={linkIcon}
        />
      )}
    </>
  );
};

export default ExportSection;