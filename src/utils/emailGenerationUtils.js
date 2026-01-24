import {
  categorizeInvoicesByAge,
  getInvoiceNumber,
  normalizeInvoiceNumber,
  processSentInvoicesData
} from './invoiceUtils';

/**
 * Email tone configurations for different overdue severities
 */
const EMAIL_TONES = {
  CRITICALLY_OVERDUE: {
    greeting: (customer) => `Dear ${customer},`,
    introduction: `This notice concerns invoices on your account that remain critically overdue despite prior reminders.`,
    closingRequest: `Immediate action is required. Please remit payment in full or reply today to confirm how this balance will be resolved. If we do not hear from you, the account will move forward to the next stage of our collections process without further notice.`,
    signature: `Accounts Receivable Department`,
  },

  EXTREMELY_OVERDUE: {
    greeting: (customer) => `Dear ${customer},`,
    introduction: `We are following up regarding invoices on your account that are now extremely overdue.`,
    closingRequest: `Please submit payment promptly or reply to discuss resolution options. Continued non-response will result in further action being taken on the account.`,
    signature: `Accounts Receivable Department`
  },

  LONG_OVERDUE: {
    greeting: (customer) => `Dear ${customer},`,
    introduction: `Our records show that several invoices on your account have remained unpaid for an extended period.`,
    closingRequest: `We ask that you arrange payment as soon as possible. If there are any issues or you need assistance, please reply so we can work toward a resolution.`,
    signature: `Accounts Receivable Department`
  },

  OVERDUE: {
    greeting: (customer) => `Dear ${customer},`,
    introduction: `This is a reminder that invoices on your account are now past their due dates.`,
    closingRequest: `Please send payment at your earliest convenience. If you have questions or believe this notice was sent in error, feel free to reply to this email.`,
    signature: `Accounts Receivable Department`
  },

  CURRENT: {
    greeting: (customer) => `Hello ${customer},`,
    introduction: `New invoices have been issued to your account and are available for review.`,
    closingRequest: `These invoices are not yet due. Payment is requested by the due dates listed. If you need clarification or assistance, just reply and we’ll be happy to help.`,
    signature: `Accounts Receivable Department`
  }
};


/**
 * Category labels for email display
 */
const CATEGORY_LABELS = [
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
  {
    key: "days31to60",
    label: "LONG OVERDUE INVOICES",
    bgColor: "#dc3545"
  },
  {
    key: "days1to30",
    label: "OVERDUE INVOICES",
    bgColor: "#dc3545"
  },
  {
    key: "current",
    label: "CURRENT INVOICES",
    bgColor: null
  },
];

/**
 * Determines the appropriate email tone based on invoice categories
 * @param {Object} categorizedInvoices - Categorized invoices object
 * @returns {Object} Email tone configuration
 */
const determineEmailTone = (categorizedInvoices) => {
  const hasCriticallyOverdue = categorizedInvoices.days91Plus.length > 0;
  const hasExtremelyOverdue = categorizedInvoices.days61to90.length > 0;
  const hasLongOverdue = categorizedInvoices.days31to60.length > 0;
  const hasOverdue = categorizedInvoices.days1to30.length > 0;

  if (hasCriticallyOverdue) {
    return EMAIL_TONES.CRITICALLY_OVERDUE;
  } else if (hasExtremelyOverdue) {
    return EMAIL_TONES.EXTREMELY_OVERDUE;
  } else if (hasLongOverdue) {
    return EMAIL_TONES.LONG_OVERDUE;
  } else if (hasOverdue) {
    return EMAIL_TONES.OVERDUE;
  } else {
    return EMAIL_TONES.CURRENT;
  }
};

/**
 * Generates HTML content for invoice list items
 * @param {Array} invoices - Array of invoices
 * @param {Object} customerEmailData - Customer email data with invoice links
 * @param {boolean} isOverdue - Whether invoices are overdue
 * @returns {string} HTML string for invoice list
 */
const generateInvoiceListHTML = (invoices, customerEmailData, isOverdue = false) => {
  return invoices.map(invoice => {
    const dueDate = new Date(
      invoice["Due date"] || invoice["due date"] || invoice.duedate
    );
    const invoiceNum = getInvoiceNumber(invoice);
    const dueDateStr = dueDate.toLocaleDateString();
    const invoiceLink = customerEmailData?.invoiceLinks?.[invoiceNum];

    const dateLabel = isOverdue ? "Overdue since" : "Due on";

    if (invoiceLink && invoiceLink.trim() !== "") {
      return `
  <li style="margin-bottom: 4px;">
    <strong>Invoice #${invoiceNum}</strong> | ${dateLabel}: <strong>${dueDateStr}</strong> | <a href="${invoiceLink}" target="_blank" style="color: #007bff; text-decoration: none;">View & Pay Invoice</a>
  </li>`;
    } else {
      return `
  <li style="margin-bottom: 4px;">
    <strong>Invoice #${invoiceNum}</strong> | ${dateLabel}: <strong>${dueDateStr}</strong>
  </li>`;
    }
  }).join('');
};

/**
 * Generates email content for current invoices only
 * @param {string} customer - Customer name
 * @param {Array} currentInvoices - Array of current invoices
 * @param {Object} customerEmailData - Customer email data
 * @param {string} emailSignature - Email signature HTML
 * @returns {Object} Email object with content and metadata
 */
export const generateCurrentOnlyEmail = (
  customer,
  currentInvoices,
  customerEmailData,
  emailSignature = ""
) => {
  const totalAmount = currentInvoices.reduce(
    (sum, inv) => sum + (parseFloat(inv.Amount || inv.amount) || 0),
    0
  );
  const totalInvoices = currentInvoices.length;

  const tone = EMAIL_TONES.CURRENT;

  let emailContent = `<div style="font-family: Calibri, Arial, sans-serif; font-size: 14pt; line-height: 1.4;">
${tone.greeting(customer)}
<br><br>
${tone.introduction}
<br><br>
Below are your newly sent invoices:
<br><br>
<p style="margin: 16px 0 8px 0; font-weight: bold; color: #0066cc;">CURRENT INVOICES:</p>
<ul style="margin: 8px 0; padding-left: 24px;">`;

  emailContent += generateInvoiceListHTML(currentInvoices, customerEmailData, false);

  emailContent += `
</ul>
<br>
${tone.closingRequest}`;

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

/**
 * Generates email content for overdue invoices
 * @param {string} customer - Customer name
 * @param {Array} overdueInvoices - Array of overdue invoices
 * @param {Object} customerEmailData - Customer email data
 * @param {string} emailSignature - Email signature HTML
 * @returns {Object} Email object with content and metadata
 */
export const generateOverdueInvoiceEmail = (
  customer,
  overdueInvoices,
  customerEmailData,
  emailSignature = ""
) => {
  const categorizedInvoices = categorizeInvoicesByAge(overdueInvoices);
  const tone = determineEmailTone(categorizedInvoices);

  let emailContent = `<div style="font-family: Calibri, Arial, sans-serif; font-size: 14pt; line-height: 1.4;">
${tone.greeting(customer)}
<br><br>
${tone.introduction}
<br><br>
Below are your outstanding overdue invoices:
<br><br>`;

  // Add each category if it has invoices (most overdue first)
  CATEGORY_LABELS.forEach(({ key, label, bgColor }) => {
    const categoryInvoices = categorizedInvoices[key];
    if (categoryInvoices.length > 0 && key !== 'current') {
      emailContent += `
<p style="margin: 16px 0 8px 0;">
  <span style="background-color: ${bgColor}; color: white; padding: 6px 12px; border-radius: 4px; font-weight: bold; font-size: 12pt;">${label}</span>
</p>
<ul style="margin: 8px 0; padding-left: 24px;">`;

      emailContent += generateInvoiceListHTML(categoryInvoices, customerEmailData, true);

      emailContent += `
</ul>`;
    }
  });

  emailContent += `
<br>
${tone.closingRequest}`;

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

/**
 * Generates email for current invoices with sent tracking
 * @param {string} customer - Customer name
 * @param {Array} currentInvoices - Array of current invoices
 * @param {Array} sentInvoicesData - Array of sent invoice data
 * @param {Object} customerEmailData - Customer email data
 * @param {string} emailSignature - Email signature HTML
 * @returns {Object|null} Email object or null if no unsent invoices
 */
export const generateCurrentInvoiceEmail = (
  customer,
  currentInvoices,
  sentInvoicesData,
  customerEmailData,
  emailSignature = ""
) => {
  console.log(`🔍 Checking sent invoices for customer: ${customer}`);

  const sentInvoiceNumbers = processSentInvoicesData(sentInvoicesData);
  console.log(`📋 Sent invoice numbers for this customer:`, [...sentInvoiceNumbers]);

  // Filter out already sent current invoices
  const unsentCurrentInvoices = currentInvoices.filter((invoice) => {
    const invoiceNum = normalizeInvoiceNumber(getInvoiceNumber(invoice));
    const isSent = sentInvoiceNumbers.has(invoiceNum);
    console.log(`🔍 Current invoice "${invoiceNum}" - Already sent: ${isSent}`);
    return !isSent;
  });

  console.log(`📋 Current invoices: ${currentInvoices.length}`);
  console.log(`📋 Unsent current invoices: ${unsentCurrentInvoices.length}`);

  if (unsentCurrentInvoices.length === 0) {
    console.log("📧 Skipping current email - all current invoices already sent");
    return null;
  }

  console.log("📧 Generating current invoice email");
  return generateCurrentOnlyEmail(
    customer,
    unsentCurrentInvoices,
    customerEmailData,
    emailSignature
  );
};

/**
 * Gets the highest overdue category for determining email tone
 * @param {Array} overdueInvoices - Array of overdue invoices
 * @returns {string} Highest severity category description
 */
export const getHighestOverdueCategory = (overdueInvoices) => {
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

/**
 * Copies email content to clipboard with proper formatting
 * @param {Object} email - Email object
 * @returns {Promise<boolean>} Success status
 */
export const copyEmailToClipboard = async (email) => {
  if (!email) return false;

  try {
    const emailTitle = email.emailTitle || "Email - Vein360";

    const headerInfo = `Email Title: ${emailTitle}\n\nTo: ${
      email.customerEmail || "Not set"
    }${
      email.customerCC ? `\nCC: ${email.customerCC}` : ""
    }\n\n--- EMAIL CONTENT ---\n\n`;

    const htmlContent = headerInfo + email.content;

    const clipboardItem = new ClipboardItem({
      "text/html": new Blob([htmlContent], { type: "text/html" }),
      "text/plain": new Blob(
        [htmlContent.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ")],
        { type: "text/plain" }
      ),
    });

    await navigator.clipboard.write([clipboardItem]);
    return true;
  } catch (err) {
    console.log("Rich HTML copy failed, trying fallback method...");

    try {
      await navigator.clipboard.writeText(email.content);
      return true;
    } catch (err2) {
      // Final fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = email.content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      return true;
    }
  }
};
