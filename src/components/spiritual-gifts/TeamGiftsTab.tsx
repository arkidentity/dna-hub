'use client';

import { useState, useEffect, useCallback } from 'react';
import { Copy, Check, Users, RefreshCw } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  tier1_primary: string | null;
  tier1_primary_score: number | null;
  tier1_secondary: string | null;
  tier1_secondary_score: number | null;
  tier2_primary: string | null;
  tier2_primary_score: number | null;
  tier2_secondary: string | null;
  tier2_secondary_score: number | null;
  tier3_primary: string | null;
  tier3_primary_score: number | null;
  tier3_secondary: string | null;
  tier3_secondary_score: number | null;
  completed_at: string;
}

interface TeamGiftsTabProps {
  churchId: string;
}

// Tier labels
const TIER_LABELS: Record<1 | 2 | 3, { label: string; scripture: string; color: string; bg: string }> = {
  1: { label: 'Serving Gift',      scripture: 'Romans 12',    color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200' },
  2: { label: 'Supernatural Gift', scripture: '1 Cor 12',     color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  3: { label: 'Leadership Calling', scripture: 'Ephesians 4', color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200' },
};

function capitalize(s: string | null) {
  if (!s) return '—';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function GiftBadge({ gift, score, tier }: { gift: string | null; score: number | null; tier: 1 | 2 | 3 }) {
  const t = TIER_LABELS[tier];
  if (!gift) return <span className="text-gray-400 text-sm">—</span>;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium ${t.bg} ${t.color}`}>
      {capitalize(gift)}
      {score !== null && <span className="opacity-60">{Math.round(score)}%</span>}
    </span>
  );
}

export default function TeamGiftsTab({ churchId }: TeamGiftsTabProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const inviteLink = `https://dailydna.app/gifts?church=${churchId}`;

  const fetchTeam = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/spiritual-gifts/team?church_id=${churchId}`);
      if (!res.ok) throw new Error('Failed to load team results');
      const data = await res.json();
      setMembers(data.members || []);
    } catch (err) {
      setError('Could not load team results. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [churchId]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement('textarea');
      el.value = inviteLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">

      {/* Invite link card */}
      <div className="bg-[var(--navy)] rounded-xl p-6 text-white">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-bold text-lg mb-1">Share with Your Team</h3>
            <p className="text-blue-200 text-sm mb-3">
              Team members create a free Daily DNA account, take the 15-minute assessment, and their results appear here automatically.
            </p>
            <div className="bg-white/10 rounded-lg px-4 py-2 text-sm font-mono text-blue-100 break-all">
              {inviteLink}
            </div>
          </div>
          <button
            onClick={copyLink}
            className="flex items-center gap-2 bg-[var(--gold)] hover:opacity-90 transition-opacity text-white font-semibold px-5 py-2.5 rounded-lg whitespace-nowrap shrink-0"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {([1, 2, 3] as const).map((tier) => {
          const t = TIER_LABELS[tier];
          return (
            <span key={tier} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-medium ${t.bg} ${t.color}`}>
              <span>{t.label}</span>
              <span className="opacity-60">— {t.scripture}</span>
            </span>
          );
        })}
      </div>

      {/* Results */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-gray-500">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
          Loading team results…
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
          {error}
          <button onClick={fetchTeam} className="ml-auto underline text-red-600 hover:text-red-800">Retry</button>
        </div>
      )}

      {!loading && !error && members.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium mb-1">No results yet</p>
          <p className="text-gray-400 text-sm">
            Share the link above with your team. Results appear here as they complete the assessment.
          </p>
        </div>
      )}

      {!loading && !error && members.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-blue-700">
                  Serving Gift
                  <span className="font-normal text-gray-400 ml-1 text-xs">Rom 12</span>
                </th>
                <th className="text-left px-4 py-3 font-semibold text-purple-700">
                  Supernatural Gift
                  <span className="font-normal text-gray-400 ml-1 text-xs">1 Cor 12</span>
                </th>
                <th className="text-left px-4 py-3 font-semibold text-amber-700">
                  Leadership Calling
                  <span className="font-normal text-gray-400 ml-1 text-xs">Eph 4</span>
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-500">Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{m.name}</p>
                    <p className="text-gray-400 text-xs">{m.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <GiftBadge gift={m.tier1_primary} score={m.tier1_primary_score} tier={1} />
                      {m.tier1_secondary && (
                        <span className="text-xs text-gray-400">{capitalize(m.tier1_secondary)}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <GiftBadge gift={m.tier2_primary} score={m.tier2_primary_score} tier={2} />
                      {m.tier2_secondary && (
                        <span className="text-xs text-gray-400">{capitalize(m.tier2_secondary)}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <GiftBadge gift={m.tier3_primary} score={m.tier3_primary_score} tier={3} />
                      {m.tier3_secondary && (
                        <span className="text-xs text-gray-400">{capitalize(m.tier3_secondary)}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(m.completed_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
