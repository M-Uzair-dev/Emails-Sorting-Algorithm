"use client";

import FileUploadCard from './FileUploadCard';

/**
 * Grid container for file upload cards
 * @param {Object} props - Component props
 * @param {Object} props.files - Object containing file states
 * @param {Function} props.onFileChange - File change handler
 * @returns {JSX.Element} File upload grid component
 */
const FileUploadGrid = ({ files, onFileChange }) => {
  const fileConfigs = [
    {
      key: 'invoice',
      title: 'Invoice Data File',
      description: 'Upload your cleaned invoice Excel file',
      required: true
    },
    {
      key: 'noContact',
      title: 'No Contact Customers',
      description: 'Upload file with customers to exclude',
      required: true
    },
    {
      key: 'sentInvoices',
      title: 'Sent Invoices Tracker',
      description: 'Track sent invoices (optional)',
      required: false
    },
    {
      key: 'customerEmails',
      title: 'Customer Emails',
      description: 'Saved customer emails (optional)',
      required: false
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {fileConfigs.map(config => (
        <FileUploadCard
          key={config.key}
          title={config.title}
          description={config.description}
          file={files[config.key]}
          onFileChange={(file) => onFileChange(file, config.key)}
          required={config.required}
        />
      ))}
    </div>
  );
};

export default FileUploadGrid;