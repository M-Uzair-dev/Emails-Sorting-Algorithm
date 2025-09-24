"use client";

import { useState, useEffect } from "react";
import {
  readExcelFile,
  processCustomerEmailsData,
  processInvoiceLinksData,
} from "../utils/excelUtils";
import {
  filterInvoices,
  groupInvoicesByCustomer,
  getCustomerName,
  categorizeInvoicesByAge,
} from "../utils/invoiceUtils";
import {
  generateCurrentInvoiceEmail,
  generateOverdueInvoiceEmail,
  getHighestOverdueCategory,
} from "../utils/emailGenerationUtils";

/**
 * Custom hook for managing email generator state and logic
 * @returns {Object} Hook state and methods
 */
export const useEmailGenerator = () => {
  // File states
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [noContactFile, setNoContactFile] = useState(null);
  const [sentInvoicesFile, setSentInvoicesFile] = useState(null);
  const [customerEmailsFile, setCustomerEmailsFile] = useState(null);
  const [invoiceLinksFile, setInvoiceLinksFile] = useState(null);

  // Processing states
  const [processedEmails, setProcessedEmails] = useState([]);
  const [currentEmailIndex, setCurrentEmailIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Data states
  const [sentInvoicesData, setSentInvoicesData] = useState([]);
  const [customerEmailData, setCustomerEmailData] = useState({});
  const [invoiceLinksData, setInvoiceLinksData] = useState({});

  // Email collection states
  const [isCollectingEmails, setIsCollectingEmails] = useState(false);
  const [currentCustomerIndex, setCurrentCustomerIndex] = useState(0);
  const [customersList, setCustomersList] = useState([]);

  // Phase states
  const [currentPhase, setCurrentPhase] = useState("current");
  const [currentEmails, setCurrentEmails] = useState([]);
  const [overdueEmails, setOverdueEmails] = useState([]);

  // Export states
  const [pendingSentEntries, setPendingSentEntries] = useState([]);
  const [pendingCustomerEmailEntries, setPendingCustomerEmailEntries] = useState([]);
  const [pendingInvoiceLinksEntries, setPendingInvoiceLinksEntries] = useState([]);

  // Customer info states
  const [removedNoContactCustomers, setRemovedNoContactCustomers] = useState([]);
  const [skippedCurrentSentCustomers, setSkippedCurrentSentCustomers] = useState([]);

  // UI states
  const [emailSignature, setEmailSignature] = useState("");

  // Add beforeunload event listener to prevent accidental tab closure
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      const hasWorkInProgress =
        invoiceFile ||
        noContactFile ||
        isCollectingEmails ||
        processedEmails.length > 0 ||
        isProcessing ||
        pendingCustomerEmailEntries.length > 0 ||
        pendingInvoiceLinksEntries.length > 0;

      if (hasWorkInProgress) {
        event.preventDefault();
        event.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [
    invoiceFile,
    noContactFile,
    isCollectingEmails,
    processedEmails.length,
    isProcessing,
    pendingCustomerEmailEntries.length,
    pendingInvoiceLinksEntries.length,
  ]);

  /**
   * Handles file upload for different file types
   */
  const handleFileUpload = (file, fileType) => {
    switch (fileType) {
      case "invoice":
        setInvoiceFile(file);
        break;
      case "noContact":
        setNoContactFile(file);
        break;
      case "sentInvoices":
        setSentInvoicesFile(file);
        break;
      case "customerEmails":
        setCustomerEmailsFile(file);
        break;
      case "invoiceLinks":
        setInvoiceLinksFile(file);
        break;
      default:
        break;
    }
  };

  /**
   * Processes uploaded files and prepares data for email collection
   */
  const processFiles = async () => {
    if (!invoiceFile || !noContactFile) {
      alert("Please upload Invoice Data and No Contact Customers files");
      return;
    }

    setIsProcessing(true);

    try {
      const invoiceData = await readExcelFile(invoiceFile);
      const noContactData = await readExcelFile(noContactFile);

      // Load sent invoices data if provided
      let sentInvoicesDataRaw = [];
      if (sentInvoicesFile) {
        sentInvoicesDataRaw = await readExcelFile(sentInvoicesFile);
        console.log("🔍 SentInvoices file loaded:", sentInvoicesDataRaw.length, "rows");
      }
      setSentInvoicesData(sentInvoicesDataRaw);

      // Process no-contact customers
      const firstColumnKey = Object.keys(noContactData[0] || {})[0];
      const noContactCustomers = new Set(
        noContactData
          .map((row) => {
            const customerName = row[firstColumnKey]?.toString().trim().toLowerCase();
            return customerName;
          })
          .filter(Boolean)
      );

      // Filter invoices
      const { filteredInvoices, removedCustomers } = filterInvoices(invoiceData, noContactCustomers);
      setRemovedNoContactCustomers(removedCustomers);

      if (filteredInvoices.length === 0) {
        alert("No valid invoices found after filtering. Check your data and column names.");
        setIsProcessing(false);
        return;
      }

      // Group by customer
      const groupedByCustomer = groupInvoicesByCustomer(filteredInvoices);

      // Pre-filter customers who have actual emails to send
      const customersWithEmails = [];
      const skippedCurrentSentCustomersArray = [];

      for (const [customer, invoices] of Object.entries(groupedByCustomer)) {
        const categorizedInvoices = categorizeInvoicesByAge(invoices);

        // Check if customer has overdue invoices
        const hasOverdueInvoices = [
          "days1to30", "days31to60", "days61to90", "days91Plus"
        ].some((category) => categorizedInvoices[category].length > 0);

        if (hasOverdueInvoices) {
          customersWithEmails.push(customer);
        } else {
          // For current invoices only, check if any are unsent
          const currentInvoices = categorizedInvoices.current;

          // Create sent invoice numbers set (simplified for this hook)
          const sentInvoiceNumbers = new Set(
            sentInvoicesDataRaw.map(entry => {
              if (typeof entry === "string") {
                let invoiceNum = entry.toString().trim();
                if (invoiceNum.startsWith("#")) {
                  invoiceNum = invoiceNum.substring(1);
                }
                return invoiceNum;
              } else {
                const possibleValues = [
                  entry["Invoice Number"], entry.invoiceNumber, entry.Num, entry.num,
                  entry["Invoice Num"], entry.InvoiceNumber, entry["Invoice_Number"],
                ];
                let invoiceNum = "";
                for (let val of possibleValues) {
                  if (val !== undefined && val !== null && val !== "") {
                    invoiceNum = val.toString().trim();
                    break;
                  }
                }
                if (invoiceNum.startsWith("#")) {
                  invoiceNum = invoiceNum.substring(1);
                }
                return invoiceNum;
              }
            }).filter((num) => num !== "")
          );

          // Check if any current invoices are unsent
          const unsentCurrentInvoices = currentInvoices.filter((invoice) => {
            let invoiceNum = (invoice.Num || invoice.num || invoice.Number || invoice.number || "")
              .toString().trim();
            if (invoiceNum.startsWith("#")) {
              invoiceNum = invoiceNum.substring(1);
            }
            return !sentInvoiceNumbers.has(invoiceNum);
          });

          if (unsentCurrentInvoices.length > 0) {
            customersWithEmails.push(customer);
          } else {
            skippedCurrentSentCustomersArray.push(customer);
          }
        }
      }

      setSkippedCurrentSentCustomers(skippedCurrentSentCustomersArray);

      if (customersWithEmails.length === 0) {
        alert("No customers have unsent invoices to process.");
        setIsProcessing(false);
        return;
      }

      // Load customer emails data if provided
      if (customerEmailsFile) {
        const customerEmailsDataRaw = await readExcelFile(customerEmailsFile);
        const preloadedEmails = processCustomerEmailsData(customerEmailsDataRaw);
        setCustomerEmailData(preloadedEmails);
        console.log("📧 Pre-loaded emails for:", Object.keys(preloadedEmails).length, "customers");
      }

      // Load invoice links data if provided
      if (invoiceLinksFile) {
        const invoiceLinksDataRaw = await readExcelFile(invoiceLinksFile);
        const preloadedLinks = processInvoiceLinksData(invoiceLinksDataRaw);
        setInvoiceLinksData(preloadedLinks);
        console.log("🔗 Pre-loaded links for:", Object.keys(preloadedLinks).length, "invoices");
      }

      // Store data for email generation
      setCustomersList(customersWithEmails);
      setCurrentCustomerIndex(0);
      setIsCollectingEmails(true);
      setIsProcessing(false);

      // Store grouped invoices for later use
      window.tempGroupedByCustomer = groupedByCustomer;
      window.tempSentInvoicesDataRaw = sentInvoicesDataRaw;

    } catch (error) {
      alert(`Error processing files: ${error.message}`);
      setIsProcessing(false);
    }
  };

  /**
   * Generates emails after customer email collection is complete
   */
  const generateEmailsAfterCollection = async () => {
    try {
      const groupedByCustomer = window.tempGroupedByCustomer;
      const sentInvoicesDataRaw = window.tempSentInvoicesDataRaw;

      // Merge pre-loaded invoice links into customer email data
      for (const [customerName, emailData] of Object.entries(customerEmailData)) {
        const customerInvoices = groupedByCustomer[customerName] || [];

        if (!emailData.invoiceLinks) {
          emailData.invoiceLinks = {};
        }

        customerInvoices.forEach((invoice) => {
          const invoiceNum = invoice.Num || invoice.num || invoice.Number || invoice.number || "N/A";
          if (!emailData.invoiceLinks[invoiceNum] && invoiceLinksData[invoiceNum]) {
            emailData.invoiceLinks[invoiceNum] = invoiceLinksData[invoiceNum];
          }
        });
      }

      // Generate emails
      const currentEmailsArray = [];
      const overdueEmailsArray = [];
      const skippedCurrentSentCustomersArray = [];

      for (const [customer, invoices] of Object.entries(groupedByCustomer)) {
        const categorizedInvoices = categorizeInvoicesByAge(invoices);

        // Generate current invoice emails
        if (categorizedInvoices.current.length > 0) {
          const currentEmail = generateCurrentInvoiceEmail(
            customer,
            categorizedInvoices.current,
            sentInvoicesDataRaw,
            customerEmailData[customer],
            emailSignature
          );

          if (currentEmail) {
            currentEmail.customerEmail = customerEmailData[customer]?.email || "";
            currentEmail.customerCC = customerEmailData[customer]?.cc || "";
            currentEmail.emailTitle = "New Invoice(s) Sent - Vein360";
            currentEmailsArray.push(currentEmail);
          } else {
            skippedCurrentSentCustomersArray.push(customer);
          }
        }

        // Generate overdue invoice emails
        const overdueInvoices = [
          ...categorizedInvoices.days1to30,
          ...categorizedInvoices.days31to60,
          ...categorizedInvoices.days61to90,
          ...categorizedInvoices.days91Plus,
        ];

        if (overdueInvoices.length > 0) {
          const overdueEmail = generateOverdueInvoiceEmail(
            customer,
            overdueInvoices,
            customerEmailData[customer],
            emailSignature
          );
          overdueEmail.customerEmail = customerEmailData[customer]?.email || "";
          overdueEmail.customerCC = customerEmailData[customer]?.cc || "";
          overdueEmail.emailTitle = `You have ${getHighestOverdueCategory(overdueInvoices)} - Vein360`;
          overdueEmailsArray.push(overdueEmail);
        }
      }

      // Set emails and start with current phase
      setCurrentEmails(currentEmailsArray.reverse());
      setOverdueEmails(overdueEmailsArray.reverse());
      setSkippedCurrentSentCustomers(skippedCurrentSentCustomersArray);

      if (currentEmailsArray.length > 0) {
        setProcessedEmails(currentEmailsArray);
        setCurrentPhase("current");
      } else if (overdueEmailsArray.length > 0) {
        setProcessedEmails(overdueEmailsArray);
        setCurrentPhase("overdue");
      }

      setCurrentEmailIndex(0);
      setIsCollectingEmails(false);

      // Prepare export data
      const pendingEntries = [];
      for (const [customerName, emailData] of Object.entries(customerEmailData)) {
        if (emailData.email) {
          pendingEntries.push({
            customerName,
            email: emailData.email,
            cc: emailData.cc || "",
          });
        }
      }
      setPendingCustomerEmailEntries(pendingEntries);

      const pendingInvoiceLinksEntries = [];
      for (const [customerName, emailData] of Object.entries(customerEmailData)) {
        if (emailData.invoiceLinks) {
          for (const [invoiceNum, link] of Object.entries(emailData.invoiceLinks)) {
            if (link && link.trim() !== "") {
              pendingInvoiceLinksEntries.push({
                Invoice: invoiceNum,
                Link: link.trim(),
              });
            }
          }
        }
      }
      setPendingInvoiceLinksEntries(pendingInvoiceLinksEntries);

    } catch (error) {
      alert(`Error generating emails: ${error.message}`);
    }
  };

  // Navigation methods
  const nextEmail = () => {
    if (currentEmailIndex < processedEmails.length - 1) {
      setCurrentEmailIndex(currentEmailIndex + 1);
    } else {
      switchToNextPhase();
    }
  };

  const prevEmail = () => {
    if (currentEmailIndex > 0) {
      setCurrentEmailIndex(currentEmailIndex - 1);
    } else if (currentPhase === "overdue" && currentEmails.length > 0) {
      setCurrentPhase("current");
      setProcessedEmails(currentEmails);
      setCurrentEmailIndex(currentEmails.length - 1);
    }
  };

  const switchToNextPhase = () => {
    if (currentPhase === "current" && overdueEmails.length > 0) {
      setCurrentPhase("overdue");
      setProcessedEmails(overdueEmails);
      setCurrentEmailIndex(0);
    }
  };

  const markSentAndNext = () => {
    const currentEmail = processedEmails[currentEmailIndex];
    if (!currentEmail) return;

    // Update sent invoices data
    const newSentEntries = [];

    if (currentEmail.currentInvoicesOnly && currentEmail.unsentInvoices) {
      currentEmail.unsentInvoices.forEach((invoice) => {
        const invoiceNum = invoice.Num || invoice.num || invoice.Number || invoice.number || "N/A";
        newSentEntries.push(invoiceNum);
      });
    } else {
      const categorizedInvoices = categorizeInvoicesByAge(currentEmail.invoicesData || []);
      if (categorizedInvoices.current && categorizedInvoices.current.length > 0) {
        categorizedInvoices.current.forEach((invoice) => {
          const invoiceNum = invoice.Num || invoice.num || invoice.Number || invoice.number || "N/A";
          newSentEntries.push(invoiceNum);
        });
      }
    }

    // Update sent invoices data
    const updatedSentInvoicesData = [
      ...sentInvoicesData.map((entry) =>
        typeof entry === "string"
          ? entry
          : entry.Num || entry["Invoice Number"] || entry.invoiceNumber || ""
      ),
      ...newSentEntries,
    ].filter(Boolean);
    setSentInvoicesData(updatedSentInvoicesData);

    setPendingSentEntries((prev) => [...prev, ...newSentEntries]);
    nextEmail();
  };

  return {
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
  };
};