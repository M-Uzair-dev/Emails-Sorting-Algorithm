"use client";

/**
 * Reusable export notification card
 * @param {Object} props - Component props
 * @param {string} props.title - Card title
 * @param {string} props.description - Card description
 * @param {string} props.iconColor - Icon color class
 * @param {string} props.bgColor - Background color class
 * @param {string} props.borderColor - Border color class
 * @param {Function} props.onExport - Export action handler
 * @param {string} props.buttonText - Export button text
 * @param {JSX.Element} props.icon - Icon component
 * @returns {JSX.Element} Export card component
 */
const ExportCard = ({
  title,
  description,
  iconColor,
  bgColor,
  borderColor,
  onExport,
  buttonText,
  icon
}) => {
  return (
    <div className={`${bgColor} border ${borderColor} rounded-xl p-4 mb-8`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`bg-opacity-20 p-2 rounded-lg mr-3`} style={{ backgroundColor: 'currentColor' }}>
            <div className={iconColor}>
              {icon}
            </div>
          </div>
          <div>
            <p className={`font-medium ${iconColor.replace('text-', 'text-').replace('-600', '-800')}`}>
              {title}
            </p>
            <p className={`text-sm ${iconColor.replace('-600', '-600')}`}>
              {description}
            </p>
          </div>
        </div>
        <button
          onClick={onExport}
          className="px-4 py-2 text-white rounded-lg hover:scale-105 active:scale-95 transition-all flex items-center shadow-md hover:shadow-lg"
          style={{
            background: "linear-gradient(to right, #6366f1, #8b5cf6)",
          }}
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default ExportCard;