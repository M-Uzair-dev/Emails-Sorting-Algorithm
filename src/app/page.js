"use client";

import { useEmailGenerator } from "../hooks/useEmailGenerator";

// Components
import Header from "../components/Layout/Header";
import FileUploadGrid from "../components/FileUpload/FileUploadGrid";
import InvoiceLinksUpload from "../components/FileUpload/InvoiceLinksUpload";
import EmailSignatureInput from "../components/EmailSignature/EmailSignatureInput";
import ExportSection from "../components/Export/ExportSection";
import CustomerInfoSection from "../components/CustomerInfo/CustomerInfoSection";
import EmailCollectionPhase from "../components/CustomerEmailCollection/EmailCollectionPhase";
import EmailDisplaySection from "../components/EmailDisplay/EmailDisplaySection";
import WIPFileProcessor from "../components/WIPProcessor/WIPFileProcessor";
import Button from "../components/UI/Button";
import ARReportSection from "../components/ARReport/ARReportSection";

export default function Home() {
  const {
    // File states
    invoiceFile,
    noContactFile,
    sentInvoicesFile,
    customerEmailsFile,
    invoiceLinksFile,
    handleFileUpload,

    // Processing states
    isProcessing,
    processFiles,

    // Email collection states
    isCollectingEmails,
    currentCustomerIndex,
    setCurrentCustomerIndex,
    customersList,
    customerEmailData,
    setCustomerEmailData,
    invoiceLinksData,
    generateEmailsAfterCollection,

    // Email display states
    processedEmails,
    currentEmailIndex,
    currentPhase,
    currentEmails,
    overdueEmails,
    nextEmail,
    prevEmail,
    markSentAndNext,

    // Export states
    pendingSentEntries,
    setPendingSentEntries,
    pendingCustomerEmailEntries,
    setPendingCustomerEmailEntries,
    pendingInvoiceLinksEntries,
    setPendingInvoiceLinksEntries,
    sentInvoicesData,
    setSentInvoicesData,
    setInvoiceLinksData,

    // Customer info states
    removedNoContactCustomers,
    skippedCurrentSentCustomers,

    // UI states
    emailSignature,
    setEmailSignature,

    // AR Report data
    allInvoicesData,
  } = useEmailGenerator();

  // Event handlers
  const handleCustomerEmailDataChange = (customerName, data) => {
    setCustomerEmailData(prev => ({
      ...prev,
      [customerName]: data
    }));
  };

  const handlePreviousCustomer = () => {
    if (currentCustomerIndex > 0) {
      setCurrentCustomerIndex(currentCustomerIndex - 1);
    }
  };

  const handleNextCustomer = () => {
    if (currentCustomerIndex < customersList.length - 1) {
      setCurrentCustomerIndex(currentCustomerIndex + 1);
    } else {
      generateEmailsAfterCollection();
    }
  };

  // Export handlers
  const handleSentInvoicesExported = () => {
    setPendingSentEntries([]);
  };

  const handleCustomerEmailsExported = () => {
    setPendingCustomerEmailEntries([]);
  };

  const handleInvoiceLinksExported = (updatedLinks) => {
    setPendingInvoiceLinksEntries([]);
    setInvoiceLinksData(updatedLinks);
  };

  const files = {
    invoice: invoiceFile,
    noContact: noContactFile,
    sentInvoices: sentInvoicesFile,
    customerEmails: customerEmailsFile
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          {/* Header */}
          <Header />

          {/* File Upload Section */}
          <FileUploadGrid
            files={files}
            onFileChange={handleFileUpload}
          />

          {/* Invoice Links Upload */}
          <InvoiceLinksUpload
            file={invoiceLinksFile}
            onFileChange={(file) => handleFileUpload(file, 'invoiceLinks')}
          />

          {/* Email Signature */}
          <EmailSignatureInput
            signature={emailSignature}
            onSignatureChange={setEmailSignature}
          />

          {/* Export Sections */}
          <ExportSection
            pendingSentEntries={pendingSentEntries}
            pendingCustomerEmailEntries={pendingCustomerEmailEntries}
            pendingInvoiceLinksEntries={pendingInvoiceLinksEntries}
            sentInvoicesData={sentInvoicesData}
            invoiceLinksData={invoiceLinksData}
            onSentInvoicesExported={handleSentInvoicesExported}
            onCustomerEmailsExported={handleCustomerEmailsExported}
            onInvoiceLinksExported={handleInvoiceLinksExported}
          />

          {/* Customer Information */}
          <CustomerInfoSection
            removedNoContactCustomers={removedNoContactCustomers}
            skippedCurrentSentCustomers={skippedCurrentSentCustomers}
          />

          {/* Generate Button */}
          {!isCollectingEmails && processedEmails.length === 0 && (
            <div className="flex justify-center mb-6">
              <Button
                onClick={processFiles}
                disabled={!invoiceFile || !noContactFile || isProcessing}
                loading={isProcessing}
                size="lg"
                variant="primary"
              >
                {isProcessing ? "Processing Files..." : "Generate Emails"}
              </Button>
            </div>
          )}

          {/* Email Collection Phase */}
          {isCollectingEmails && (
            <EmailCollectionPhase
              customersList={customersList}
              currentCustomerIndex={currentCustomerIndex}
              customerEmailData={customerEmailData}
              groupedInvoices={window.tempGroupedByCustomer || {}}
              invoiceLinksData={invoiceLinksData}
              onCustomerEmailDataChange={handleCustomerEmailDataChange}
              onPrevious={handlePreviousCustomer}
              onNext={handleNextCustomer}
            />
          )}

          {/* Email Results */}
          {processedEmails.length > 0 && (
            <EmailDisplaySection
              processedEmails={processedEmails}
              currentEmailIndex={currentEmailIndex}
              currentPhase={currentPhase}
              overdueEmailsCount={overdueEmails.length}
              emailSignature={emailSignature}
              onPrevious={prevEmail}
              onNext={nextEmail}
              onMarkSentAndNext={markSentAndNext}
            />
          )}

          {/* WIP File Processor - Show after emails are generated */}
          {processedEmails.length > 0 && (
            <WIPFileProcessor
              noContactCustomers={removedNoContactCustomers}
              reminderSentCustomers={skippedCurrentSentCustomers}
            />
          )}

          {/* AR Report Section - Show after emails are processed */}
          {processedEmails.length > 0 && (
            <ARReportSection invoiceData={allInvoicesData} />
          )}
        </div>
      </div>
    </>
  );
}