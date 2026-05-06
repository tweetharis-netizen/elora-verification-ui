import React from 'react';
import { FileText } from 'lucide-react';
import { StudentCopilotMathRenderer } from './StudentCopilotMathRenderer';
import { StudentCopilotVisualIdea, useVisualIdeas } from './StudentCopilotVisualIdea';
import { CopilotFeedbackRow } from '../Copilot/CopilotFeedbackRow';
import { CopilotMessageBubble, CopilotSuggestionsBar, handleFeedback, Message } from '../Copilot/CopilotShared';
import { settingsService } from '../../services/settingsService';

interface StudentCopilotMessageRendererProps {
  message: Message;
  themeColor?: string;
  shouldAutoExpandSteps?: boolean;
  showFeedback?: boolean;
  onSuggestionClick?: (label: string) => void;
  feedbackSource?: string;
}

/**
 * StudentCopilotMessageRenderer
 * Renders student copilot messages with enhancements:
 * - Math-aware rendering for assistant messages
 * - Visual ideas displayed in cards
 * - Warmup labels
 */
export const StudentCopilotMessageRenderer: React.FC<StudentCopilotMessageRendererProps> = ({
  message,
  themeColor = '#68507B',
  shouldAutoExpandSteps,
  showFeedback,
  onSuggestionClick,
  feedbackSource,
}) => {
  // For non-assistant messages, render normally
  if (message.role !== 'assistant') {
    return (
      <CopilotMessageBubble
        message={message}
        themeColor={themeColor}
        shouldAutoExpandSteps={shouldAutoExpandSteps}
        copilotRole="student"
        showFeedback={showFeedback}
        onSuggestionClick={onSuggestionClick}
        feedbackSource={feedbackSource}
      />
    );
  }

  // For assistant messages, extract visual ideas and create enhanced message
  const { cleanContent, hasVisualIdeas: hasIdeas } = useVisualIdeas(message.content);
  
  // Check if this is a warmup message
  const isWarmup = /^Warmup:|warmup:/i.test(cleanContent);

  // Load user settings to check if we should show step labels
  const userSettings = settingsService.getSettings('student');
  const showStepLabels = userSettings.copilotPreferences.showStepLabels;

  // If labels are disabled, strip them from the content
  let finalContent = cleanContent;
  if (!showStepLabels) {
    // Regex matches common headings at the start of a line: Given:, Goal:, Plan:, Check:, and Step 1:
    finalContent = cleanContent.replace(/^(Given|Goal|Plan|Check|Step\s+\d+)\s*:\s*/gim, '');
  }

  // Custom rendering for student assistant messages
  return (
    <div className="flex w-full justify-start animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="max-w-[95%] md:max-w-3xl flex flex-col items-start">
        {/* Main message bubble with enhanced rendering */}
        <div className="px-6 py-4 text-[15px] md:text-[16px] leading-[1.6] bg-white rounded-[24px] rounded-bl-[4px] border border-slate-100 shadow-sm text-slate-800 whitespace-pre-wrap">
          {/* Warmup label */}
          {isWarmup && (
            <div
              style={{
                backgroundColor: themeColor + '15',
                color: themeColor,
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                fontSize: '0.8125rem',
                fontWeight: '600',
                marginBottom: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
              }}
            >
              🎯 Warmup
            </div>
          )}
          
          {/* Math-enhanced content */}
          <StudentCopilotMathRenderer content={finalContent} />

          {/* Attached Files rendering */}
          {message.fileAttachments && message.fileAttachments.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
              {message.fileAttachments.map((file) => (
                <div 
                  key={file.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 text-[12px] font-medium text-slate-600 border border-slate-100"
                >
                  <FileText size={14} className="opacity-70" />
                  <span className="truncate max-w-[120px]">{file.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Visual ideas */}
        {hasIdeas && <StudentCopilotVisualIdea content={message.content} />}

        {/* Shared suggestions and feedback controls without duplicating the bubble */}
        {(message.suggestions && message.suggestions.length > 0 && onSuggestionClick) || showFeedback ? (
          <div className="flex w-full flex-col items-start">
            {message.suggestions && message.suggestions.length > 0 && onSuggestionClick && (
              <CopilotSuggestionsBar
                suggestions={message.suggestions}
                onSuggestionClick={onSuggestionClick}
                themeColor={themeColor}
              />
            )}

            {showFeedback && (
              <div className="mt-2 animate-in fade-in duration-500 delay-300">
                <CopilotFeedbackRow
                  messageId={message.id}
                  role="student"
                  useCase={message.useCase ?? 'student_chat'}
                  threadId={message.conversationId}
                  source={feedbackSource ?? message.feedbackSource ?? message.source}
                  onFeedback={handleFeedback}
                />
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
