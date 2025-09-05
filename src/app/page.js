"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

export default function Home() {
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [noContactFile, setNoContactFile] = useState(null);
  const [sentInvoicesFile, setSentInvoicesFile] = useState(null);
  const [processedEmails, setProcessedEmails] = useState([]);
  const [currentEmailIndex, setCurrentEmailIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sentInvoicesData, setSentInvoicesData] = useState([]);
  const [pendingSentEntries, setPendingSentEntries] = useState([]);
  const [currentPhase, setCurrentPhase] = useState("current"); // 'current' or 'overdue'
  const [currentEmails, setCurrentEmails] = useState([]);
  const [overdueEmails, setOverdueEmails] = useState([]);
  const [removedNoContactCustomers, setRemovedNoContactCustomers] = useState(
    []
  );
  const [skippedCurrentSentCustomers, setSkippedCurrentSentCustomers] =
    useState([]);
  const [emailSignature, setEmailSignature] = useState("");
  const [customerEmailData, setCustomerEmailData] = useState({});
  const [isCollectingEmails, setIsCollectingEmails] = useState(false);
  const [currentCustomerIndex, setCurrentCustomerIndex] = useState(0);
  const [customersList, setCustomersList] = useState([]);
  const [emailTitle, setEmailTitle] = useState("");
  const [customerEmailsFile, setCustomerEmailsFile] = useState(null);
  const [pendingCustomerEmailEntries, setPendingCustomerEmailEntries] = useState([]);

  const copyEmailToClipboard = async () => {
    const currentEmail = processedEmails[currentEmailIndex];
    if (!currentEmail) return;

    try {
      // Use stored email title
      const emailTitle = currentEmail.emailTitle || "Email - Vein360";

      // Generate header with email info
      const headerInfo = `Email Title: ${emailTitle}\n\nTo: ${
        currentEmail.customerEmail || "Not set"
      }${
        currentEmail.customerCC ? `\nCC: ${currentEmail.customerCC}` : ""
      }\n\n--- EMAIL CONTENT ---\n\n`;

      // Try to copy as rich HTML first (preserves formatting including signature)
      const htmlContent = headerInfo + currentEmail.content;

      // Create ClipboardItem with both HTML and plain text
      const clipboardItem = new ClipboardItem({
        "text/html": new Blob([htmlContent], { type: "text/html" }),
        "text/plain": new Blob(
          [htmlContent.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ")],
          { type: "text/plain" }
        ),
      });

      await navigator.clipboard.write([clipboardItem]);
      alert("Email copied to clipboard with formatting!");
    } catch (err) {
      console.log("Rich HTML copy failed, trying fallback method...");

      // Fallback: Copy HTML directly to clipboard
      try {
        await navigator.clipboard.writeText(currentEmail.content);
        alert("Email copied to clipboard (HTML format)!");
      } catch (err2) {
        // Final fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = currentEmail.content;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        alert("Email copied to clipboard!");
      }
    }
  };

  const handleFileUpload = (event, fileType) => {
    const file = event.target.files[0];
    if (fileType === "invoice") {
      setInvoiceFile(file);
    } else if (fileType === "noContact") {
      setNoContactFile(file);
    } else if (fileType === "sentInvoices") {
      setSentInvoicesFile(file);
    } else if (fileType === "customerEmails") {
      setCustomerEmailsFile(file);
    }
  };

  const loadSentInvoicesFromLocal = async () => {
    try {
      const response = await fetch("/SentInvoices.xlsx");

      if (!response.ok) {
        return [];
      }

      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      return jsonData;
    } catch (error) {
      return [];
    }
  };

  const processFiles = async () => {
    if (!invoiceFile || !noContactFile) {
      alert("Please upload Invoice Data and No Contact Customers files");
      return;
    }

    setIsProcessing(true);

    try {
      const invoiceData = await readExcelFile(invoiceFile);
      const noContactData = await readExcelFile(noContactFile);

      // Load sent invoices data if file is provided, otherwise use empty array
      let sentInvoicesDataRaw = [];
      if (sentInvoicesFile) {
        sentInvoicesDataRaw = await readExcelFile(sentInvoicesFile);
        console.log(
          "🔍 SentInvoices file loaded:",
          sentInvoicesDataRaw.length,
          "rows"
        );
      } else {
        console.log(
          "🔍 No SentInvoices file provided - treating all invoices as new"
        );
      }
      setSentInvoicesData(sentInvoicesDataRaw);

      const firstColumnKey = Object.keys(noContactData[0] || {})[0];
      const noContactCustomers = new Set(
        noContactData
          .map((row) => {
            const customerName = row[firstColumnKey]
              ?.toString()
              .trim()
              .toLowerCase();
            return customerName;
          })
          .filter(Boolean)
      );

      // Track removed no-contact customers
      const removedCustomers = [];

      const filteredInvoices = invoiceData.filter((row) => {
        const customer = (
          row["Customer full name"] ||
          row["Customer"] ||
          row["customer"] ||
          ""
        )
          ?.toString()
          .trim()
          .toLowerCase();
        const originalCustomer = (
          row["Customer full name"] ||
          row["Customer"] ||
          row["customer"] ||
          ""
        )
          ?.toString()
          .trim();
        const amount = parseFloat(row.Amount || row.amount || 0);
        const hasCustomer = !!customer && customer !== "";
        const isInNoContact = noContactCustomers.has(customer);
        const positiveAmount = amount >= 0;
        const hasValidAmount = !isNaN(amount);

        // Track removed no-contact customers
        if (
          hasCustomer &&
          isInNoContact &&
          !removedCustomers.includes(originalCustomer)
        ) {
          removedCustomers.push(originalCustomer);
        }

        return (
          hasCustomer && !isInNoContact && positiveAmount && hasValidAmount
        );
      });

      setRemovedNoContactCustomers(removedCustomers);

      if (filteredInvoices.length === 0) {
        alert(
          "No valid invoices found after filtering. Check your data and column names."
        );
        setIsProcessing(false);
        return;
      }

      const groupedByCustomer = {};
      filteredInvoices.forEach((invoice) => {
        const customer = (
          invoice["Customer full name"] ||
          invoice["Customer"] ||
          invoice["customer"] ||
          ""
        )
          .toString()
          .trim();
        if (!groupedByCustomer[customer]) {
          groupedByCustomer[customer] = [];
        }
        groupedByCustomer[customer].push(invoice);
      });

      // Pre-filter customers who have actual emails to send (after removing sent invoices)
      const customersWithEmails = [];
      const skippedCurrentSentCustomersArray = [];

      for (const [customer, invoices] of Object.entries(groupedByCustomer)) {
        const categorizedInvoices = categorizeInvoicesByAge(invoices);

        // Check if customer has overdue invoices (always send these)
        const hasOverdueInvoices = [
          "days1to30",
          "days31to60",
          "days61to90",
          "days91Plus",
        ].some((category) => categorizedInvoices[category].length > 0);

        if (hasOverdueInvoices) {
          customersWithEmails.push(customer);
        } else {
          // For current invoices only, check if any are unsent
          const currentInvoices = categorizedInvoices.current;

          // Create sent invoice numbers set
          const sentInvoiceNumbers = new Set(
            sentInvoicesDataRaw
              .map((entry) => {
                if (typeof entry === "string") {
                  let invoiceNum = entry.toString().trim();
                  if (invoiceNum.startsWith("#")) {
                    invoiceNum = invoiceNum.substring(1);
                  }
                  return invoiceNum;
                } else {
                  const possibleValues = [
                    entry["Invoice Number"],
                    entry.invoiceNumber,
                    entry.Num,
                    entry.num,
                    entry["Invoice Num"],
                    entry.InvoiceNumber,
                    entry["Invoice_Number"],
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
              })
              .filter((num) => num !== "")
          );

          // Check if any current invoices are unsent
          const unsentCurrentInvoices = currentInvoices.filter((invoice) => {
            let invoiceNum = (
              invoice.Num ||
              invoice.num ||
              invoice.Number ||
              invoice.number ||
              ""
            )
              .toString()
              .trim();
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

      // Load customer emails data if file is provided
      let customerEmailsDataRaw = [];
      if (customerEmailsFile) {
        customerEmailsDataRaw = await readExcelFile(customerEmailsFile);
        console.log('🔍 CustomerEmails file loaded:', customerEmailsDataRaw.length, 'rows');
        
        // Pre-populate customerEmailData from uploaded file
        const preloadedEmails = {};
        customerEmailsDataRaw.forEach(entry => {
          const customerName = entry['Customer Name'] || entry.customerName || entry.Customer || '';
          const email = entry['Email'] || entry.email || '';
          const cc = entry['CC'] || entry.cc || entry.CC || '';
          
          if (customerName && email) {
            preloadedEmails[customerName] = {
              email: email,
              cc: cc
            };
          }
        });
        setCustomerEmailData(preloadedEmails);
        console.log('📧 Pre-loaded emails for:', Object.keys(preloadedEmails).length, 'customers');
      } else {
        console.log('🔍 No CustomerEmails file provided - will collect all emails manually');
      }

      // Store customers list for email collection (only those with emails to send)
      setCustomersList(customersWithEmails);
      setCurrentCustomerIndex(0);
      setIsCollectingEmails(true);
      setIsProcessing(false);

      // Store grouped invoices for later use
      window.tempGroupedByCustomer = groupedByCustomer;
      window.tempSentInvoicesDataRaw = sentInvoicesDataRaw;

      return; // Stop here and wait for email collection
    } catch (error) {
      alert(`Error processing files: ${error.message}`);
    }

    setIsProcessing(false);
  };

  const getHighestOverdueCategory = (overdueInvoices) => {
    const categorizedInvoices = categorizeInvoicesByAge(overdueInvoices);

    if (categorizedInvoices.days91Plus.length > 0) {
      return "Critically Overdue invoices";
    } else if (categorizedInvoices.days61to90.length > 0) {
      return "Extremely Overdue invoices";
    } else if (categorizedInvoices.days31to60.length > 0) {
      return "Long Overdue invoices";
    } else if (categorizedInvoices.days1to30.length > 0) {
      return "Overdue invoices";
    }
    return "Overdue invoices";
  };

  const generateEmailsAfterCollection = async () => {
    try {
      const groupedByCustomer = window.tempGroupedByCustomer;
      const sentInvoicesDataRaw = window.tempSentInvoicesDataRaw;

      // Phase 1: Generate Current Invoice Emails
      const currentEmailsArray = [];
      const overdueEmailsArray = [];
      const skippedCurrentSentCustomersArray = [];

      for (const [customer, invoices] of Object.entries(groupedByCustomer)) {
        const categorizedInvoices = categorizeInvoicesByAge(invoices);

        // Phase 1: Current invoices only (with sent tracking)
        if (categorizedInvoices.current.length > 0) {
          const currentEmail = generateCurrentInvoiceEmail(
            customer,
            categorizedInvoices.current,
            sentInvoicesDataRaw
          );
          if (currentEmail) {
            // Add customer email data and email title
            currentEmail.customerEmail =
              customerEmailData[customer]?.email || "";
            currentEmail.customerCC = customerEmailData[customer]?.cc || "";
            currentEmail.emailTitle = "New Invoice(s) Sent - Vein360";
            currentEmailsArray.push(currentEmail);
          } else {
            // Track customers whose current invoices were all already sent
            skippedCurrentSentCustomersArray.push(customer);
          }
        }

        // Phase 2: Overdue invoices only (no sent tracking)
        const overdueInvoices = [
          ...categorizedInvoices.days1to30,
          ...categorizedInvoices.days31to60,
          ...categorizedInvoices.days61to90,
          ...categorizedInvoices.days91Plus,
        ];

        if (overdueInvoices.length > 0) {
          const overdueEmail = generateOverdueInvoiceEmail(
            customer,
            overdueInvoices
          );
          // Add customer email data and email title
          overdueEmail.customerEmail = customerEmailData[customer]?.email || "";
          overdueEmail.customerCC = customerEmailData[customer]?.cc || "";
          overdueEmail.emailTitle = `You have ${getHighestOverdueCategory(
            overdueInvoices
          )} - Vein360`;
          overdueEmailsArray.push(overdueEmail);
        }
      }

      // Reverse arrays and set them
      setCurrentEmails(currentEmailsArray.reverse());
      setOverdueEmails(overdueEmailsArray.reverse());
      setSkippedCurrentSentCustomers(skippedCurrentSentCustomersArray);

      // Start with current emails if any, otherwise overdue
      if (currentEmailsArray.length > 0) {
        setProcessedEmails(currentEmailsArray);
        setCurrentPhase("current");
      } else if (overdueEmailsArray.length > 0) {
        setProcessedEmails(overdueEmailsArray);
        setCurrentPhase("overdue");
      }

      setCurrentEmailIndex(0);
      setIsCollectingEmails(false);

      // Track pending customer email entries for export
      const pendingEntries = [];
      for (const [customerName, emailData] of Object.entries(customerEmailData)) {
        if (emailData.email) {
          pendingEntries.push({
            customerName,
            email: emailData.email,
            cc: emailData.cc || ''
          });
        }
      }
      setPendingCustomerEmailEntries(pendingEntries);
    } catch (error) {
      alert(`Error generating emails: ${error.message}`);
    }
  };

  const exportCustomerEmails = () => {
    if (pendingCustomerEmailEntries.length === 0) {
      alert('No customer email data to save!');
      return;
    }

    try {
      // Convert customer emails to worksheet format
      const worksheetData = pendingCustomerEmailEntries.map(entry => ({
        'Customer Name': entry.customerName,
        'Email': entry.email,
        'CC': entry.cc
      }));
      
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'CustomerEmails');
      
      // Always export as "CustomerEmails.xlsx" for easy replacement
      XLSX.writeFile(workbook, 'CustomerEmails.xlsx');
      
      alert(`✅ Exported CustomerEmails.xlsx file!\n\n📊 Total entries: ${pendingCustomerEmailEntries.length} customers\n\n📁 Use this file next time to pre-fill customer email addresses.`);
      
      // Clear pending entries
      setPendingCustomerEmailEntries([]);
    } catch (error) {
      alert('Error exporting customer emails file.');
    }
  };

  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsBinaryString(file);
    });
  };

  const calculateDaysPastDue = (dueDate) => {
    const due = new Date(dueDate);
    const today = new Date();

    if (isNaN(due.getTime())) {
      return 0;
    }

    const diffTime = today - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const categorizeInvoicesByAge = (invoices) => {
    const categories = {
      current: [],
      days1to30: [],
      days31to60: [],
      days61to90: [],
      days91Plus: [],
    };

    invoices.forEach((invoice) => {
      const dueDate =
        invoice["Due date"] || invoice["due date"] || invoice.duedate;
      const daysPastDue = calculateDaysPastDue(dueDate);

      if (daysPastDue <= 0) {
        categories.current.push(invoice);
      } else if (daysPastDue <= 30) {
        categories.days1to30.push(invoice);
      } else if (daysPastDue <= 60) {
        categories.days31to60.push(invoice);
      } else if (daysPastDue <= 90) {
        categories.days61to90.push(invoice);
      } else {
        categories.days91Plus.push(invoice);
      }
    });

    // Sort each category by date (oldest to newest)
    Object.keys(categories).forEach((key) => {
      categories[key].sort((a, b) => {
        const dateA = new Date(a["Due date"] || a["due date"] || a.duedate);
        const dateB = new Date(b["Due date"] || b["due date"] || b.duedate);
        return dateA - dateB;
      });
    });

    return categories;
  };

  const generateCurrentInvoiceEmail = (
    customer,
    currentInvoices,
    sentInvoicesData
  ) => {
    // Create a set of sent invoice numbers
    console.log(`🔍 Checking sent invoices for customer: ${customer}`);
    console.log(`🔍 SentInvoicesData sample:`, sentInvoicesData.slice(0, 3));

    const sentInvoiceNumbers = new Set(
      sentInvoicesData
        .map((entry) => {
          if (typeof entry === "string") {
            // Simple format: just invoice number
            let invoiceNum = entry.toString().trim();
            if (invoiceNum.startsWith("#")) {
              invoiceNum = invoiceNum.substring(1);
            }
            console.log(`🔍 Found sent invoice: "${invoiceNum}"`);
            return invoiceNum;
          } else {
            // Legacy format: object with multiple columns
            const possibleValues = [
              entry["Invoice Number"],
              entry.invoiceNumber,
              entry.Num,
              entry.num,
              entry["Invoice Num"],
              entry.InvoiceNumber,
              entry["Invoice_Number"],
            ];

            let invoiceNum = "";
            for (let val of possibleValues) {
              if (val !== undefined && val !== null && val !== "") {
                invoiceNum = val.toString().trim();
                break;
              }
            }

            // Remove # symbol if present
            if (invoiceNum.startsWith("#")) {
              invoiceNum = invoiceNum.substring(1);
            }

            console.log(
              `🔍 Found sent invoice: "${invoiceNum}" (legacy format)`
            );
            return invoiceNum;
          }
        })
        .filter((num) => num !== "")
    );

    console.log(`📋 Sent invoice numbers for this customer:`, [
      ...sentInvoiceNumbers,
    ]);

    // Filter out already sent current invoices
    const unsentCurrentInvoices = currentInvoices.filter((invoice) => {
      let invoiceNum = (
        invoice.Num ||
        invoice.num ||
        invoice.Number ||
        invoice.number ||
        ""
      )
        .toString()
        .trim();

      // Remove # symbol if present
      if (invoiceNum.startsWith("#")) {
        invoiceNum = invoiceNum.substring(1);
      }

      const isSent = sentInvoiceNumbers.has(invoiceNum);
      console.log(
        `🔍 Current invoice "${invoiceNum}" - Already sent: ${isSent}`
      );

      // Special check for invoice 14413
      if (invoiceNum === "14413") {
        console.log(`🚨 SPECIAL CHECK FOR 14413:`);
        console.log(`🚨 Invoice number: "${invoiceNum}"`);
        console.log(`🚨 Sent invoice numbers:`, [...sentInvoiceNumbers]);
        console.log(`🚨 Has 14413:`, sentInvoiceNumbers.has("14413"));
        console.log(`🚨 Has #14413:`, sentInvoiceNumbers.has("#14413"));
      }

      return !isSent;
    });

    console.log(`📋 Current invoices: ${currentInvoices.length}`);
    console.log(`📋 Unsent current invoices: ${unsentCurrentInvoices.length}`);

    if (unsentCurrentInvoices.length === 0) {
      console.log(
        "📧 Skipping current email - all current invoices already sent"
      );
      return null;
    }

    // Generate email for unsent current invoices only
    console.log("📧 Generating current invoice email");
    return generateCurrentOnlyEmail(customer, unsentCurrentInvoices);
  };

  const generateOverdueInvoiceEmail = (customer, overdueInvoices) => {
    // Categorize overdue invoices by age
    const categorizedInvoices = categorizeInvoicesByAge(overdueInvoices);

    // Determine tone based on most severe overdue category
    const hasCriticallyOverdue = categorizedInvoices.days91Plus.length > 0;
    const hasExtremelyOverdue = categorizedInvoices.days61to90.length > 0;
    const hasLongOverdue = categorizedInvoices.days31to60.length > 0;

    let greeting, introduction, closingRequest, signature;

    if (hasCriticallyOverdue) {
      greeting = `Dear ${customer},`;
      introduction = `This is an urgent and final reminder regarding your account. Several invoices are critically past due and require your immediate attention.`;
      closingRequest = `IMMEDIATE ACTION REQUIRED: Please settle the overdue balance or reply to this email so we can arrange payment. If no response is given, we may have to proceed with further collection measures without additional notice.`;
      signature = `Urgently,\nAccounts Receivable Department`;
    } else if (hasExtremelyOverdue) {
      greeting = `Dear ${customer},`;
      introduction = `We are reaching out regarding invoices on your account that are now extremely overdue and must be addressed without delay.`;
      closingRequest = `These invoices require immediate resolution. Please make payment promptly or reply to this email so we can discuss your account and prevent further action. If no response is given, we may have to proceed with further collection measures.`;
      signature = `Sincerely,\nAccounts Receivable Department`;
    } else if (hasLongOverdue) {
      greeting = `Dear ${customer},`;
      introduction = `We are contacting you about invoices on your account that have remained unpaid for an extended period. Your prompt attention to this matter is necessary.`;
      closingRequest = `Please arrange payment for the overdue balance as soon as possible. If you are experiencing difficulties or need options, simply reply to this email so we can work out a solution together.`;
      signature = `Respectfully,\nAccounts Receivable Department`;
    } else {
      greeting = `Dear ${customer},`;
      introduction = `We hope you are doing well. This is a courteous reminder that invoices on your account remain unpaid beyond their due date.`;
      closingRequest = `We kindly ask that you send payment for the outstanding balance at your earliest convenience. If you have any questions or need assistance, just reply to this email and I’ll be glad to help.`;
      signature = `Best regards,\nAccounts Receivable Department`;
    }

    let emailContent = `<div style="font-family: Calibri, Arial, sans-serif; font-size: 14pt; line-height: 1.4;">
${greeting}
<br><br>
${introduction}
<br><br>
Below are your outstanding overdue invoices:
<br><br>`;

    // Add each category if it has invoices (most overdue first)
    const categoryLabels = [
      {
        key: "days91Plus",
        label: "CRITICALLY OVERDUE INVOICES",
        bgColor: "#dc3545",
      },
      {
        key: "days61to90",
        label: "EXTREMELY OVERDUE INVOICES",
        bgColor: "#dc3545",
      },
      { key: "days31to60", label: "LONG OVERDUE INVOICES", bgColor: "#dc3545" },
      { key: "days1to30", label: "OVERDUE INVOICES", bgColor: "#dc3545" },
    ];

    categoryLabels.forEach(({ key, label, bgColor }) => {
      const categoryInvoices = categorizedInvoices[key];
      if (categoryInvoices.length > 0) {
        emailContent += `
<p style="margin: 16px 0 8px 0;">
  <span style="background-color: ${bgColor}; color: white; padding: 6px 12px; border-radius: 4px; font-weight: bold; font-size: 10pt;">${label}</span>
</p>
<ul style="margin: 8px 0; padding-left: 24px;">`;

        categoryInvoices.forEach((invoice) => {
          const dueDate = new Date(
            invoice["Due date"] || invoice["due date"] || invoice.duedate
          );
          const invoiceNum =
            invoice.Num ||
            invoice.num ||
            invoice.Number ||
            invoice.number ||
            "N/A";
          const dueDateStr = dueDate.toLocaleDateString();

          emailContent += `
  <li style="margin-bottom: 4px;">
    <strong>Invoice #${invoiceNum}</strong> | Overdue since: <strong>${dueDateStr}</strong>
  </li>`;
        });

        emailContent += `
</ul>`;
      }
    });

    emailContent += `
<br>
${closingRequest}`;

    // Add email signature if provided
    if (emailSignature) {
      emailContent += `<br><br>${emailSignature}`;
    }

    emailContent += `</div>`;

    const totalAmount = overdueInvoices.reduce(
      (sum, inv) => sum + (parseFloat(inv.Amount || inv.amount) || 0),
      0
    );

    return {
      customer,
      content: emailContent,
      totalAmount,
      totalInvoices: overdueInvoices.length,
      overdueCount: overdueInvoices.length,
      overdueAmount: totalAmount,
      emailType: "overdue",
      invoicesData: overdueInvoices,
    };
  };

  const generateCustomerEmailWithTracking = (
    customer,
    invoices,
    sentInvoicesData
  ) => {
    const categorizedInvoices = categorizeInvoicesByAge(invoices);

    // Check if customer has overdue invoices
    const hasOverdueInvoices = [
      "days1to30",
      "days31to60",
      "days61to90",
      "days91Plus",
    ].some((category) => categorizedInvoices[category].length > 0);

    // Create a set of sent invoice numbers
    console.log(`🔍 Checking sent invoices for customer: ${customer}`);
    console.log(`🔍 SentInvoicesData sample:`, sentInvoicesData.slice(0, 3));

    const sentInvoiceNumbers = new Set(
      sentInvoicesData
        .map((entry) => {
          if (typeof entry === "string") {
            // Simple format: just invoice number
            let invoiceNum = entry.toString().trim();
            if (invoiceNum.startsWith("#")) {
              invoiceNum = invoiceNum.substring(1);
            }
            console.log(`🔍 Found sent invoice: "${invoiceNum}"`);
            return invoiceNum;
          } else {
            // Legacy format: object with multiple columns
            const possibleValues = [
              entry["Invoice Number"],
              entry.invoiceNumber,
              entry.Num,
              entry.num,
              entry["Invoice Num"],
              entry.InvoiceNumber,
              entry["Invoice_Number"],
            ];

            let invoiceNum = "";
            for (let val of possibleValues) {
              if (val !== undefined && val !== null && val !== "") {
                invoiceNum = val.toString().trim();
                break;
              }
            }

            // Remove # symbol if present
            if (invoiceNum.startsWith("#")) {
              invoiceNum = invoiceNum.substring(1);
            }

            console.log(
              `🔍 Found sent invoice: "${invoiceNum}" (legacy format)`
            );
            return invoiceNum;
          }
        })
        .filter((num) => num !== "")
    );

    console.log(`📋 Customer: ${customer}`);
    console.log(`📋 Has overdue invoices: ${hasOverdueInvoices}`);
    console.log(`📋 Sent invoice numbers for this customer:`, [
      ...sentInvoiceNumbers,
    ]);
    console.log(`📋 Total invoices for customer:`, invoices.length);
    invoices.forEach((inv) => {
      let invNum = (inv.Num || inv.num || inv.Number || inv.number || "")
        .toString()
        .trim();

      // Remove # symbol if present
      if (invNum.startsWith("#")) {
        invNum = invNum.substring(1);
      }

      const isSent = sentInvoiceNumbers.has(invNum);
      console.log(`📋 Invoice "${invNum}" - Sent: ${isSent}`);

      // Special check for invoice 14413
      if (invNum === "14413") {
        console.log(`🚨 FOUND 14413 IN CURRENT INVOICES!`);
        console.log(`🚨 Raw invoice data:`, inv);
        console.log(`🚨 Processed number: "${invNum}"`);
        console.log(`🚨 Is in sent list: ${isSent}`);
      }
    });

    if (hasOverdueInvoices) {
      // Scenario 2 & 3: Customer has overdue invoices - always send email with all invoices
      console.log(
        "📧 Generating email for customer with overdue invoices (includes all invoices)"
      );
      return generateCustomerEmail(customer, invoices);
    } else {
      // Scenario 1: Customer has only current invoices - check sent tracking
      const currentInvoices = categorizedInvoices.current;

      // Filter out already sent current invoices
      const unsentCurrentInvoices = currentInvoices.filter((invoice) => {
        let invoiceNum = (
          invoice.Num ||
          invoice.num ||
          invoice.Number ||
          invoice.number ||
          ""
        )
          .toString()
          .trim();

        // Remove # symbol if present
        if (invoiceNum.startsWith("#")) {
          invoiceNum = invoiceNum.substring(1);
        }

        const isSent = sentInvoiceNumbers.has(invoiceNum);
        console.log(
          `🔍 Current invoice "${invoiceNum}" - Already sent: ${isSent}`
        );

        // Special check for invoice 14413
        if (invoiceNum === "14413") {
          console.log(`🚨 SPECIAL CHECK FOR 14413:`);
          console.log(`🚨 Invoice number: "${invoiceNum}"`);
          console.log(`🚨 Sent invoice numbers:`, [...sentInvoiceNumbers]);
          console.log(`🚨 Has 14413:`, sentInvoiceNumbers.has("14413"));
          console.log(`🚨 Has #14413:`, sentInvoiceNumbers.has("#14413"));
        }

        return !isSent;
      });

      console.log(`📋 Current invoices: ${currentInvoices.length}`);
      console.log(
        `📋 Unsent current invoices: ${unsentCurrentInvoices.length}`
      );

      if (unsentCurrentInvoices.length === 0) {
        // No unsent current invoices - skip email
        console.log("📧 Skipping email - all current invoices already sent");
        return null;
      } else {
        // Generate email for unsent current invoices only
        console.log("📧 Generating email for unsent current invoices only");
        return generateCurrentOnlyEmail(customer, unsentCurrentInvoices);
      }
    }
  };

  const generateCurrentOnlyEmail = (customer, currentInvoices) => {
    const totalAmount = currentInvoices.reduce(
      (sum, inv) => sum + (parseFloat(inv.Amount || inv.amount) || 0),
      0
    );
    const totalInvoices = currentInvoices.length;

    const greeting = `Hello ${customer},`;
    const introduction = `We hope this message finds you well. New invoices have been issued to your account for your review.`;
   const closingRequest = `These invoices are not yet due, and payment is kindly requested by the dates shown above. If you have any questions or need clarification, simply reply to this email and we will be happy to assist.`;
    const signature = `Warm regards,\nAccounts Receivable Department`;

    let emailContent = `<div style="font-family: Calibri, Arial, sans-serif; font-size: 14pt; line-height: 1.4;">
${greeting}
<br><br>
${introduction}
<br><br>
Below are your newly sent invoices:
<br><br>
<p style="margin: 16px 0 8px 0; font-weight: bold; color: #0066cc;">CURRENT INVOICES:</p>
<ul style="margin: 8px 0; padding-left: 24px;">`;

    currentInvoices.forEach((invoice) => {
      const dueDate = new Date(
        invoice["Due date"] || invoice["due date"] || invoice.duedate
      ).toLocaleDateString();
      const invoiceNum =
        invoice.Num || invoice.num || invoice.Number || invoice.number || "N/A";
      emailContent += `
  <li style="margin-bottom: 4px;">
    <strong>Invoice #${invoiceNum}</strong> | Due on: <strong>${dueDate}</strong>
  </li>`;
    });

    emailContent += `
</ul>`;

    emailContent += `
<br>
${closingRequest}`;

    // Add email signature if provided
    if (emailSignature) {
      emailContent += `<br><br>${emailSignature}`;
    }

    emailContent += `</div>`;

    return {
      customer,
      content: emailContent,
      totalAmount,
      totalInvoices,
      overdueCount: 0,
      overdueAmount: 0,
      emailType: "current",
      currentInvoicesOnly: true,
      unsentInvoices: currentInvoices,
    };
  };

  const generateCustomerEmail = (customer, invoices) => {
    const categorizedInvoices = categorizeInvoicesByAge(invoices);
    const totalAmount = invoices.reduce(
      (sum, inv) => sum + (parseFloat(inv.Amount || inv.amount) || 0),
      0
    );
    const totalInvoices = invoices.length;

    let overdueCount = 0;
    let overdueAmount = 0;

    // Count overdue invoices (anything past due)
    ["days1to30", "days31to60", "days61to90", "days91Plus"].forEach(
      (category) => {
        overdueCount += categorizedInvoices[category].length;
        overdueAmount += categorizedInvoices[category].reduce(
          (sum, inv) => sum + (parseFloat(inv.Amount || inv.amount) || 0),
          0
        );
      }
    );

    // Determine severity level for tone adjustment
    const hasCriticallyOverdue = categorizedInvoices.days91Plus.length > 0;
    const hasExtremelyOverdue = categorizedInvoices.days61to90.length > 0;
    const hasLongOverdue = categorizedInvoices.days31to60.length > 0;
    const hasOverdue = categorizedInvoices.days1to30.length > 0;
    const onlyCurrentInvoices = overdueCount === 0;

    let greeting, introduction, closingRequest, signature;

    // Adjust tone based on severity
    if (hasCriticallyOverdue) {
      // Hardest tone for 90+ days
      greeting = `Dear ${customer},`;
      introduction = `This is an urgent notice regarding your account with us. You have critically overdue invoices that require immediate attention.`;
      closingRequest = `IMMEDIATE ACTION REQUIRED: These overdue amounts must be resolved without further delay. Please contact our accounts receivable department immediately to arrange payment or discuss your account status. Failure to respond may result in additional collection actions.`;
      signature = `Urgently,\nAccounts Receivable Department`;
    } else if (hasExtremelyOverdue) {
      // Hard tone for 60-90 days
      greeting = `Dear ${customer},`;
      introduction = `We are writing to address the extremely overdue invoices on your account that require urgent attention.`;
      closingRequest = `These invoices are significantly past due and require immediate payment. Please remit payment or contact our accounts receivable department within 48 hours to discuss your account status.`;
      signature = `Sincerely,\nAccounts Receivable Department`;
    } else if (hasLongOverdue) {
      // Firm tone for 30-60 days
      greeting = `Dear ${customer},`;
      introduction = `We are writing regarding the long overdue invoices on your account that need immediate attention.`;
      closingRequest = `Please arrange for immediate payment of these overdue balances. If you have any questions or need to discuss payment arrangements, please contact our accounts receivable department promptly.`;
      signature = `Respectfully,\nAccounts Receivable Department`;
    } else if (hasOverdue) {
      // Standard reminder tone for 1-30 days
      greeting = `Dear ${customer},`;
      introduction = `We hope this message finds you well. We are writing to remind you of overdue invoices on your account.`;
      closingRequest = `We kindly request that you remit payment for the overdue balances at your earliest convenience. If you have any questions or concerns about these invoices, please don't hesitate to contact our accounts receivable department.`;
      signature = `Best regards,\nAccounts Receivable Department`;
    } else {
      // Light tone for current invoices only
      greeting = `Hello ${customer},`;
      introduction = `We hope you're doing well! This is a friendly reminder about your current invoices with us.`;
      closingRequest = `Thank you for your continued business. Please remit payment by the due dates shown below. As always, if you have any questions about these invoices, feel free to reach out to our accounts receivable team.`;
      signature = `Warm regards,\nAccounts Receivable Department`;
    }

    let emailContent = `<div style="font-family: Calibri, Arial, sans-serif; font-size: 14pt; line-height: 1.4;">
${greeting}
<br><br>
${introduction}
<br><br>
Below are your outstanding invoices:
<br><br>`;

    // Add each category if it has invoices with updated labels (most overdue first)
    const categoryLabels = [
      {
        key: "days91Plus",
        label: "CRITICALLY OVERDUE INVOICES",
        bgColor: "#dc3545",
      },
      {
        key: "days61to90",
        label: "EXTREMELY OVERDUE INVOICES",
        bgColor: "#dc3545",
      },
      { key: "days31to60", label: "LONG OVERDUE INVOICES", bgColor: "#dc3545" },
      { key: "days1to30", label: "OVERDUE INVOICES", bgColor: "#dc3545" },
      { key: "current", label: "CURRENT INVOICES", bgColor: null },
    ];

    categoryLabels.forEach(({ key, label, bgColor }) => {
      const categoryInvoices = categorizedInvoices[key];
      if (categoryInvoices.length > 0) {
        if (bgColor) {
          // Overdue categories with red background
          emailContent += `
<p style="margin: 16px 0 8px 0;">
  <span style="background-color: ${bgColor}; color: white; padding: 6px 12px; border-radius: 4px; font-weight: bold; font-size: 10pt;">${label}</span>
</p>`;
        } else {
          // Current invoices with blue styling
          emailContent += `
<p style="margin: 16px 0 8px 0; font-weight: bold; color: #0066cc;">${label}:</p>`;
        }

        emailContent += `<ul style="margin: 8px 0; padding-left: 24px;">`;

        categoryInvoices.forEach((invoice) => {
          const dueDate = new Date(
            invoice["Due date"] || invoice["due date"] || invoice.duedate
          );
          const invoiceNum =
            invoice.Num ||
            invoice.num ||
            invoice.Number ||
            invoice.number ||
            "N/A";
          const today = new Date();
          const isOverdue = dueDate < today;
          const dueDateStr = dueDate.toLocaleDateString();

          if (isOverdue) {
            emailContent += `
  <li style="margin-bottom: 4px;">
    <strong>Invoice #${invoiceNum}</strong> | Overdue since: <strong>${dueDateStr}</strong>
  </li>`;
          } else {
            emailContent += `
  <li style="margin-bottom: 4px;">
    <strong>Invoice #${invoiceNum}</strong> | Due on: <strong>${dueDateStr}</strong>
  </li>`;
          }
        });

        emailContent += `
</ul>`;
      }
    });

    emailContent += `
<br>
${closingRequest}`;

    // Add email signature if provided
    if (emailSignature) {
      emailContent += `<br><br>${emailSignature}`;
    }

    emailContent += `</div>`;

    return {
      customer,
      content: emailContent,
      totalAmount,
      totalInvoices,
      overdueCount,
      overdueAmount,
      invoicesData: invoices,
    };
  };

  const nextEmail = () => {
    if (currentEmailIndex < processedEmails.length - 1) {
      setCurrentEmailIndex(currentEmailIndex + 1);
    } else {
      // End of current phase, switch to next phase
      switchToNextPhase();
    }
  };

  const prevEmail = () => {
    if (currentEmailIndex > 0) {
      setCurrentEmailIndex(currentEmailIndex - 1);
    } else if (currentPhase === "overdue" && currentEmails.length > 0) {
      // If at beginning of overdue phase, switch back to current phase
      setCurrentPhase("current");
      setProcessedEmails(currentEmails);
      setCurrentEmailIndex(currentEmails.length - 1); // Go to last current email
    }
  };

  const switchToNextPhase = () => {
    if (currentPhase === "current" && overdueEmails.length > 0) {
      // Switch from current to overdue
      setCurrentPhase("overdue");
      setProcessedEmails(overdueEmails);
      setCurrentEmailIndex(0);
    }
    // If we're already in overdue phase, we're done
  };

  const markSentAndNext = () => {
    const currentEmail = processedEmails[currentEmailIndex];
    if (!currentEmail) return;

    // Update sent invoices data
    const newSentEntries = [];
    const today = new Date().toLocaleDateString();

    if (currentEmail.currentInvoicesOnly && currentEmail.unsentInvoices) {
      // For current-only emails, mark the unsent invoices as sent
      currentEmail.unsentInvoices.forEach((invoice) => {
        const invoiceNum =
          invoice.Num ||
          invoice.num ||
          invoice.Number ||
          invoice.number ||
          "N/A";
        newSentEntries.push(invoiceNum);
      });
    } else {
      // For mixed or overdue emails, mark current invoices as sent (if any)
      const categorizedInvoices = categorizeInvoicesByAge(
        currentEmail.invoicesData || []
      );
      if (
        categorizedInvoices.current &&
        categorizedInvoices.current.length > 0
      ) {
        categorizedInvoices.current.forEach((invoice) => {
          const invoiceNum =
            invoice.Num ||
            invoice.num ||
            invoice.Number ||
            invoice.number ||
            "N/A";
          newSentEntries.push(invoiceNum);
        });
      }
    }

    // Update the sent invoices data in memory - convert to simple format
    const updatedSentInvoicesData = [
      ...sentInvoicesData.map((entry) =>
        typeof entry === "string"
          ? entry
          : entry.Num || entry["Invoice Number"] || entry.invoiceNumber || ""
      ),
      ...newSentEntries,
    ].filter(Boolean);
    setSentInvoicesData(updatedSentInvoicesData);

    // Add to pending entries for batch update
    setPendingSentEntries((prev) => [...prev, ...newSentEntries]);

    // Move to next email
    nextEmail();
  };

  const exportUpdatedSentInvoices = () => {
    if (pendingSentEntries.length === 0) {
      alert("No new entries to save!");
      return;
    }

    try {
      // Convert simple invoice numbers array to worksheet format
      const worksheetData = sentInvoicesData.map((invoiceNum) => ({
        "Invoice Number": invoiceNum,
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "SentInvoices");

      // Always export as "SentInvoices.xlsx" for easy replacement
      XLSX.writeFile(workbook, "SentInvoices.xlsx");

      alert(
        `✅ Exported complete SentInvoices.xlsx file!\n\n📊 Total entries: ${sentInvoicesData.length}\n📝 New entries added: ${pendingSentEntries.length}\n\n📁 Replace your original SentInvoices.xlsx with the downloaded file.`
      );

      // Clear pending entries
      setPendingSentEntries([]);
    } catch (error) {
      alert("Error exporting file.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            📧 Invoice Email Generator
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Automatically generate professional customer emails with aging
            invoice details
          </p>
        </div>

        {/* File Upload Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-3 rounded-lg mr-4">
                <svg
                  className="w-6 h-6 text-blue-600"
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
                  Invoice Data File
                </h2>
                <p className="text-sm text-gray-500">
                  Upload your cleaned invoice Excel file
                </p>
              </div>
            </div>
            <div className="relative">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => handleFileUpload(e, "invoice")}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-blue-400 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            {invoiceFile && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800 flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {invoiceFile.name}
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 p-3 rounded-lg mr-4">
                <svg
                  className="w-6 h-6 text-red-600"
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
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  No Contact Customers
                </h2>
                <p className="text-sm text-gray-500">
                  Upload file with customers to exclude
                </p>
              </div>
            </div>
            <div className="relative">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => handleFileUpload(e, "noContact")}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-red-400 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
              />
            </div>
            {noContactFile && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800 flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {noContactFile.name}
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              <div className="bg-green-100 p-3 rounded-lg mr-4">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Sent Invoices Tracker
                </h2>
                <p className="text-sm text-gray-500">
                  Upload file to track sent invoices (optional)
                </p>
              </div>
            </div>
            <div className="relative">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => handleFileUpload(e, "sentInvoices")}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-green-400 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
            </div>
            {sentInvoicesFile && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800 flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {sentInvoicesFile.name}
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              <div className="bg-purple-100 p-3 rounded-lg mr-4">
                <svg
                  className="w-6 h-6 text-purple-600"
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
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Customer Emails
                </h2>
                <p className="text-sm text-gray-500">
                  Upload file with saved customer emails (optional)
                </p>
              </div>
            </div>
            <div className="relative">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => handleFileUpload(e, "customerEmails")}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-purple-400 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
            </div>
            {customerEmailsFile && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800 flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {customerEmailsFile.name}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Email Signature Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex items-center mb-4">
            <div className="bg-purple-100 p-3 rounded-lg mr-4">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Email Signature
              </h2>
              <p className="text-sm text-gray-500">
                Paste your Outlook signature here (with formatting and images)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paste Your Signature Here
              </label>
              <div
                className="w-full min-h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                contentEditable
                suppressContentEditableWarning={true}
                onInput={(e) => setEmailSignature(e.target.innerHTML)}
                style={{
                  maxHeight: "200px",
                  overflowY: "auto",
                  backgroundColor: "white",
                }}
                placeholder="Right-click and paste your formatted signature from Outlook here..."
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 Tip: Copy your signature from Outlook and paste it here.
                Images and formatting will be preserved!
              </p>
            </div>

            {/* Preview Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Signature Preview
              </label>
              <div className="w-full min-h-32 p-4 border border-gray-200 rounded-lg bg-gray-50">
                {emailSignature ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: emailSignature }}
                    style={{ fontSize: "14px", lineHeight: "1.4" }}
                  />
                ) : (
                  <p className="text-gray-400 text-sm italic">
                    Your signature preview will appear here...
                  </p>
                )}
              </div>
            </div>
          </div>

          {emailSignature && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800 flex items-center">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Signature ready! It will be automatically added to all generated
                emails.
              </p>
            </div>
          )}
        </div>

        {/* Export Updates Section */}
        {pendingSentEntries.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-orange-100 p-2 rounded-lg mr-3">
                  <svg
                    className="w-5 h-5 text-orange-600"
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
                </div>
                <div>
                  <p className="text-orange-800 font-medium">Updates Pending</p>
                  <p className="text-sm text-orange-600">
                    📝 {pendingSentEntries.length} pending entries to save
                  </p>
                </div>
              </div>
              <button
                onClick={exportUpdatedSentInvoices}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
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
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export Updates
              </button>
            </div>
          </div>
        )}

        {/* Export Customer Emails Section */}
        {pendingCustomerEmailEntries.length > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-purple-100 p-2 rounded-lg mr-3">
                  <svg
                    className="w-5 h-5 text-purple-600"
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
                </div>
                <div>
                  <p className="text-purple-800 font-medium">Customer Emails Ready</p>
                  <p className="text-sm text-purple-600">
                    📧 {pendingCustomerEmailEntries.length} customer email addresses to save
                  </p>
                </div>
              </div>
              <button
                onClick={exportCustomerEmails}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
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
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export Customer Emails
              </button>
            </div>
          </div>
        )}

        {/* No Contact Customers Display */}
        {removedNoContactCustomers.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
            <div className="flex items-center mb-4">
              <div className="bg-gray-100 p-2 rounded-lg mr-3">
                <svg
                  className="w-5 h-5 text-gray-600"
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
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  No Contact Customers Removed
                </h3>
                <p className="text-sm text-gray-600">
                  These customers were found in your invoices but excluded from
                  emails
                </p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {removedNoContactCustomers.map((customer, index) => (
                  <div
                    key={index}
                    className="text-sm text-gray-700 bg-gray-50 px-3 py-1 rounded-lg"
                  >
                    {customer}
                  </div>
                ))}
              </div>
              <div className="mt-3 text-sm text-gray-500">
                Total removed: {removedNoContactCustomers.length} customers
              </div>
            </div>
          </div>
        )}

        {/* Skipped Current/Sent Customers Display */}
        {skippedCurrentSentCustomers.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-blue-800">
                  Current Invoices Already Sent
                </h3>
                <p className="text-sm text-blue-600">
                  These customers had current invoices but all were already sent
                  previously
                </p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {skippedCurrentSentCustomers.map((customer, index) => (
                  <div
                    key={index}
                    className="text-sm text-blue-700 bg-blue-50 px-3 py-1 rounded-lg"
                  >
                    {customer}
                  </div>
                ))}
              </div>
              <div className="mt-3 text-sm text-blue-500">
                Total skipped: {skippedCurrentSentCustomers.length} customers
              </div>
            </div>
          </div>
        )}

        {/* Generate Button - Hide after clicking */}
        {!isCollectingEmails && processedEmails.length === 0 && (
          <div className="flex justify-center mb-10">
            <button
              onClick={processFiles}
              disabled={!invoiceFile || !noContactFile || isProcessing}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 min-w-[200px]"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing Files...
                </div>
              ) : (
                "✨ Generate Emails"
              )}
            </button>
          </div>
        )}

        {/* Email Collection Phase */}
        {isCollectingEmails && (
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden mb-8">
            <div className="px-8 py-6 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">
                    Customer Email Setup
                  </h2>
                  <p className="text-gray-600">
                    Configure email addresses for invoice delivery
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Progress</div>
                  <div className="text-lg font-bold text-gray-800">
                    {currentCustomerIndex + 1} of {customersList.length}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {Object.keys(customerEmailData).filter(key => customerEmailData[key]?.email).length} pre-filled
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="mb-8">
                <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-blue-600"
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
                <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
                  {customersList[currentCustomerIndex]}
                </h3>
                <p className="text-gray-600 text-center">
                  {customerEmailData[customersList[currentCustomerIndex]]?.email 
                    ? 'Email pre-filled from uploaded file - review and update if needed'
                    : 'Configure email delivery settings for this customer'
                  }
                </p>
                {customerEmailData[customersList[currentCustomerIndex]]?.email && (
                  <div className="flex justify-center mt-2">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      ✓ Pre-filled from file
                    </span>
                  </div>
                )}
              </div>

              <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    Primary Email Address *
                  </label>
                  <input
                    type="email"
                    value={
                      customerEmailData[customersList[currentCustomerIndex]]
                        ?.email || ""
                    }
                    onChange={(e) =>
                      setCustomerEmailData((prev) => ({
                        ...prev,
                        [customersList[currentCustomerIndex]]: {
                          ...prev[customersList[currentCustomerIndex]],
                          email: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 text-lg"
                    placeholder="Enter customer email address"
                    required
                  />
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    CC Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={
                      customerEmailData[customersList[currentCustomerIndex]]
                        ?.cc || ""
                    }
                    onChange={(e) =>
                      setCustomerEmailData((prev) => ({
                        ...prev,
                        [customersList[currentCustomerIndex]]: {
                          ...prev[customersList[currentCustomerIndex]],
                          cc: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 text-lg"
                    placeholder="Enter CC email address (optional)"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-10 max-w-2xl mx-auto">
                <button
                  onClick={() => {
                    if (currentCustomerIndex > 0) {
                      setCurrentCustomerIndex(currentCustomerIndex - 1);
                    }
                  }}
                  disabled={currentCustomerIndex === 0}
                  className="flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                >
                  <svg
                    className="w-5 h-5 mr-2"
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

                <button
                  onClick={() => {
                    const currentCustomer = customersList[currentCustomerIndex];
                    const emailData = customerEmailData[currentCustomer];

                    if (!emailData?.email || emailData.email.trim() === "") {
                      alert("Please enter an email for this customer");
                      return;
                    }

                    if (currentCustomerIndex < customersList.length - 1) {
                      setCurrentCustomerIndex(currentCustomerIndex + 1);
                    } else {
                      // All customers processed, generate emails
                      generateEmailsAfterCollection();
                    }
                  }}
                  className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium shadow-lg"
                >
                  {currentCustomerIndex < customersList.length - 1 ? (
                    <>
                      Next
                      <svg
                        className="w-5 h-5 ml-2"
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
                    </>
                  ) : (
                    <>
                      Generate Emails
                      <svg
                        className="w-5 h-5 ml-2"
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
                    </>
                  )}
                </button>
              </div>

              {/* Progress bar */}
              <div className="mt-8 max-w-2xl mx-auto">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${
                        ((currentCustomerIndex + 1) / customersList.length) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>Customer Setup</span>
                  <span>
                    {Math.round(
                      ((currentCustomerIndex + 1) / customersList.length) * 100
                    )}
                    % Complete
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Email Results */}
        {processedEmails.length > 0 && (
          <div
            className={`rounded-2xl shadow-2xl border overflow-hidden ${
              currentPhase === "current"
                ? "bg-white border-gray-100"
                : "bg-white border-gray-100"
            }`}
          >
            {/* Email Header */}
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
                    Email {currentEmailIndex + 1} of {processedEmails.length}{" "}
                    customers
                    {currentPhase === "current" && overdueEmails.length > 0 && (
                      <span className="ml-2 text-sm">
                        • {overdueEmails.length} overdue emails to follow
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={copyEmailToClipboard}
                    className="flex items-center px-5 py-2.5 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors font-medium shadow-sm"
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
                    onClick={prevEmail}
                    disabled={
                      currentEmailIndex === 0 &&
                      !(currentPhase === "overdue" && currentEmails.length > 0)
                    }
                    className="flex items-center px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
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
                  {currentPhase === "current" && (
                    <button
                      onClick={markSentAndNext}
                      disabled={
                        currentEmailIndex === processedEmails.length - 1 &&
                        overdueEmails.length === 0
                      }
                      className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
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
                    onClick={nextEmail}
                    disabled={
                      currentEmailIndex === processedEmails.length - 1 &&
                      (currentPhase === "overdue" || overdueEmails.length === 0)
                    }
                    className={`flex items-center px-5 py-2.5 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm ${
                      currentPhase === "current"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-orange-600 hover:bg-orange-700"
                    }`}
                  >
                    {currentEmailIndex === processedEmails.length - 1 &&
                    currentPhase === "current" &&
                    overdueEmails.length > 0
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

            {/* Customer Info */}
            {processedEmails[currentEmailIndex] && (
              <>
                {/* Email Stats - Moved to top */}
                <div
                  className={`px-6 py-4 border-b ${
                    currentPhase === "current"
                      ? "bg-blue-50 border-blue-100"
                      : "bg-orange-50 border-orange-100"
                  }`}
                >
                  <h3
                    className={`text-xl font-bold mb-4 ${
                      currentPhase === "current"
                        ? "text-blue-900"
                        : "text-orange-900"
                    }`}
                  >
                    {processedEmails[currentEmailIndex].customer}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div
                      className={`bg-white p-4 rounded-xl border-2 ${
                        currentPhase === "current"
                          ? "border-blue-200"
                          : "border-orange-200"
                      } shadow-sm`}
                    >
                      <p
                        className={`font-semibold ${
                          currentPhase === "current"
                            ? "text-blue-600"
                            : "text-orange-600"
                        }`}
                      >
                        Total Amount
                      </p>
                      <p
                        className={`text-xl font-bold ${
                          currentPhase === "current"
                            ? "text-blue-900"
                            : "text-orange-900"
                        }`}
                      >
                        $
                        {processedEmails[currentEmailIndex].totalAmount.toFixed(
                          2
                        )}
                      </p>
                    </div>
                    <div
                      className={`bg-white p-4 rounded-xl border-2 ${
                        currentPhase === "current"
                          ? "border-blue-200"
                          : "border-orange-200"
                      } shadow-sm`}
                    >
                      <p
                        className={`font-semibold ${
                          currentPhase === "current"
                            ? "text-blue-600"
                            : "text-orange-600"
                        }`}
                      >
                        Total Invoices
                      </p>
                      <p
                        className={`text-xl font-bold ${
                          currentPhase === "current"
                            ? "text-blue-900"
                            : "text-orange-900"
                        }`}
                      >
                        {processedEmails[currentEmailIndex].totalInvoices}
                      </p>
                    </div>
                    {currentPhase === "overdue" && (
                      <>
                        <div className="bg-white p-4 rounded-xl border-2 border-orange-200 shadow-sm">
                          <p className="text-orange-600 font-semibold">
                            Overdue Count
                          </p>
                          <p className="text-xl font-bold text-orange-900">
                            {processedEmails[currentEmailIndex].overdueCount}
                          </p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border-2 border-orange-200 shadow-sm">
                          <p className="text-orange-600 font-semibold">
                            Overdue Amount
                          </p>
                          <p className="text-xl font-bold text-orange-900">
                            $
                            {processedEmails[
                              currentEmailIndex
                            ].overdueAmount.toFixed(2)}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Email Title and Customer Contact Info */}
                <div
                  className={`px-6 py-4 border-b ${
                    currentPhase === "current"
                      ? "bg-slate-50 border-slate-200"
                      : "bg-red-50 border-red-100"
                  }`}
                >
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      Email Subject:
                    </h4>
                    <div
                      className={`p-4 rounded-xl font-semibold text-lg ${
                        currentPhase === "current"
                          ? "bg-blue-100 text-blue-800 border-2 border-blue-200"
                          : "bg-red-100 text-red-800 border-2 border-red-200"
                      }`}
                    >
                      {processedEmails[currentEmailIndex].emailTitle}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        To:
                      </h4>
                      <div className="p-3 bg-white rounded-xl border-2 border-gray-200">
                        <span className="text-gray-900 font-mono text-lg">
                          {processedEmails[currentEmailIndex].customerEmail ||
                            "Not set"}
                        </span>
                      </div>
                    </div>

                    {processedEmails[currentEmailIndex].customerCC && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          CC:
                        </h4>
                        <div className="p-3 bg-white rounded-xl border-2 border-gray-200">
                          <span className="text-gray-900 font-mono text-lg">
                            {processedEmails[currentEmailIndex].customerCC}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Email Content */}
                <div className="bg-gray-50">
                  {emailSignature ||
                  processedEmails[currentEmailIndex].content.includes(
                    '<div style="font-family: Calibri'
                  ) ? (
                    // If signature is present or HTML content, render as HTML to preserve formatting
                    <div
                      className="w-full min-h-96 p-8 text-gray-800 bg-white leading-relaxed"
                      style={{
                        fontFamily: "Calibri, Arial, sans-serif",
                        fontSize: "14pt",
                        lineHeight: "1.6",
                        maxWidth: "none",
                      }}
                      dangerouslySetInnerHTML={{
                        __html: processedEmails[currentEmailIndex].content,
                      }}
                    />
                  ) : (
                    // If no signature and plain text, render as div with Calibri font
                    <div
                      className="w-full min-h-96 p-8 text-gray-800 bg-white leading-relaxed whitespace-pre-wrap"
                      style={{
                        fontFamily: "Calibri, Arial, sans-serif",
                        fontSize: "14pt",
                        lineHeight: "1.6",
                      }}
                    >
                      {processedEmails[currentEmailIndex].content}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
