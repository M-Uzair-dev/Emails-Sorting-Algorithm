"use client";

/**
 * Customer information display card
 * @param {Object} props - Component props
 * @param {string} props.title - Card title
 * @param {string} props.description - Card description
 * @param {Array} props.customers - Array of customer names
 * @param {string} props.bgColor - Background color class
 * @param {string} props.borderColor - Border color class
 * @param {string} props.textColor - Text color class
 * @param {string} props.accentColor - Accent color class
 * @param {JSX.Element} props.icon - Icon component
 * @returns {JSX.Element} Customer info card component
 */
const CustomerInfoCard = ({
  title,
  description,
  customers,
  bgColor,
  borderColor,
  textColor,
  accentColor,
  icon
}) => {
  if (customers.length === 0) return null;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className={`${bgColor} border ${borderColor} rounded-xl p-6 mb-8`}>
      <div className="flex items-center mb-4">
        <div className={`bg-opacity-20 p-2 rounded-lg mr-3`} style={{ backgroundColor: 'currentColor' }}>
          <div className={textColor}>
            {icon}
          </div>
        </div>
        <div>
          <h3 className={`text-lg font-bold ${textColor.replace('-600', '-800')}`}>
            {title}
          </h3>
          <p className={`text-sm ${textColor}`}>
            {description}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {customers.map((customer, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-gray-100 px-3 py-1 rounded-lg group hover:bg-gray-200 transition-colors"
            >
              <span className={`text-sm ${accentColor}`}>
                {customer}
              </span>
              <button
                onClick={() => copyToClipboard(customer)}
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1 hover:bg-gray-300 rounded"
                title="Copy customer name"
              >
                <svg
                  className="w-3.5 h-3.5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
        <div className={`mt-3 text-sm ${textColor}`}>
          Total {title.toLowerCase()}: {customers.length} customers
        </div>
      </div>
    </div>
  );
};

export default CustomerInfoCard;