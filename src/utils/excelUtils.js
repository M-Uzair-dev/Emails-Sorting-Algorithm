import * as XLSX from "xlsx";

/**
 * Reads an Excel file and returns parsed JSON data
 * @param {File} file - The Excel file to read
 * @returns {Promise<Array>} Promise that resolves to array of parsed data
 */
export const readExcelFile = (file) => {
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

/**
 * Loads sent invoices from local storage or public folder
 * @returns {Promise<Array>} Promise that resolves to array of sent invoices
 */
export const loadSentInvoicesFromLocal = async () => {
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

/**
 * Exports data to Excel file
 * @param {Array} data - Data to export
 * @param {string} filename - Name of the file
 * @param {string} sheetName - Name of the sheet
 */
export const exportToExcel = (data, filename, sheetName) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
};

/**
 * Processes customer emails data from Excel format
 * @param {Array} rawData - Raw Excel data
 * @returns {Object} Processed customer email data object
 */
export const processCustomerEmailsData = (rawData) => {
  const processedEmails = {};
  rawData.forEach((entry) => {
    const customerName =
      entry["Customer Name"] ||
      entry.customerName ||
      entry.Customer ||
      "";
    const email = entry["Email"] || entry.email || "";
    const cc = entry["CC"] || entry.cc || entry.CC || "";

    if (customerName && email) {
      processedEmails[customerName] = {
        email: email,
        cc: cc,
      };
    }
  });
  return processedEmails;
};

/**
 * Processes invoice links data from Excel format
 * @param {Array} rawData - Raw Excel data
 * @returns {Object} Processed invoice links data object
 */
export const processInvoiceLinksData = (rawData) => {
  const processedLinks = {};
  rawData.forEach((entry) => {
    const invoiceNum =
      entry["Invoice"] ||
      entry.invoice ||
      entry.Invoice ||
      entry.Num ||
      "";
    const link =
      entry["Link"] || entry.link || entry.URL || entry.url || "";

    if (invoiceNum && link) {
      processedLinks[invoiceNum] = link;
    }
  });
  return processedLinks;
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