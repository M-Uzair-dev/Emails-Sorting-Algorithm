/**
 * Calculates the number of days past due for an invoice
 * @param {string|Date} dueDate - The due date of the invoice
 * @returns {number} Number of days past due (negative if not yet due)
 */
export const calculateDaysPastDue = (dueDate) => {
  const due = new Date(dueDate);
  const today = new Date();

  if (isNaN(due.getTime())) {
    return 0;
  }

  const diffTime = today - due;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Categorizes invoices by their age (current, overdue by different ranges)
 * @param {Array} invoices - Array of invoice objects
 * @returns {Object} Object containing categorized invoice arrays
 */
export const categorizeInvoicesByAge = (invoices) => {
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
 * Extracts invoice number from an invoice object
 * @param {Object} invoice - Invoice object
 * @returns {string} Invoice number or "N/A"
 */
export const getInvoiceNumber = (invoice) => {
  return (
    invoice.Num ||
    invoice.num ||
    invoice.Number ||
    invoice.number ||
    "N/A"
  ).toString().trim();
};

/**
 * Normalizes invoice number by removing # prefix if present
 * @param {string} invoiceNum - Raw invoice number
 * @returns {string} Normalized invoice number
 */
export const normalizeInvoiceNumber = (invoiceNum) => {
  let normalized = invoiceNum.toString().trim();
  if (normalized.startsWith("#")) {
    normalized = normalized.substring(1);
  }
  return normalized;
};

/**
 * Gets customer name from invoice object using various possible field names
 * @param {Object} invoice - Invoice object
 * @returns {string} Customer name
 */
export const getCustomerName = (invoice) => {
  return (
    invoice["Customer full name"] ||
    invoice["Customer"] ||
    invoice["customer"] ||
    ""
  ).toString().trim();
};

/**
 * Validates if a string is a valid URL
 * @param {string} url - URL string to validate
 * @returns {boolean} True if valid URL, false otherwise
 */
export const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Filters invoices based on criteria (removes no-contact customers, validates amounts)
 * @param {Array} invoices - Array of invoice objects
 * @param {Set} noContactCustomers - Set of customer names to exclude
 * @returns {Object} Object containing filtered invoices and removed customers
 */
export const filterInvoices = (invoices, noContactCustomers) => {
  const removedCustomers = [];

  const filteredInvoices = invoices.filter((row) => {
    const customer = getCustomerName(row).toLowerCase();
    const originalCustomer = getCustomerName(row);
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

  return {
    filteredInvoices,
    removedCustomers,
  };
};

/**
 * Groups invoices by customer name
 * @param {Array} invoices - Array of invoice objects
 * @returns {Object} Object with customer names as keys and invoice arrays as values
 */
export const groupInvoicesByCustomer = (invoices) => {
  const grouped = {};
  invoices.forEach((invoice) => {
    const customer = getCustomerName(invoice);
    if (!grouped[customer]) {
      grouped[customer] = [];
    }
    grouped[customer].push(invoice);
  });
  return grouped;
};

/**
 * Processes sent invoices data and normalizes invoice numbers
 * @param {Array} rawData - Raw sent invoices data
 * @returns {Set} Set of normalized invoice numbers
 */
export const processSentInvoicesData = (rawData) => {
  return new Set(
    rawData
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
};