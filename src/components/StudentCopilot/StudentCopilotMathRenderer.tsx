import React from 'react';
import { extractTrailingCitations, processNodesReplaceCitations, Citation } from '../Copilot/CopilotShared';

/**
 * StudentCopilotMathRenderer
 * Lightweight math-aware renderer for student copilot messages.
 * 
 * Supports:
 * - Fractions (3/4, 1/2, etc.) rendered with stacked numerator/denominator
 * - Inline LaTeX patterns like \( \frac{3}{4} \) or $\frac{3}{4}$
 * - Equations with clear step-by-step formatting
 * - Simple algebra notation
 * 
 * No external dependencies; uses pure HTML/CSS.
 */

interface FractionMatch {
  original: string;
  numerator: string;
  denominator: string;
  start: number;
  end: number;
}

/**
 * Simple LaTeX-like pattern detection.
 */
const hasLatexPatterns = (text: string): boolean => {
  return /\\frac|\\[a-zA-Z]+|\$|\\left|\\right|\\sin|\\cos|\\sqrt/i.test(text);
};

const hasMathContext = (text: string): boolean => {
  const lower = text.toLowerCase();
  const mathKeywords = /\b(fraction|fractions|numerator|denominator|equation|algebra|geometry|graph|number line|triangle|circle|angle|area|perimeter|slope|variable|ratio|proportion|coordinate|rectangle|square|math|mathematics|solve|simplify|calculate|find)\b/i;
  const hasMathSymbols = /[=+\-×*/^]|\b[xyztuvw]\b/.test(text);
  const hasFractionCue = /\b\d+\s*\/\s*\d+\b/.test(text) && !/\b\d+\s*\/\s*\d+\s*\/\s*\d+\b/.test(text);
  return hasLatexPatterns(text) || mathKeywords.test(lower) || hasMathSymbols || hasFractionCue;
};

/**
 * Check if a match position is likely a date (e.g., 3/4/2024) or version string (e.g., 1/2/3).
 */
const isDateOrVersionPattern = (text: string, matchStart: number, matchEnd: number): boolean => {
  const windowStart = Math.max(0, matchStart - 12);
  const windowEnd = Math.min(text.length, matchEnd + 12);
  const window = text.slice(windowStart, windowEnd);

  return (
    /\b\d{1,2}\s*[/-]\s*\d{1,2}\s*[/-]\s*\d{2,4}\b/.test(window)
    || /\b\d{4}\s*[/-]\s*\d{1,2}\s*[/-]\s*\d{1,2}\b/.test(window)
    || /\b\d+(?:[./-]\d+){2,}\b/.test(window)
  );
};

/**
 * Detect simple numeric fractions like 3/4, 1/2, 10/15, etc.
 * Only used after a math-context check to avoid dates and plain text.
 */
const extractFractions = (text: string): FractionMatch[] => {
  if (!hasMathContext(text)) {
    return [];
  }

  const matches: FractionMatch[] = [];
  const latexFractionRegex = /\\frac\{([^{}]+)\}\{([^{}]+)\}/g;
  const plainFractionRegex = /(^|[^0-9/])(\d+)\s*\/\s*(\d+)(?!\s*\/\s*\d)/g;
  let match: RegExpExecArray | null;

  while ((match = latexFractionRegex.exec(text)) !== null) {
    const start = match.index;
    const end = match.index + match[0].length;

    if (isDateOrVersionPattern(text, start, end)) {
      continue;
    }

    matches.push({
      original: match[0],
      numerator: match[1],
      denominator: match[2],
      start,
      end,
    });
  }

  while ((match = plainFractionRegex.exec(text)) !== null) {
    const start = match.index + match[1].length;
    const end = match.index + match[0].length;

    if (isDateOrVersionPattern(text, start, end)) {
      continue;
    }

    const before = text.slice(Math.max(0, start - 12), start).toLowerCase();
    const after = text.slice(end, Math.min(text.length, end + 12)).toLowerCase();
    const hasContextCue = /\b(fraction|fractions|numerator|denominator|ratio|equation|solve|simplify|calculate|compare|number line|graph|area|perimeter|angle|variable|math|algebra|geometry)\b/i.test(`${before} ${after}`)
      || hasMathContext(text);

    if (!hasContextCue) {
      continue;
    }

    matches.push({
      original: `${match[2]}/${match[3]}`,
      numerator: match[2],
      denominator: match[3],
      start,
      end,
    });
  }

  return matches.sort((a, b) => a.start - b.start);
};

const renderTextWithFractions = (text: string): React.ReactNode[] => {
  const fractions = extractFractions(text);

  if (fractions.length === 0) {
    return [text];
  }

  const parts: React.ReactNode[] = [];
  let lastEnd = 0;

  fractions.forEach((fraction, index) => {
    if (fraction.start > lastEnd) {
      parts.push(
        <span key={`text-${index}`}>
          {text.substring(lastEnd, fraction.start)}
        </span>
      );
    }

    parts.push(
      <FractionComponent
        key={`frac-${index}`}
        numerator={fraction.numerator}
        denominator={fraction.denominator}
      />
    );

    lastEnd = fraction.end;
  });

  if (lastEnd < text.length) {
    parts.push(
      <span key="text-end">
        {text.substring(lastEnd)}
      </span>
    );
  }

  return parts;
};

/**
 * Render a single fraction as HTML with stacked numerator/denominator
 */
const FractionComponent: React.FC<{ numerator: string; denominator: string }> = ({
  numerator,
  denominator,
}) => {
  return (
    <span
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: '0 0.15em',
        verticalAlign: 'middle',
      }}
    >
      <span
        style={{
          borderBottom: '1px solid currentColor',
          paddingBottom: '0.1em',
          fontSize: '0.85em',
          lineHeight: '1.2',
        }}
      >
        {numerator}
      </span>
      <span
        style={{
          fontSize: '0.85em',
          lineHeight: '1.2',
          paddingTop: '0.1em',
        }}
      >
        {denominator}
      </span>
    </span>
  );
};

interface StudentCopilotMathRendererProps {
  content: string;
  className?: string;
}

/**
 * Main renderer component
 * Parses content for math patterns and renders them with enhanced formatting
 */
export const StudentCopilotMathRenderer: React.FC<StudentCopilotMathRendererProps> = ({
  content,
  className,
}) => {
  // Extract any trailing citations block
  const { cleanContent, citations } = extractTrailingCitations(content);
  const hasMathSignal = hasMathContext(cleanContent);
  const fractions = extractFractions(cleanContent);

  if (!hasMathSignal && fractions.length === 0 && !hasLatexPatterns(cleanContent)) {
    // No special math rendering needed, but still replace citation tokens
    const nodes = processNodesReplaceCitations([cleanContent], citations as Citation[]);
    return (
      <div className={className} style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
        {nodes}
      </div>
    );
  }

  return (
    <div className={className} style={{ lineHeight: '1.6', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
      {cleanContent.split('\n').map((line, index) => {
        const isMathLine = hasLatexPatterns(line) || extractFractions(line).length > 0;
        const rendered = line ? renderTextWithFractions(line) : ['\u00A0'];
        const processed = processNodesReplaceCitations(rendered, citations as Citation[]);

        return (
          <div
            key={index}
            style={
              isMathLine
                ? {
                    backgroundColor: '#f5f3f0',
                    padding: '0.25em 0.5em',
                    borderRadius: '0.25em',
                    fontFamily: 'monospace',
                    fontSize: '0.95em',
                  }
                : undefined
            }
          >
            {processed}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Utility hook to check if content likely needs math rendering
 */
export const useHasMathContent = (content: string): boolean => {
  return extractFractions(content).length > 0 || hasLatexPatterns(content);
};
