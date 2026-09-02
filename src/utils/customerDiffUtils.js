/**
 * Utilities for reconciling saved customer emails against a QuickBooks export.
 *
 * Both sides store multiple addresses in a single field, comma separated
 * ("ap@x.com, billing@x.com"), so every comparison here is list-aware:
 * split, trim, lowercase and sort before comparing. Plain string equality
 * reports dozens of false differences on identical data.
 *
 * QuickBooks holds no CC information at all, so CC is never read from the
 * export and never written by any function in this file.
 */

/**
 * Splits an address field into individual trimmed addresses
 * @param {string} value - Raw address field, possibly comma/semicolon separated
 * @returns {Array<string>} Array of addresses, original casing preserved
 */
export const parseEmailList = (value) =>
  (value || "")
    .toString()
    .split(/[,;]/)
    .map((address) => address.trim())
    .filter(Boolean);

/**
 * Normalizes an address field for comparison (lowercased, sorted)
 * @param {string} value - Raw address field
 * @returns {Array<string>} Normalized address array
 */
export const normalizeEmailList = (value) =>
  parseEmailList(value)
    .map((address) => address.toLowerCase())
    .sort();

/**
 * Compares two address fields ignoring order, casing and spacing
 * @param {string} a - First address field
 * @param {string} b - Second address field
 * @returns {boolean} True if both hold the same set of addresses
 */
export const emailListsMatch = (a, b) => {
  const listA = normalizeEmailList(a);
  const listB = normalizeEmailList(b);
  return (
    listA.length === listB.length &&
    listA.every((address, index) => address === listB[index])
  );
};

/**
 * Normalizes a customer name for use as a lookup key
 * @param {string} name - Customer name
 * @returns {string} Normalized key
 */
export const customerKey = (name) =>
  (name || "").toString().trim().toLowerCase();

/**
 * Builds a reviewable diff between saved customer emails and QuickBooks.
 *
 * Customers present in QuickBooks but absent from both the saved file and this
 * week's invoices are ignored entirely — a QuickBooks export carries hundreds
 * of legacy customers that will never be emailed.
 *
 * @param {Object} customerEmailData - Saved data, { customerName: { email, cc } }
 * @param {Object} quickBooksEmails - Export data, { customerName: email }
 * @param {Array<string>} invoiceCustomers - Customers in this week's invoices
 * @returns {Object} { changed, added, keptNotInQuickBooks, unchangedCount }
 */
export const buildCustomerEmailDiff = (
  customerEmailData = {},
  quickBooksEmails = {},
  invoiceCustomers = []
) => {
  const changed = [];
  const added = [];
  const keptNotInQuickBooks = [];
  let unchangedCount = 0;

  const quickBooksByKey = new Map();
  Object.entries(quickBooksEmails).forEach(([name, email]) => {
    quickBooksByKey.set(customerKey(name), { name, email });
  });

  // Existing saved customers: unchanged, changed, or absent from QuickBooks.
  Object.entries(customerEmailData).forEach(([customerName, data]) => {
    const match = quickBooksByKey.get(customerKey(customerName));

    // No QuickBooks record, or a record with no email: keep what we have.
    if (!match || parseEmailList(match.email).length === 0) {
      keptNotInQuickBooks.push(customerName);
      return;
    }

    if (emailListsMatch(data?.email, match.email)) {
      unchangedCount++;
      return;
    }

    changed.push({
      customerName,
      currentEmail: data?.email || "",
      quickBooksEmail: match.email,
      cc: data?.cc || "",
    });
  });

  // New customers, but only those actually invoiced this week.
  const savedKeys = new Set(Object.keys(customerEmailData).map(customerKey));
  const addedKeys = new Set();

  invoiceCustomers.forEach((customerName) => {
    const key = customerKey(customerName);
    if (savedKeys.has(key) || addedKeys.has(key)) return;

    const match = quickBooksByKey.get(key);
    if (!match || parseEmailList(match.email).length === 0) return;

    addedKeys.add(key);
    added.push({
      customerName,
      quickBooksEmail: match.email,
    });
  });

  return { changed, added, keptNotInQuickBooks, unchangedCount };
};

/**
 * Applies approved changes onto saved customer email data.
 * CC is carried through untouched — QuickBooks has no CC data to merge.
 *
 * @param {Object} customerEmailData - Existing saved data
 * @param {Array<Object>} approvedEntries - Entries with customerName + quickBooksEmail
 * @returns {Object} New customer email data object
 */
export const applyCustomerEmailChanges = (
  customerEmailData = {},
  approvedEntries = []
) => {
  const updated = { ...customerEmailData };

  approvedEntries.forEach(({ customerName, quickBooksEmail }) => {
    const existing = updated[customerName] || {};
    updated[customerName] = {
      ...existing,
      email: quickBooksEmail,
      cc: existing.cc || "",
    };
  });

  return updated;
};
