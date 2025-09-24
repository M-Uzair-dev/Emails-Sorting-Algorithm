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
              className={`text-sm ${accentColor} bg-opacity-10 px-3 py-1 rounded-lg`}
              style={{ backgroundColor: 'currentColor' }}
            >
              {customer}
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