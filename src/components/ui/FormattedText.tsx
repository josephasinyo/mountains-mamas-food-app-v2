import React from 'react';

interface FormattedTextProps {
  text?: string | null;
  className?: string;
}

/**
 * Safely parses and renders text with formatting (both HTML tags and Markdown):
 * - <strong>, <b>, **bold**
 * - <em>, <i>, *italic*, _italic_
 * - <mark>, ==highlight==
 * - <br>, \n
 */
export default function FormattedText({ text, className = '' }: FormattedTextProps) {
  if (!text) return null;

  // Check if string has HTML tags
  const hasHtml = /<(mark|strong|b|em|i|p|span|br)/i.test(text);

  if (hasHtml) {
    return (
      <span
        className={`formatted-text-content ${className} [&_mark]:bg-amber-100/95 [&_mark]:text-amber-950 [&_mark]:px-1.5 [&_mark]:py-0.5 [&_mark]:rounded [&_mark]:border [&_mark]:border-amber-300/60 [&_mark]:font-medium [&_mark]:inline-block [&_mark]:my-0.5 [&_strong]:font-bold [&_strong]:text-stone-900 [&_em]:italic [&_em]:text-stone-800`}
        dangerouslySetInnerHTML={{ __html: text }}
      />
    );
  }

  // Fallback to Markdown parser
  const lines = text.split('\n');

  return (
    <span className={className}>
      {lines.map((line, lineIndex) => (
        <React.Fragment key={lineIndex}>
          {lineIndex > 0 && <br />}
          {renderFormattedLine(line)}
        </React.Fragment>
      ))}
    </span>
  );
}

function renderFormattedLine(content: string): React.ReactNode[] {
  const pattern = /(==[\s\S]+?==|<mark[\s\S]*?>[\s\S]+?<\/mark>|\*\*[\s\S]+?\*\*|<b>[\s\S]+?<\/b>|<strong>[\s\S]+?<\/strong>|\*[\s\S]+?\*|_[\s\S]+?_|<i>[\s\S]+?<\/i>|<em>[\s\S]+?<\/em>)/g;

  const parts = content.split(pattern);

  return parts.map((part, index) => {
    if (!part) return null;

    // Highlight
    if ((part.startsWith('==') && part.endsWith('==') && part.length >= 4) ||
        (part.startsWith('<mark') && part.endsWith('</mark>'))) {
      const inner = part.startsWith('==') 
        ? part.slice(2, -2) 
        : part.replace(/^<mark[\s\S]*?>/, '').replace(/<\/mark>$/, '');
      return (
        <mark
          key={index}
          className="bg-amber-100/95 text-amber-950 font-medium px-1.5 py-0.5 rounded border border-amber-300/60 shadow-2xs inline-block my-0.5 leading-snug"
        >
          {renderFormattedLine(inner)}
        </mark>
      );
    }

    // Bold
    if ((part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
        (part.startsWith('<b>') && part.endsWith('</b>')) ||
        (part.startsWith('<strong>') && part.endsWith('</strong>'))) {
      const inner = part.startsWith('**') 
        ? part.slice(2, -2) 
        : part.startsWith('<b>') 
          ? part.slice(3, -4) 
          : part.slice(8, -9);
      return (
        <strong key={index} className="font-bold text-stone-900">
          {renderFormattedLine(inner)}
        </strong>
      );
    }

    // Italic
    if ((part.startsWith('*') && part.endsWith('*') && part.length >= 2 && !part.startsWith('**')) ||
        (part.startsWith('_') && part.endsWith('_') && part.length >= 2) ||
        (part.startsWith('<i>') && part.endsWith('</i>')) ||
        (part.startsWith('<em>') && part.endsWith('</em>'))) {
      const inner = (part.startsWith('<i>') || part.startsWith('<em>'))
        ? (part.startsWith('<i>') ? part.slice(3, -4) : part.slice(4, -5))
        : part.slice(1, -1);
      return (
        <em key={index} className="italic text-stone-800 font-normal">
          {renderFormattedLine(inner)}
        </em>
      );
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}
