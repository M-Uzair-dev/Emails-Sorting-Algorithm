import * as XLSX from "xlsx-js-style";

/**
 * Processes WIP Excel file and adds status labels for no-contact customers
 * and customers with reminders already sent
 * @param {File} file - The WIP Excel file to process
 * @param {Array} noContactCustomers - Array of no-contact customer names
 * @param {Array} reminderSentCustomers - Array of customers with reminders already sent
 * @returns {Promise<Object>} Promise that resolves to { workbook, success, message }
 */
export const processWIPFile = async (
  file,
  noContactCustomers = [],
  reminderSentCustomers = []
) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: "binary" });

        // Find the "Collection Notes" sheet
        const sheetName = "Collection Notes";
        if (!workbook.SheetNames.includes(sheetName)) {
          reject(new Error(`Sheet "${sheetName}" not found in the file`));
          return;
        }

        const worksheet = workbook.Sheets[sheetName];

        // Convert sheet to JSON to work with it
        const range = XLSX.utils.decode_range(worksheet["!ref"]);

        // Normalize customer names for comparison
        const noContactSet = new Set(
          noContactCustomers.map((name) => name.trim().toLowerCase())
        );
        const reminderSentSet = new Set(
          reminderSentCustomers.map((name) => name.trim().toLowerCase())
        );

        let currentSection = null;
        let updatedCount = 0;

        // Iterate through rows
        for (let rowNum = range.s.r; rowNum <= range.e.r; rowNum++) {
          const cellA = worksheet[XLSX.utils.encode_cell({ r: rowNum, c: 0 })]; // Column A
          const cellB = worksheet[XLSX.utils.encode_cell({ r: rowNum, c: 1 })]; // Column B

          if (!cellA || !cellA.v) continue;

          const cellValue = cellA.v.toString().trim();

          // Check if this is a section header
          if (
            cellValue.includes("91 + Days") ||
            cellValue.includes("61-90 Days") ||
            cellValue.includes("1 - 30 Days") ||
            cellValue.includes("31 - 60 Days") ||
            cellValue.includes("Current")
          ) {
            // Determine current section
            if (cellValue.includes("Current")) {
              currentSection = "current";
            } else if (cellValue.includes("91")) {
              currentSection = "91+";
            } else if (cellValue.includes("61")) {
              currentSection = "61-90";
            } else if (cellValue.includes("31")) {
              currentSection = "31-60";
            } else if (cellValue.includes("1 -")) {
              currentSection = "1-30";
            }
            continue;
          }

          // Skip total rows
          if (cellValue.toLowerCase().includes("total")) {
            continue;
          }

          // Check if this row has an open balance (indicating it's a customer row)
          if (cellB && cellB.v && !isNaN(parseFloat(cellB.v))) {
            const customerName = cellValue.trim();
            const customerNameLower = customerName.toLowerCase();

            // Determine what status to add
            let statusLabel = null;

            // Priority 1: No Contact Customer (applies to all sections)
            if (noContactSet.has(customerNameLower)) {
              statusLabel = "No Contact Customer";
            }
            // Priority 2: Reminder Already Sent (only for Current section)
            else if (
              currentSection === "current" &&
              reminderSentSet.has(customerNameLower)
            ) {
              statusLabel = "Reminder Already Sent";
            }

            // Add status label to column C with color
            if (statusLabel) {
              const cellC = XLSX.utils.encode_cell({ r: rowNum, c: 2 }); // Column C

              // Determine color based on status
              let fillColor;
              if (statusLabel === "No Contact Customer") {
                fillColor = "808080"; // Dark grey
              } else if (statusLabel === "Reminder Already Sent") {
                fillColor = "6A0DAD"; // Dark purple
              }

              worksheet[cellC] = {
                t: "s",
                v: statusLabel,
                s: {
                  fill: {
                    fgColor: { rgb: fillColor }
                  },
                  font: {
                    color: { rgb: "FFFFFF" }, // White text
                    bold: true
                  },
                  alignment: {
                    horizontal: "center",
                    vertical: "center"
                  }
                }
              };
              updatedCount++;
            }
          }
        }

        // Update the range to include column C if we added data
        if (updatedCount > 0 && range.e.c < 2) {
          range.e.c = 2;
          worksheet["!ref"] = XLSX.utils.encode_range(range);
        }

        resolve({
          workbook,
          success: true,
          message: `Successfully updated ${updatedCount} customer status labels`,
          updatedCount,
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsBinaryString(file);
  });
};

/**
 * Downloads the processed WIP Excel file
 * @param {Object} workbook - XLSX workbook object
 * @param {string} originalFilename - Original filename
 */
export const downloadWIPFile = (workbook, originalFilename = "WIP.xlsx") => {
  // Generate a new filename with timestamp
  const timestamp = new Date().toISOString().split("T")[0];
  const filename = originalFilename.replace(
    /\.xlsx$/i,
    `_updated_${timestamp}.xlsx`
  );

  // Write file (xlsx-js-style automatically handles cell styles)
  XLSX.writeFile(workbook, filename);
};
