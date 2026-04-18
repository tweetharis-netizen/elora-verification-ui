import type { Request, Response } from 'express';
import { getCopilotFeedbackSummary } from '../metrics/copilotMetricsStore.js';

export const getCopilotInsights = (_req: Request, res: Response): void => {
  try {
    const summary = getCopilotFeedbackSummary();
    res.status(200).json({ ok: true, data: summary });
  } catch (error) {
    console.error('[CopilotInsightsError]', error);
    res.status(500).json({ ok: false, error: 'Unable to load Copilot insights' });
  }
};
