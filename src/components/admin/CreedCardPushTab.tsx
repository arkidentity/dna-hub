'use client';

import { useState, useEffect, useCallback } from 'react';
import { Send, Clock, History } from 'lucide-react';
import { CREED_CARDS, CREED_CATEGORIES, getCreedCard } from '@/lib/creedCardsList';

interface ActivePush {
  id: string;
  card_id: number;
  pushed_by: string | null;
  pushed_at: string;
  expires_at: string;
}

interface CreedCardPushTabProps {
  churchId: string;
}

export default function CreedCardPushTab({ churchId }: CreedCardPushTabProps) {
  const [activePush, setActivePush] = useState<ActivePush | null>(null);
  const [history, setHistory] = useState<ActivePush[]>([]);
  const [loading, setLoading] = useState(true);
  const [pushing, setPushing] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<number>(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/creed-push?church_id=${churchId}`);
      if (res.ok) {
        const data = await res.json();
        setActivePush(data.activePush || null);
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error('Failed to fetch creed push data:', err);
    }
    setLoading(false);
  }, [churchId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePush = async () => {
    setPushing(true);
    try {
      const res = await fetch('/api/admin/creed-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ churchId, cardId: selectedCardId }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to push creed card:', err);
    }
    setPushing(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date().getTime();
    const exp = new Date(expiresAt).getTime();
    const diff = exp - now;
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m remaining`;
  };

  if (loading) {
    return <p className="text-foreground-muted text-center py-8">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Active Push */}
      <div className="bg-white rounded-lg border border-card-border p-6">
        <h3 className="text-lg font-semibold text-navy mb-4">Active Creed Card</h3>
        {activePush ? (
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-navy text-white text-xs flex items-center justify-center font-bold">
                  {activePush.card_id}
                </span>
                <span className="font-medium text-navy">
                  {getCreedCard(activePush.card_id)?.title || `Card #${activePush.card_id}`}
                </span>
              </div>
              <p className="text-sm text-foreground-muted mt-1">
                {getCreedCard(activePush.card_id)?.category}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm text-green-700">
                <Clock className="w-3.5 h-3.5" />
                {getTimeRemaining(activePush.expires_at)}
              </div>
              <p className="text-xs text-foreground-muted mt-0.5">
                Pushed {formatDate(activePush.pushed_at)}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-foreground-muted text-center py-4">
            No active creed card. Push one below to surface it in the Daily DNA app.
          </p>
        )}
      </div>

      {/* Push New Card */}
      <div className="bg-white rounded-lg border border-card-border p-6">
        <h3 className="text-lg font-semibold text-navy mb-4">Push Creed Card</h3>
        <p className="text-sm text-foreground-muted mb-4">
          Select a creed card to push to your congregation. It will appear as a banner in the Daily DNA app for 24 hours.
        </p>
        <div className="flex gap-3">
          <select
            value={selectedCardId}
            onChange={(e) => setSelectedCardId(Number(e.target.value))}
            className="flex-1 border border-card-border rounded px-3 py-2 text-sm"
          >
            {CREED_CATEGORIES.map((category) => (
              <optgroup key={category} label={category}>
                {CREED_CARDS.filter(c => c.category === category).map((card) => (
                  <option key={card.id} value={card.id}>
                    #{card.id} — {card.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <button
            onClick={handlePush}
            disabled={pushing}
            className="px-4 py-2 bg-navy text-white rounded hover:bg-navy/90 transition-colors flex items-center gap-2 text-sm whitespace-nowrap"
          >
            <Send className="w-4 h-4" />
            {pushing ? 'Pushing...' : 'Push to Church'}
          </button>
        </div>
        {activePush && (
          <p className="text-xs text-yellow-600 mt-2">
            This will replace the currently active card.
          </p>
        )}
      </div>

      {/* Push History */}
      {history.length > 0 && (
        <div className="bg-white rounded-lg border border-card-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-foreground-muted" />
            <h3 className="text-lg font-semibold text-navy">Recent Pushes</h3>
          </div>
          <div className="space-y-2">
            {history.map((push) => {
              const card = getCreedCard(push.card_id);
              const isActive = new Date(push.expires_at).getTime() > Date.now();
              return (
                <div
                  key={push.id}
                  className={`flex items-center justify-between py-2 px-3 rounded text-sm ${
                    isActive ? 'bg-green-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-navy/10 text-navy text-xs flex items-center justify-center font-medium">
                      {push.card_id}
                    </span>
                    <span className="text-navy">{card?.title || `Card #${push.card_id}`}</span>
                  </div>
                  <div className="flex items-center gap-3 text-foreground-muted text-xs">
                    <span>{formatDate(push.pushed_at)}</span>
                    {isActive && (
                      <span className="text-green-700 font-medium">Active</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
