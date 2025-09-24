"use client";

/**
 * Navigation buttons for email collection phase
 * @param {Object} props - Component props
 * @param {number} props.currentIndex - Current customer index
 * @param {number} props.totalCustomers - Total number of customers
 * @param {Function} props.onPrevious - Previous button handler
 * @param {Function} props.onNext - Next button handler
 * @param {boolean} props.canProceed - Whether user can proceed to next
 * @returns {JSX.Element} Email collection navigation component
 */
const EmailCollectionNavigation = ({
  currentIndex,
  totalCustomers,
  onPrevious,
  onNext,
  canProceed
}) => {
  const isFirstCustomer = currentIndex === 0;
  const isLastCustomer = currentIndex === totalCustomers - 1;

  return (
    <div className="flex items-center justify-between mt-6 max-w-xl mx-auto">
      <button
        onClick={onPrevious}
        disabled={isFirstCustomer}
        className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors font-medium text-sm"
      >
        <svg
          className="w-4 h-4 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Previous
      </button>

      <button
        onClick={onNext}
        disabled={!canProceed}
        className="flex items-center px-4 py-2 text-white rounded-lg hover:scale-105 active:scale-95 transition-all font-medium text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: canProceed
            ? "linear-gradient(to right, #6366f1, #8b5cf6)"
            : "#9CA3AF",
        }}
      >
        {isLastCustomer ? (
          <>
            Generate Emails
            <svg
              className="w-5 h-5 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </>
        ) : (
          <>
            Next
            <svg
              className="w-4 h-4 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </>
        )}
      </button>
    </div>
  );
};

export default EmailCollectionNavigation;