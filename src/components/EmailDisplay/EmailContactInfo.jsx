"use client";

/**
 * Email contact information display component
 * @param {Object} props - Component props
 * @param {string} props.currentPhase - Current phase (current/overdue)
 * @param {Object} props.email - Email object with contact info
 * @returns {JSX.Element} Email contact info component
 */
const EmailContactInfo = ({ currentPhase, email }) => {
  const { emailTitle, customerEmail, customerCC } = email;

  return (
    <div
      className={`px-6 py-4 border-b ${
        currentPhase === "current"
          ? "bg-slate-50 border-slate-200"
          : "bg-red-50 border-red-100"
      }`}
    >
      {/* Email Subject */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          Email Subject:
        </h4>
        <div
          className={`p-4 rounded-xl font-semibold text-lg ${
            currentPhase === "current"
              ? "bg-blue-50 text-blue-800 border border-blue-100"
              : "bg-red-50 text-red-800 border border-red-100"
          }`}
        >
          {emailTitle}
        </div>
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* To Field */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            To:
          </h4>
          <div className="p-3 bg-white rounded-xl border border-gray-100">
            <span className="text-gray-900 font-mono text-lg">
              {customerEmail || "Not set"}
            </span>
          </div>
        </div>

        {/* CC Field */}
        {customerCC && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              CC:
            </h4>
            <div className="p-3 bg-white rounded-xl border border-gray-100">
              <span className="text-gray-900 font-mono text-lg">
                {customerCC}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailContactInfo;