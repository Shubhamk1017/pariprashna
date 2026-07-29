import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ShlokaTag from './ShlokaTag';

const wrapStyle = { overflowWrap: 'anywhere', wordBreak: 'break-word', whiteSpace: 'pre-wrap', maxWidth: '100%' };

const SHLOKA_REF_REGEX = /@([A-Za-z]{1,20})[\s.]+([A-Za-z0-9]+)(?:[\s.]+(\d+)(?:[\s.]+(\d+))?)?/g;

function splitContent(content, shlokaReferences) {
  if (!content) return [{ type: 'text', content: '' }];
  const shlokaMap = {};
  if (shlokaReferences) {
    for (const s of shlokaReferences) { if (s.raw) shlokaMap[s.raw.toLowerCase()] = s; }
  }
  const segments = [];
  let lastIndex = 0;
  let match;
  SHLOKA_REF_REGEX.lastIndex = 0;
  while ((match = SHLOKA_REF_REGEX.exec(content)) !== null) {
    if (match.index > lastIndex) segments.push({ type: 'text', content: content.slice(lastIndex, match.index) });
    const raw = match[0];
    const shloka = shlokaMap[raw.toLowerCase()];
    segments.push({ type: 'shloka', raw, shloka: shloka || null });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) segments.push({ type: 'text', content: content.slice(lastIndex) });
  if (segments.length === 0) segments.push({ type: 'text', content });
  return segments;
}

const InlineMarkdown = ({ content }) => {
  if (!content) return null;
  return (
    <span style={wrapStyle}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <span style={wrapStyle}>{children}</span>,
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            if (!inline && match) {
              return (<SyntaxHighlighter style={tomorrow} language={match[1]} PreTag="span" customStyle={{ display: 'inline', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxWidth: '100%', fontSize: '0.75rem' }} {...props}>{String(children).replace(/\n$/, '')}</SyntaxHighlighter>);
            }
            return <code className={className} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.75rem' }} {...props}>{children}</code>;
          },
          pre: ({ children }) => <span style={wrapStyle}>{children}</span>,
          h1: ({ children }) => <strong className="text-base">{children}</strong>,
          h2: ({ children }) => <strong className="text-sm">{children}</strong>,
          h3: ({ children }) => <strong>{children}</strong>,
          ul: ({ children }) => <span style={wrapStyle}>{children}</span>,
          ol: ({ children }) => <span style={wrapStyle}>{children}</span>,
          li: ({ children }) => <span className="block" style={wrapStyle}>• {children}</span>,
          blockquote: ({ children }) => <span className="italic text-gray-600 border-l-2 border-gray-300 pl-2" style={wrapStyle}>{children}</span>,
          hr: () => <span className="block border-t border-gray-200 my-1" />,
          em: ({ children }) => <em className="text-gray-500 text-xs">{children}</em>,
        }}
      >{content}</ReactMarkdown>
    </span>
  );
};

const DisclaimerBanner = ({ content }) => (
  <div className="mt-6 p-4 bg-orange-50 border-2 border-orange-300 rounded-lg shadow-sm">
    <div className="text-sm text-orange-900 leading-relaxed">
      <ReactMarkdown components={{ p: ({ children }) => <p className="m-0">{children}</p>, strong: ({ children }) => <strong className="font-bold text-orange-950">{children}</strong> }}>{content}</ReactMarkdown>
    </div>
  </div>
);

const AnswerBodyWithShlokas = ({ content, shlokaReferences, stripCodeBlocks }) => {
  let mainContent = content;
  let disclaimerContent = null;
  if (content && content.includes('[AI_DISCLAIMER]')) {
    const parts = content.split('[AI_DISCLAIMER]');
    const innerParts = parts[1]?.split('[/AI_DISCLAIMER]');
    if (innerParts && innerParts.length >= 1) { disclaimerContent = innerParts[0].trim(); mainContent = parts[0]?.trim() || ''; }
  }
  const segments = useMemo(() => splitContent(mainContent, shlokaReferences), [mainContent, shlokaReferences]);
  return (
    <div className="text-gray-800 text-sm leading-relaxed break-words" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
      {segments.map((seg, i) => {
        if (seg.type === 'text') {
          if (stripCodeBlocks) return <span key={i} style={wrapStyle}>{seg.content}</span>;
          return <InlineMarkdown key={i} content={seg.content} />;
        }
        if (!seg.shloka) return <span key={i} className="text-orange-700 font-medium">{seg.raw}</span>;
        return <ShlokaTag key={i} shloka={seg.shloka} />;
      })}
      {disclaimerContent && <DisclaimerBanner content={disclaimerContent} />}
    </div>
  );
};

export default AnswerBodyWithShlokas;
