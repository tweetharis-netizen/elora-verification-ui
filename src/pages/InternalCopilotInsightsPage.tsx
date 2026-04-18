import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getAuthHeaders } from '../services/dataService';

type UseCaseSummaryRow = {
  useCase: string;
  total: number;
  up: number;
  down: number;
};

type RoleSummaryRow = {
  role: 'teacher' | 'student' | 'parent';
  total: number;
  up: number;
  down: number;
};

type FeedbackEventRow = {
  role: 'teacher' | 'student' | 'parent';
  useCase: string;
  rating: 'up' | 'down';
  reason?: string;
  createdAt: string;
};

type InsightsResponse = {
  ok: boolean;
  data?: {
    byUseCase: UseCaseSummaryRow[];
    byRole: RoleSummaryRow[];
    recent: FeedbackEventRow[];
  };
  error?: string;
};

const formatTime = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
};

export default function InternalCopilotInsightsPage() {
  const { currentUser } = useAuth();
  const isTeacher = currentUser?.role === 'teacher';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [byUseCase, setByUseCase] = useState<UseCaseSummaryRow[]>([]);
  const [byRole, setByRole] = useState<RoleSummaryRow[]>([]);
  const [recent, setRecent] = useState<FeedbackEventRow[]>([]);

  useEffect(() => {
    if (!isTeacher) {
      setLoading(false);
      setError('Not authorized');
      return;
    }

    let cancelled = false;

    const loadInsights = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/internal/copilot/insights', {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
        });

        const payload = (await response.json()) as InsightsResponse;

        if (!response.ok || !payload.ok || !payload.data) {
          throw new Error(payload.error || 'Unable to load Copilot insights');
        }

        if (cancelled) return;

        setByUseCase(payload.data.byUseCase ?? []);
        setByRole(payload.data.byRole ?? []);
        setRecent((payload.data.recent ?? []).slice(0, 50));
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : 'Unable to load Copilot insights');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadInsights();

    return () => {
      cancelled = true;
    };
  }, [isTeacher]);

  const totalFeedback = useMemo(() => byUseCase.reduce((acc, row) => acc + row.total, 0), [byUseCase]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-slate-500">Internal</p>
          <h1 className="text-2xl font-bold tracking-tight mt-1">Copilot Insights</h1>
          <p className="text-sm text-slate-500 mt-2">Read-only operational view of Copilot feedback signals.</p>
          <p className="text-xs text-slate-400 mt-2">Total feedback events in memory: {totalFeedback}</p>
        </div>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            Loading Copilot insights...
          </div>
        )}

        {error && !loading && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold tracking-tight mb-4">By useCase</h2>
              <div className="overflow-x-auto">
                <table className="min-w-[640px] w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                      <th className="py-2 pr-4">UseCase</th>
                      <th className="py-2 pr-4">Total</th>
                      <th className="py-2 pr-4">Up</th>
                      <th className="py-2 pr-4">Down</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byUseCase.map((row) => (
                      <tr key={row.useCase} className="border-b border-slate-100 text-sm">
                        <td className="py-2 pr-4 font-medium text-slate-700">{row.useCase}</td>
                        <td className="py-2 pr-4">{row.total}</td>
                        <td className="py-2 pr-4 text-emerald-700">{row.up}</td>
                        <td className="py-2 pr-4 text-rose-700">{row.down}</td>
                      </tr>
                    ))}
                    {byUseCase.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-sm text-slate-400">No feedback captured yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold tracking-tight mb-4">By role</h2>
              <div className="overflow-x-auto">
                <table className="min-w-[520px] w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                      <th className="py-2 pr-4">Role</th>
                      <th className="py-2 pr-4">Total</th>
                      <th className="py-2 pr-4">Up</th>
                      <th className="py-2 pr-4">Down</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byRole.map((row) => (
                      <tr key={row.role} className="border-b border-slate-100 text-sm">
                        <td className="py-2 pr-4 capitalize font-medium text-slate-700">{row.role}</td>
                        <td className="py-2 pr-4">{row.total}</td>
                        <td className="py-2 pr-4 text-emerald-700">{row.up}</td>
                        <td className="py-2 pr-4 text-rose-700">{row.down}</td>
                      </tr>
                    ))}
                    {byRole.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-sm text-slate-400">No feedback captured yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold tracking-tight mb-4">Recent feedback</h2>
              <div className="overflow-x-auto">
                <table className="min-w-[760px] w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                      <th className="py-2 pr-4">Time</th>
                      <th className="py-2 pr-4">Role</th>
                      <th className="py-2 pr-4">UseCase</th>
                      <th className="py-2 pr-4">Rating</th>
                      <th className="py-2 pr-4">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((row, idx) => (
                      <tr key={`${row.createdAt}-${row.role}-${idx}`} className="border-b border-slate-100 text-sm">
                        <td className="py-2 pr-4 text-slate-600">{formatTime(row.createdAt)}</td>
                        <td className="py-2 pr-4 capitalize">{row.role}</td>
                        <td className="py-2 pr-4 text-slate-700">{row.useCase}</td>
                        <td className="py-2 pr-4 uppercase">{row.rating}</td>
                        <td className="py-2 pr-4 text-slate-600">{row.reason ?? '-'}</td>
                      </tr>
                    ))}
                    {recent.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-sm text-slate-400">No recent feedback events.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
