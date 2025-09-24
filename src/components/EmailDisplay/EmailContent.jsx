"use client";

/**
 * Email content display component
 * @param {Object} props - Component props
 * @param {Object} props.email - Email object with content
 * @param {string} props.emailSignature - Email signature HTML
 * @returns {JSX.Element} Email content component
 */
const EmailContent = ({ email, emailSignature }) => {
  const { content } = email;

  const hasSignatureOrHtml = emailSignature || content.includes('<div style="font-family: Calibri');

  return (
    <div className="bg-gray-50">
      {hasSignatureOrHtml ? (
        // If signature is present or HTML content, render as HTML to preserve formatting
        <div
          className="w-full min-h-96 p-8 text-gray-800 bg-white leading-relaxed"
          style={{
            fontFamily: "Calibri, Arial, sans-serif",
            fontSize: "14pt",
            lineHeight: "1.6",
            maxWidth: "none",
          }}
          dangerouslySetInnerHTML={{
            __html: content,
          }}
        />
      ) : (
        // If no signature and plain text, render as div with Calibri font
        <div
          className="w-full min-h-96 p-8 text-gray-800 bg-white leading-relaxed whitespace-pre-wrap"
          style={{
            fontFamily: "Calibri, Arial, sans-serif",
            fontSize: "14pt",
            lineHeight: "1.6",
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export default EmailContent;