import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

/**
 * StudentCopilotVisualIdea
 * Renders visual idea suggestions from assistant messages.
 * 
 * Detects patterns:
 * - "Visual idea:" paragraph
 * - Fenced blocks with ```visual-example
 * 
 * Displays in a clean card with copy button for easy sharing.
 */

interface VisualIdeaMatch {
  type: 'inline' | 'fenced' | 'fallback';
  content: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Extract visual idea blocks from text
 */
const isMathOrGeometryContext = (text: string): boolean => {
  const lower = text.toLowerCase();
  return /\b(fraction|fractions|numerator|denominator|equation|algebra|geometry|graph|number line|triangle|circle|angle|area|perimeter|slope|variable|ratio|proportion|coordinate|rectangle|square|math|mathematics)\b/i.test(lower)
    || /\d+\s*\/\s*\d+/.test(text)
    || /\b[xyztuvw]\b/.test(lower);
};

const extractVisualIdeas = (text: string): VisualIdeaMatch[] => {
  const matches: VisualIdeaMatch[] = [];
  const source = text || '';

  if (!source.trim()) {
    return matches;
  }

  // Pattern 1: "Visual idea:" followed by text until next paragraph or end
  const inlinePattern = /Visual\s+idea:\s*([^\n]+(?:\n(?!Visual\s+idea:|Suggestions:|$)[^\n]*)*)/gi;
  let match;
  
  while ((match = inlinePattern.exec(source)) !== null) {
    matches.push({
      type: 'inline',
      content: match[1].trim(),
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  // Pattern 2: Fenced visual-example blocks
  const fencedPattern = /```visual-example\s*\n([\s\S]*?)```/gi;
  while ((match = fencedPattern.exec(source)) !== null) {
    matches.push({
      type: 'fenced',
      content: match[1].trim(),
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  // Pattern 3: Conservative draw/sketch fallback for math/geometry explanations.
  if (matches.length === 0 && isMathOrGeometryContext(source)) {
    const fallbackPattern = /^\s*(draw|sketch)\b.+$/gim;
    while ((match = fallbackPattern.exec(source)) !== null) {
      matches.push({
        type: 'fallback',
        content: match[0].trim(),
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
  }

  return matches;
};

/**
 * Remove visual idea blocks from text (so they don't appear in main content)
 */
const removeVisualIdeas = (text: string): string => {
  let result = text;
  
  // Remove inline visual ideas
  result = result.replace(/Visual\s+idea:\s*([^\n]+(?:\n(?!Visual\s+idea:|Suggestions:|$)[^\n]*)*)/gi, '');
  
  // Remove fenced visual examples
  result = result.replace(/```visual-example\s*\n[\s\S]*?```/gi, '');

  // Remove conservative fallback lines only when they were used as visual hints.
  result = result.replace(/^\s*(draw|sketch)\b.+$/gim, (line) => {
    return isMathOrGeometryContext(text) ? '' : line;
  });
    /**
     * Enhanced visual ideas extraction with robust parsing and error handling.
     */
  
  return result.trim();
};

interface StudentCopilotVisualIdeaProps {
  content: string;
}

/**
 * Visual Idea Card Component
 */
const VisualIdeaCard: React.FC<{ idea: string; index: number }> = ({ idea, index }) => {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(idea);
      setCopyError(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.warn('Copy to clipboard failed for visual idea', error);
      setCopied(false);
      setCopyError(true);
      setTimeout(() => setCopyError(false), 3000);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#fafaf8',
        border: '1px solid #e8e4dc',
        borderRadius: '0.5rem',
        padding: '1rem',
        marginTop: '1rem',
        marginBottom: '1rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '0.5rem',
        }}
      >
        <div style={{ flex: 1 }}>
          <h4
            style={{
              margin: '0 0 0.5rem 0',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#68507B',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
            }}
          >
            ✏️ Visual you can draw
          </h4>
          <p
            style={{
              margin: 0,
              fontSize: '0.9375rem',
              lineHeight: '1.5',
              color: '#4b3f52',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {idea}
          </p>
        </div>
        <button
          onClick={handleCopy}
          title="Copy description"
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            color: '#68507B',
            fontSize: '0.875rem',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.7';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          {copied ? (
            <>
              <Check size={16} style={{ marginRight: '0.25rem' }} />
              Copied
            </>
          ) : copyError ? (
            'Copy unavailable'
          ) : (
            <>
              <Copy size={16} style={{ marginRight: '0.25rem' }} />
              Copy
            </>
          )}
        </button>
      </div>
      {copyError && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#7c6b57' }}>
          Copy not available; you can highlight and copy this manually.
        </div>
      )}
    </div>
  );
};

/**
 * Main Visual Ideas container component
 */
export const StudentCopilotVisualIdea: React.FC<StudentCopilotVisualIdeaProps> = ({ content }) => {
  try {
    const visualIdeas = extractVisualIdeas(content);

    if (visualIdeas.length === 0) {
      return null;
    }

    return (
      <div
        style={{
          marginTop: '1rem',
          marginBottom: '1rem',
        }}
      >
        {visualIdeas.map((idea, idx) => (
          <VisualIdeaCard key={idx} idea={idea.content} index={idx} />
        ))}
      </div>
    );
  } catch (error) {
    console.warn('Visual idea parsing failed; falling back to plain text rendering.', error);
    return null;
  }
};

/**
 * Hook to extract and process visual ideas
 */
export const useVisualIdeas = (content: string) => {
  try {
    const ideas = extractVisualIdeas(content);
    const cleanContent = removeVisualIdeas(content);
    
    return {
      hasVisualIdeas: ideas.length > 0,
      visualIdeas: ideas.map((idea) => idea.content),
      cleanContent,
    };
  } catch (error) {
    console.warn('Visual idea extraction failed; using original content.', error);
    return {
      hasVisualIdeas: false,
      visualIdeas: [],
      cleanContent: content,
    };
  }
};

/**
 * Utility to check if content has visual ideas
 */
export const hasVisualIdeas = (content: string): boolean => {
  try {
    return extractVisualIdeas(content).length > 0;
  } catch {
    return false;
  }
};
