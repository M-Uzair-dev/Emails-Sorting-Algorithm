"use client";

/**
 * Email signature input component with preview
 * @param {Object} props - Component props
 * @param {string} props.signature - Current signature HTML
 * @param {Function} props.onSignatureChange - Signature change handler
 * @returns {JSX.Element} Email signature input component
 */
const EmailSignatureInput = ({ signature, onSignatureChange }) => {
  const handleInput = (e) => {
    onSignatureChange(e.target.innerHTML);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-4 hover:shadow-md transition-shadow">
      <div className="mb-3">
        <h2 className="text-sm font-bold text-gray-900 mb-1">
          Email Signature
        </h2>
        <p className="text-xs text-gray-600">
          Paste your Outlook signature here (with formatting and images)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Input Section */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Paste Your Signature Here
          </label>
          <div
            className="w-full min-h-24 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
            contentEditable
            suppressContentEditableWarning={true}
            onInput={handleInput}
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
            {signature ? (
              <div
                dangerouslySetInnerHTML={{ __html: signature }}
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

      {signature && (
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
            Signature ready! It will be automatically added to all
            generated emails.
          </p>
        </div>
      )}
    </div>
  );
};

export default EmailSignatureInput;