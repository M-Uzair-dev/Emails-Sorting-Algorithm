"use client";

/**
 * Application header component
 * @returns {JSX.Element} Header component
 */
const Header = () => {
  return (
    <div className="text-center mb-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Invoice Email Generator
        </h1>
        <p className="text-sm text-gray-600">
          Generate professional customer emails with invoice details
        </p>
      </div>
    </div>
  );
};

export default Header;