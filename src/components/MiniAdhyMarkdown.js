import React from 'react';

/**
 * Parses inline markdown tokens:
 * - ***bold italic***
 * - **bold** or __bold__
 * - *italic* or _italic_
 * - `inline code`
 * - [link text](url)
 * - plain URLs
 */
function parseInline(text) {
  if (!text || typeof text !== 'string') return text;

  // Regex token pattern for markdown inlines
  const tokenRegex = /(\*\*\*[\s\S]+?\*\*\*|\*\*[\s\S]+?\*\*|__[\s\S]+?__|(?<!\*)\*[^*]+?\*(?!\*)|(?<!_)_[^_]+?_(?!_)|`[^`]+?`|\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s<]+)/g;

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('***') && token.endsWith('***') && token.length > 6) {
      parts.push(
        <strong key={match.index} className="ma-md-bold">
          <em className="ma-md-italic">{parseInline(token.slice(3, -3))}</em>
        </strong>
      );
    } else if (
      ((token.startsWith('**') && token.endsWith('**')) ||
       (token.startsWith('__') && token.endsWith('__'))) &&
      token.length > 4
    ) {
      parts.push(
        <strong key={match.index} className="ma-md-bold">
          {parseInline(token.slice(2, -2))}
        </strong>
      );
    } else if (
      ((token.startsWith('*') && token.endsWith('*')) ||
       (token.startsWith('_') && token.endsWith('_'))) &&
      token.length > 2
    ) {
      parts.push(
        <em key={match.index} className="ma-md-italic">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      parts.push(
        <code key={match.index} className="ma-inline-code">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('[') && token.includes('](') && token.endsWith(')')) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        parts.push(
          <a
            key={match.index}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="ma-md-link"
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        parts.push(token);
      }
    } else if (token.startsWith('http://') || token.startsWith('https://')) {
      parts.push(
        <a
          key={match.index}
          href={token}
          target="_blank"
          rel="noopener noreferrer"
          className="ma-md-link"
        >
          {token}
        </a>
      );
    } else {
      parts.push(token);
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

/**
 * Beautiful, safe Markdown text renderer for Mini-Adhy chat messages.
 * Formats bold, italic, code blocks, bullet lists, numbered lists, and quotes.
 */
export const MiniAdhyFormattedText = ({ content = '' }) => {
  if (!content || typeof content !== 'string') return null;

  // Split by fenced code blocks: ```lang\ncode\n```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const segments = [];
  let lastIdx = 0;
  let codeMatch;

  while ((codeMatch = codeBlockRegex.exec(content)) !== null) {
    if (codeMatch.index > lastIdx) {
      segments.push({ type: 'text', value: content.substring(lastIdx, codeMatch.index) });
    }
    segments.push({
      type: 'code',
      lang: codeMatch[1] || '',
      code: codeMatch[2].replace(/\n$/, '')
    });
    lastIdx = codeBlockRegex.lastIndex;
  }
  if (lastIdx < content.length) {
    segments.push({ type: 'text', value: content.substring(lastIdx) });
  }

  return (
    <div className="ma-formatted-text">
      {segments.map((seg, sIdx) => {
        if (seg.type === 'code') {
          return (
            <div key={sIdx} className="ma-code-block-wrap">
              {seg.lang && <div className="ma-code-lang">{seg.lang}</div>}
              <pre className="ma-code-block">
                <code>{seg.code}</code>
              </pre>
            </div>
          );
        }

        const lines = seg.value.split('\n');
        const elements = [];
        let currentList = null;

        const flushList = () => {
          if (currentList) {
            if (currentList.type === 'ul') {
              elements.push(
                <ul key={`ul-${elements.length}`} className="ma-bullet-list">
                  {currentList.items.map((it, i) => (
                    <li key={i} className="ma-list-item">{parseInline(it)}</li>
                  ))}
                </ul>
              );
            } else if (currentList.type === 'ol') {
              elements.push(
                <ol key={`ol-${elements.length}`} className="ma-num-list">
                  {currentList.items.map((it, i) => (
                    <li key={i} className="ma-list-item">{parseInline(it)}</li>
                  ))}
                </ol>
              );
            }
            currentList = null;
          }
        };

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const trimmed = line.trim();

          if (!trimmed) {
            flushList();
            continue;
          }

          // Horizontal rule
          if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
            flushList();
            elements.push(<hr key={`hr-${i}`} className="ma-md-hr" />);
            continue;
          }

          // Heading: #, ##, ###, ####
          const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
          if (headingMatch) {
            flushList();
            elements.push(
              <div key={`h-${i}`} className="ma-bubble-heading">
                {parseInline(headingMatch[2])}
              </div>
            );
            continue;
          }

          // Bullet list: * item, - item, • item
          const bulletMatch = trimmed.match(/^[-*•]\s+(.+)$/);
          if (bulletMatch) {
            if (!currentList || currentList.type !== 'ul') {
              flushList();
              currentList = { type: 'ul', items: [] };
            }
            currentList.items.push(bulletMatch[1]);
            continue;
          }

          // Numbered list: 1. item, 2. item, 1) item
          const numMatch = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
          if (numMatch) {
            if (!currentList || currentList.type !== 'ol') {
              flushList();
              currentList = { type: 'ol', items: [] };
            }
            currentList.items.push(numMatch[2]);
            continue;
          }

          // Blockquote: > text
          const quoteMatch = trimmed.match(/^>\s*(.+)$/);
          if (quoteMatch) {
            flushList();
            elements.push(
              <blockquote key={`quote-${i}`} className="ma-blockquote">
                {parseInline(quoteMatch[1])}
              </blockquote>
            );
            continue;
          }

          // Standard paragraph
          flushList();
          elements.push(
            <p key={`p-${i}`} className="ma-bubble-p">
              {parseInline(trimmed)}
            </p>
          );
        }

        flushList();
        return <React.Fragment key={sIdx}>{elements}</React.Fragment>;
      })}
    </div>
  );
};

export default MiniAdhyFormattedText;
