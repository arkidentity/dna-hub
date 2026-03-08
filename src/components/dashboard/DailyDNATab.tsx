'use client';

import { useState } from 'react';
import { Heart, BookOpen, Shield, Users } from 'lucide-react';
import PrayerWallTab from '@/components/admin/PrayerWallTab';
import TestimonySubmissionsTab from '@/components/admin/TestimonySubmissionsTab';
import CreedCardPushTab from '@/components/admin/CreedCardPushTab';
import GuestsTab from '@/components/dashboard/guests/GuestsTab';

type SubTab = 'prayer-wall' | 'testimonies' | 'creed-cards' | 'guests';

const SUB_TABS: { id: SubTab; label: string; icon: typeof Heart }[] = [
  { id: 'prayer-wall', label: 'Prayer Wall', icon: Heart },
  { id: 'testimonies', label: 'Testimonies', icon: BookOpen },
  { id: 'creed-cards', label: 'Creed Cards', icon: Shield },
  { id: 'guests', label: 'Guests', icon: Users },
];

interface DailyDNATabProps {
  churchId: string;
}

export default function DailyDNATab({ churchId }: DailyDNATabProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('prayer-wall');

  return (
    <div>
      {/* Sub-navigation */}
      <div className="flex gap-2 mb-6">
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                isActive
                  ? 'bg-navy text-white'
                  : 'bg-gray-100 text-foreground-muted hover:bg-gray-200 hover:text-navy'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Sub-tab content */}
      {activeSubTab === 'prayer-wall' && (
        <PrayerWallTab churchId={churchId} />
      )}
      {activeSubTab === 'testimonies' && (
        <TestimonySubmissionsTab churchId={churchId} />
      )}
      {activeSubTab === 'creed-cards' && (
        <CreedCardPushTab churchId={churchId} />
      )}
      {activeSubTab === 'guests' && (
        <GuestsTab churchId={churchId} />
      )}
    </div>
  );
}
