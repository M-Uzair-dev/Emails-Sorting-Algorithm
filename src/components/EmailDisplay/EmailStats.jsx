"use client";

/**
 * Email statistics display component
 * @param {Object} props - Component props
 * @param {string} props.currentPhase - Current phase (current/overdue)
 * @param {Object} props.email - Email object with stats
 * @returns {JSX.Element} Email stats component
 */
const EmailStats = ({ currentPhase, email }) => {
  const {
    customer,
    totalAmount,
    totalInvoices,
    overdueCount = 0,
    overdueAmount = 0
  } = email;

  return (
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
        {customer}
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        {/* Total Amount */}
        <div
          className={`bg-white p-4 rounded-xl border ${
            currentPhase === "current"
              ? "border-blue-100"
              : "border-orange-100"
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
            ${totalAmount.toFixed(2)}
          </p>
        </div>

        {/* Total Invoices */}
        <div
          className={`bg-white p-4 rounded-xl border ${
            currentPhase === "current"
              ? "border-blue-100"
              : "border-orange-100"
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
            {totalInvoices}
          </p>
        </div>

        {/* Overdue Stats - Only for overdue phase */}
        {currentPhase === "overdue" && (
          <>
            <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm">
              <p className="text-orange-600 font-semibold">
                Overdue Count
              </p>
              <p className="text-xl font-bold text-orange-900">
                {overdueCount}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm">
              <p className="text-orange-600 font-semibold">
                Overdue Amount
              </p>
              <p className="text-xl font-bold text-orange-900">
                ${overdueAmount.toFixed(2)}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmailStats;