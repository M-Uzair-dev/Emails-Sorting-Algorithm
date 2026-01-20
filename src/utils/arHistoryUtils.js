/**
 * Initialize empty AR history structure
 * @returns {Object} Empty AR history
 */
export function initializeARHistory() {
  return {
    meta: {
      max_entries: 20,
      schema_version: "1.0",
      description: "AR run history using sliding window"
    },
    runs: []
  };
}

/**
 * Read AR history from uploaded JSON file
 * @param {File} file - JSON file to read
 * @returns {Promise<Object>} AR history object
 */
export async function readARHistoryFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const history = JSON.parse(e.target.result);
        // Validate structure
        if (!history.meta || !history.runs || !Array.isArray(history.runs)) {
          reject(new Error('Invalid AR history file structure'));
          return;
        }
        resolve(history);
      } catch (error) {
        reject(new Error('Failed to parse AR history file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read AR history file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Add current run to history with sliding window
 * @param {Object} history - Existing AR history
 * @param {Object} currentRun - Current run data
 * @returns {Object} Updated AR history
 */
export function addRunToHistory(history, currentRun) {
  const updatedHistory = { ...history };

  // Add current run
  updatedHistory.runs.push(currentRun);

  // Apply sliding window - remove oldest if exceeds max
  const maxEntries = updatedHistory.meta.max_entries || 20;
  if (updatedHistory.runs.length > maxEntries) {
    updatedHistory.runs.shift(); // Remove oldest
  }

  return updatedHistory;
}

/**
 * Download AR history as JSON file
 * @param {Object} history - AR history to download
 * @param {string} filename - Optional filename (default: ar-history.json)
 */
export function downloadARHistory(history, filename = 'ar-history.json') {
  const jsonString = JSON.stringify(history, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Get previous run data
 * @param {Object} history - AR history
 * @returns {Object|null} Previous run or null if no previous run
 */
export function getPreviousRun(history) {
  if (!history || !history.runs || history.runs.length < 2) {
    return null;
  }
  return history.runs[history.runs.length - 2];
}

/**
 * Get current (latest) run data
 * @param {Object} history - AR history
 * @returns {Object|null} Current run or null if no runs
 */
export function getCurrentRun(history) {
  if (!history || !history.runs || history.runs.length === 0) {
    return null;
  }
  return history.runs[history.runs.length - 1];
}
