"use client";

/**
 * Reusable button component with consistent styling
 * @param {Object} props - Component props
 * @param {string} props.variant - Button variant (primary, secondary, success)
 * @param {string} props.size - Button size (sm, md, lg)
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {boolean} props.loading - Whether button is loading
 * @param {Function} props.onClick - Click handler
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.children - Button content
 * @param {Object} props.style - Additional styles
 * @returns {JSX.Element} Button component
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  children,
  style = {},
  ...props
}) => {
  const baseClasses = 'font-medium rounded-lg transition-all inline-flex items-center justify-center';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-sm'
  };

  const variantClasses = {
    primary: 'text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
  };

  const variantStyles = {
    primary: {
      background: disabled ? "#9CA3AF" : "linear-gradient(to right, #6366f1, #8b5cf6)",
    },
    secondary: {},
    success: {}
  };

  const combinedClassName = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;
  const combinedStyle = { ...variantStyles[variant], ...style };

  return (
    <button
      className={combinedClassName}
      style={combinedStyle}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;