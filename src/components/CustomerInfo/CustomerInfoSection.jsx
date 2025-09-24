"use client";

import CustomerInfoCard from './CustomerInfoCard';

/**
 * Section containing customer information cards
 * @param {Object} props - Component props
 * @param {Array} props.removedNoContactCustomers - Customers removed due to no-contact list
 * @param {Array} props.skippedCurrentSentCustomers - Customers skipped because invoices already sent
 * @returns {JSX.Element} Customer info section component
 */
const CustomerInfoSection = ({
  removedNoContactCustomers,
  skippedCurrentSentCustomers
}) => {
  const userIcon = (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );

  const checkIcon = (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );

  return (
    <>
      <CustomerInfoCard
        title="No Contact Customers Removed"
        description="These customers were found in your invoices but excluded from emails"
        customers={removedNoContactCustomers}
        bgColor="bg-gray-50"
        borderColor="border-gray-200"
        textColor="text-gray-600"
        accentColor="text-gray-700"
        icon={userIcon}
      />

      <CustomerInfoCard
        title="Current Invoices Already Sent"
        description="These customers had current invoices but all were already sent previously"
        customers={skippedCurrentSentCustomers}
        bgColor="bg-blue-50"
        borderColor="border-blue-200"
        textColor="text-blue-600"
        accentColor="text-blue-700"
        icon={checkIcon}
      />
    </>
  );
};

export default CustomerInfoSection;