"use client";

/**
 * Invoice links file upload component
 * @param {Object} props - Component props
 * @param {File|null} props.file - Currently selected file
 * @param {Function} props.onFileChange - File change handler
 * @returns {JSX.Element} Invoice links upload component
 */
const InvoiceLinksUpload = ({ file, onFileChange }) => {
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    onFileChange(selectedFile);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-4 hover:shadow-md transition-shadow">
      <div className="mb-3">
        <h2 className="text-sm font-bold text-gray-900 mb-1">
          Invoice Links (Optional)
        </h2>
        <p className="text-xs text-gray-600">
          Upload file with saved invoice links for pre-filling
        </p>
      </div>

      <div className="relative">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="w-full p-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-700 hover:border-gray-400 transition-colors file:mr-2 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
        />
      </div>

      {file && (
        <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-100">
          <p className="text-xs text-green-700 flex items-center font-medium">
            <svg
              className="w-3 h-3 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {file.name}
          </p>
        </div>
      )}
    </div>
  );
};

export default InvoiceLinksUpload;