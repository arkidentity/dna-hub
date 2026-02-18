'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface CohortMember {
  id: string; // dna_cohort_members.id — used for PATCH
  name: string;
  role: string;
  group_name?: string;
  joined_at: string;
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

const avatarColors = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
  'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-red-500',
];

function avatarColor(name: string) {
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  return avatarColors[hash % avatarColors.length];
}

// ============================================
// MEMBER ROW
// ============================================

function MemberRow({
  member,
  canManage,
  onRoleChange,
}: {
  member: CohortMember;
  canManage: boolean;
  onRoleChange: (memberId: string, newRole: 'trainer' | 'leader') => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);
    const newRole = member.role === 'trainer' ? 'leader' : 'trainer';
    await onRoleChange(member.id, newRole);
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${avatarColor(member.name)}`}>
        {initials(member.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-navy text-sm">{member.name}</p>
        {member.joined_at && (
          <p className="text-xs text-gray-400">
            Joined {new Date(member.joined_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </p>
        )}
      </div>

      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
        member.role === 'trainer'
          ? 'bg-gold/20 text-gold'
          : 'bg-gray-100 text-gray-600'
      }`}>
        {member.role === 'trainer' ? 'Trainer' : 'Leader'}
      </span>

      {canManage && (
        <button
          onClick={handleToggle}
          disabled={loading}
          title={member.role === 'trainer' ? 'Remove trainer role' : 'Make trainer'}
          className={`ml-1 text-xs px-2.5 py-1 rounded-lg border transition-colors disabled:opacity-50 ${
            member.role === 'trainer'
              ? 'border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-600 hover:bg-red-50'
              : 'border-gold/40 text-gold hover:bg-gold/10'
          }`}
        >
          {loading
            ? <Loader2 className="w-3 h-3 animate-spin inline" />
            : member.role === 'trainer' ? 'Demote' : 'Make Trainer'
          }
        </button>
      )}
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function CohortMembersPage() {
  const router = useRouter();
  const [members, setMembers] = useState<CohortMember[]>([]);
  const [cohortName, setCohortName] = useState('');
  const [userRole, setUserRole] = useState('leader');
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/cohort')
      .then((r) => {
        if (r.status === 401) { router.push('/login'); return null; }
        return r.json();
      })
      .then((d) => {
        if (d) {
          setMembers(d.members || []);
          setCohortName(d.cohort?.name || '');
          setUserRole(d.currentUserRole || 'leader');
          setIsMock(d.mock || false);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const handleRoleChange = async (memberId: string, newRole: 'trainer' | 'leader') => {
    const res = await fetch(`/api/cohort/members/${memberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error || 'Failed to update role');
      return;
    }

    // Update local state optimistically
    setMembers((prev) =>
      prev.map((m) => m.id === memberId ? { ...m, role: newRole } : m)
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold" />
      </div>
    );
  }

  const isTrainer = userRole === 'trainer';
  const trainers = members.filter((m) => m.role === 'trainer');
  const leaders = members.filter((m) => m.role !== 'trainer');

  const filtered = (list: CohortMember[]) =>
    search
      ? list.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
      : list;

  // Group leaders by training group
  const groups: Record<string, CohortMember[]> = {};
  for (const leader of leaders) {
    const key = leader.group_name || 'DNA Leaders';
    if (!groups[key]) groups[key] = [];
    groups[key].push(leader);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {isMock && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
          <strong>Demo mode</strong> — showing sample roster for {cohortName}.
        </div>
      )}

      {isTrainer && !isMock && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
          As a trainer, you can promote DNA leaders to trainer status so they can post announcements and add events.
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold/40"
        />
      </div>

      {/* Trainers */}
      {filtered(trainers).length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Trainer{trainers.length !== 1 ? 's' : ''}
          </p>
          <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
            {filtered(trainers).map((m) => (
              <MemberRow
                key={m.id}
                member={m}
                canManage={isTrainer && !isMock}
                onRoleChange={handleRoleChange}
              />
            ))}
          </div>
        </div>
      )}

      {/* Leaders by group */}
      {Object.entries(groups).map(([groupName, groupMembers]) => {
        const filteredGroup = filtered(groupMembers);
        if (filteredGroup.length === 0) return null;
        return (
          <div key={groupName} className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{groupName}</p>
            <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
              {filteredGroup.map((m) => (
                <MemberRow
                  key={m.id}
                  member={m}
                  canManage={isTrainer && !isMock}
                  onRoleChange={handleRoleChange}
                />
              ))}
            </div>
          </div>
        );
      })}

      {members.length === 0 && (
        <div className="bg-white rounded-lg shadow px-6 py-12 text-center">
          <p className="text-navy font-semibold">No members yet</p>
          <p className="text-gray-500 text-sm mt-1">Members will appear here once added to the cohort.</p>
        </div>
      )}

      <p className="text-center text-xs text-gray-400 mt-4">
        {members.length} total member{members.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
