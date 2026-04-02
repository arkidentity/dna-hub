'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Download, Search, Users, BookOpen, Flame, Shield, ChevronDown, ChevronUp, Building2 } from 'lucide-react';

interface NetworkDisciple {
  app_account_id: string;
  display_name: string;
  account_email: string;
  account_role: string | null;
  last_login_at: string | null;
  is_active: boolean;
  church_id: string | null;
  church_subdomain: string | null;
  church_name: string | null;
  group_id: string | null;
  group_name: string | null;
  current_phase: string | null;
  leader_name: string | null;
  membership_status: string | null;
  current_streak: number;
  longest_streak: number;
  total_journal_entries: number;
  total_prayer_sessions: number;
  total_prayer_cards: number;
  cards_mastered: number[];
  creed_study_sessions: number;
  last_activity_date: string | null;
}

type SortKey = 'name' | 'church' | 'group' | 'phase' | 'streak' | 'journals' | 'creed' | 'role';
type SortDir = 'asc' | 'desc';

const PHASE_LABELS: Record<string, string> = {
  'pre-launch': 'Pre-Launch',
  'invitation': 'Invitation',
  'foundation': 'Foundation',
  'growth': 'Growth',
  'multiplication': 'Multiplication',
};

const PHASE_COLORS: Record<string, string> = {
  'pre-launch': 'bg-gray-100 text-gray-700',
  'invitation': 'bg-blue-100 text-blue-700',
  'foundation': 'bg-amber-100 text-amber-700',
  'growth': 'bg-green-100 text-green-700',
  'multiplication': 'bg-purple-100 text-purple-700',
};

const ROLE_LABELS: Record<string, string> = {
  'admin': 'Admin',
  'church_leader': 'Church Leader',
  'dna_leader': 'DNA Leader',
};

const ROLE_COLORS: Record<string, string> = {
  'admin': 'bg-purple-100 text-purple-700',
  'church_leader': 'bg-navy/10 text-navy',
  'dna_leader': 'bg-teal/10 text-teal',
};

const STATUS_LABELS: Record<string, string> = {
  'active': 'Active',
  'leader': 'Leader',
  'completed': 'Completed',
  'dropped': 'Dropped',
};

export default function NetworkDisciplesTab() {
  const [members, setMembers] = useState<NetworkDisciple[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [churchFilter, setChurchFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [phaseFilter, setPhaseFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('church');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/disciples/network');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setMembers(data.disciples || []);
    } catch (err) {
      console.error('Failed to fetch network disciples:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Derived: unique churches for filter
  const churches = useMemo(() => {
    const map = new Map<string, { name: string; subdomain: string | null }>();
    members.forEach((m) => {
      if (m.church_id) {
        map.set(m.church_id, { name: m.church_name || 'Unknown', subdomain: m.church_subdomain });
      }
    });
    return Array.from(map.entries()).sort((a, b) => a[1].name.localeCompare(b[1].name));
  }, [members]);

  // Derived: unique groups for filter
  const groups = useMemo(() => {
    const map = new Map<string, string>();
    const list = churchFilter !== 'all'
      ? members.filter(m => m.church_id === churchFilter)
      : members;
    list.forEach((m) => {
      if (m.group_id && m.group_name) map.set(m.group_id, m.group_name);
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [members, churchFilter]);

  // Filter + search + sort
  const filtered = useMemo(() => {
    let list = members;

    if (roleFilter === 'disciple') {
      list = list.filter((m) => !m.account_role);
    } else if (roleFilter !== 'all') {
      list = list.filter((m) => m.account_role === roleFilter);
    }
    if (churchFilter !== 'all') {
      list = list.filter((m) => m.church_id === churchFilter);
    }
    if (groupFilter === 'none') {
      list = list.filter((m) => !m.group_id);
    } else if (groupFilter !== 'all') {
      list = list.filter((m) => m.group_id === groupFilter);
    }
    if (phaseFilter !== 'all') {
      list = list.filter((m) => m.current_phase === phaseFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.display_name.toLowerCase().includes(q) ||
          m.account_email.toLowerCase().includes(q) ||
          (m.church_name && m.church_name.toLowerCase().includes(q)) ||
          (m.church_subdomain && m.church_subdomain.toLowerCase().includes(q)) ||
          (m.leader_name && m.leader_name.toLowerCase().includes(q)) ||
          (m.group_name && m.group_name.toLowerCase().includes(q))
      );
    }

    list = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.display_name.localeCompare(b.display_name);
          break;
        case 'church':
          cmp = (a.church_name || 'zzz').localeCompare(b.church_name || 'zzz');
          break;
        case 'group':
          cmp = (a.group_name || 'zzz').localeCompare(b.group_name || 'zzz');
          break;
        case 'phase':
          cmp = (a.current_phase || 'zzz').localeCompare(b.current_phase || 'zzz');
          break;
        case 'streak':
          cmp = a.current_streak - b.current_streak;
          break;
        case 'journals':
          cmp = a.total_journal_entries - b.total_journal_entries;
          break;
        case 'creed':
          cmp = a.cards_mastered.length - b.cards_mastered.length;
          break;
        case 'role':
          cmp = (a.account_role || 'zzz').localeCompare(b.account_role || 'zzz');
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [members, roleFilter, churchFilter, groupFilter, phaseFilter, search, sortKey, sortDir]);

  // Counts
  const discipleCount = members.filter((m) => !m.account_role).length;
  const leaderCount = members.filter((m) => m.account_role === 'dna_leader').length;
  const churchLeaderCount = members.filter((m) => m.account_role === 'church_leader').length;
  const inGroupCount = members.filter((m) => m.group_id).length;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'streak' || key === 'journals' || key === 'creed' ? 'desc' : 'asc');
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return sortDir === 'asc' ? (
      <ChevronUp className="w-3 h-3 inline ml-0.5" />
    ) : (
      <ChevronDown className="w-3 h-3 inline ml-0.5" />
    );
  };

  const exportCsv = () => {
    const headers = [
      'Name', 'Email', 'Role', 'Church', 'Subdomain', 'Group', 'Phase', 'Leader',
      'Status', 'Streak', 'Longest Streak', 'Journals',
      'Prayer Cards', 'Creed Cards Mastered',
      'Last Active', 'Last Login',
    ];
    const rows = filtered.map((m) => [
      m.display_name,
      m.account_email,
      m.account_role ? ROLE_LABELS[m.account_role] || m.account_role : 'Disciple',
      m.church_name || '',
      m.church_subdomain || '',
      m.group_name || '',
      m.current_phase ? (PHASE_LABELS[m.current_phase] || m.current_phase) : '',
      m.leader_name || '',
      m.membership_status ? (STATUS_LABELS[m.membership_status] || m.membership_status) : '',
      String(m.current_streak),
      String(m.longest_streak),
      String(m.total_journal_entries),
      String(m.total_prayer_cards),
      String(m.cards_mastered.length),
      m.last_activity_date || '',
      m.last_login_at ? new Date(m.last_login_at).toLocaleDateString() : '',
    ]);

    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `network-disciples-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="card p-4 text-center">
          <Users className="w-5 h-5 mx-auto mb-1 text-navy" />
          <div className="text-2xl font-bold text-navy">{members.length}</div>
          <div className="text-xs text-foreground-muted">Total Users</div>
        </div>
        <div className="card p-4 text-center">
          <Building2 className="w-5 h-5 mx-auto mb-1 text-teal" />
          <div className="text-2xl font-bold text-navy">{churches.length}</div>
          <div className="text-xs text-foreground-muted">Churches</div>
        </div>
        <div className="card p-4 text-center">
          <Flame className="w-5 h-5 mx-auto mb-1 text-amber-500" />
          <div className="text-2xl font-bold text-navy">
            {members.length > 0
              ? Math.round(members.reduce((s, m) => s + m.current_streak, 0) / members.length)
              : 0}
          </div>
          <div className="text-xs text-foreground-muted">Avg Streak</div>
        </div>
        <div className="card p-4 text-center">
          <BookOpen className="w-5 h-5 mx-auto mb-1 text-teal" />
          <div className="text-2xl font-bold text-navy">
            {members.reduce((s, m) => s + m.total_journal_entries, 0)}
          </div>
          <div className="text-xs text-foreground-muted">Total Journals</div>
        </div>
        <div className="card p-4 text-center">
          <Shield className="w-5 h-5 mx-auto mb-1 text-gold" />
          <div className="text-2xl font-bold text-navy">
            {members.reduce((s, m) => s + m.cards_mastered.length, 0)}
          </div>
          <div className="text-xs text-foreground-muted">Creed Mastered</div>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Role pills */}
        {[
          { key: 'all', label: 'Everyone' },
          { key: 'disciple', label: `Disciples (${discipleCount})` },
          { key: 'dna_leader', label: `DNA Leaders (${leaderCount})` },
          { key: 'church_leader', label: `Church Leaders (${churchLeaderCount})` },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setRoleFilter(f.key)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              roleFilter === f.key
                ? 'bg-navy text-white'
                : 'bg-gray-100 text-foreground-muted hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}

        {/* Church filter */}
        <select
          value={churchFilter}
          onChange={(e) => { setChurchFilter(e.target.value); setGroupFilter('all'); }}
          className="px-3 py-1 rounded-lg text-sm border border-border bg-white"
        >
          <option value="all">All Churches</option>
          {churches.map(([id, info]) => (
            <option key={id} value={id}>
              {info.name}{info.subdomain ? ` (${info.subdomain})` : ''}
            </option>
          ))}
        </select>

        {/* Group filter */}
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="px-3 py-1 rounded-lg text-sm border border-border bg-white"
        >
          <option value="all">All Groups</option>
          <option value="none">No Group</option>
          {groups.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>

        {/* Phase filter */}
        <select
          value={phaseFilter}
          onChange={(e) => setPhaseFilter(e.target.value)}
          className="px-3 py-1 rounded-lg text-sm border border-border bg-white"
        >
          <option value="all">All Phases</option>
          {Object.entries(PHASE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        {/* Search */}
        <div className="relative ml-auto">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input
            type="text"
            placeholder="Search name, email, church..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 rounded-lg text-sm border border-border bg-white w-56"
          />
        </div>

        <button
          onClick={exportCsv}
          disabled={filtered.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-gray-100 text-foreground-muted hover:bg-gray-200 disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          CSV
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8 text-foreground-muted">Loading network disciples...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-foreground-muted">
          <p className="text-lg font-medium mb-1">
            {members.length === 0 ? 'No app users found' : 'No results match your filters'}
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                <th
                  className="text-left px-4 py-2 font-medium text-foreground-muted cursor-pointer hover:text-navy"
                  onClick={() => handleSort('name')}
                >
                  Name <SortIcon col="name" />
                </th>
                <th
                  className="text-center px-4 py-2 font-medium text-foreground-muted cursor-pointer hover:text-navy"
                  onClick={() => handleSort('role')}
                >
                  Role <SortIcon col="role" />
                </th>
                <th
                  className="text-left px-4 py-2 font-medium text-foreground-muted cursor-pointer hover:text-navy"
                  onClick={() => handleSort('church')}
                >
                  Church <SortIcon col="church" />
                </th>
                <th
                  className="text-left px-4 py-2 font-medium text-foreground-muted cursor-pointer hover:text-navy"
                  onClick={() => handleSort('group')}
                >
                  Group <SortIcon col="group" />
                </th>
                <th
                  className="text-center px-4 py-2 font-medium text-foreground-muted cursor-pointer hover:text-navy"
                  onClick={() => handleSort('phase')}
                >
                  Phase <SortIcon col="phase" />
                </th>
                <th
                  className="text-center px-4 py-2 font-medium text-foreground-muted cursor-pointer hover:text-navy"
                  onClick={() => handleSort('streak')}
                >
                  Streak <SortIcon col="streak" />
                </th>
                <th
                  className="text-center px-4 py-2 font-medium text-foreground-muted cursor-pointer hover:text-navy"
                  onClick={() => handleSort('journals')}
                >
                  Journals <SortIcon col="journals" />
                </th>
                <th className="text-center px-4 py-2 font-medium text-foreground-muted">Prayer</th>
                <th
                  className="text-center px-4 py-2 font-medium text-foreground-muted cursor-pointer hover:text-navy"
                  onClick={() => handleSort('creed')}
                >
                  Creed <SortIcon col="creed" />
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.app_account_id} className="border-b border-border last:border-b-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{m.display_name}</div>
                    <div className="text-xs text-foreground-muted">{m.account_email}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {m.account_role ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[m.account_role] || 'bg-gray-100 text-gray-700'}`}>
                        {ROLE_LABELS[m.account_role] || m.account_role}
                      </span>
                    ) : (
                      <span className="text-xs text-foreground-muted">Disciple</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-foreground-muted">
                      {m.church_name || <span className="text-xs italic">No church</span>}
                    </div>
                    {m.church_subdomain && (
                      <div className="text-xs text-foreground-muted/60">{m.church_subdomain}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-foreground-muted">
                    {m.group_name ? (
                      <div>
                        <div>{m.group_name}</div>
                        {m.membership_status === 'leader' && (
                          <span className="text-xs text-teal font-medium">Leading</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs italic">No group</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {m.current_phase ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PHASE_COLORS[m.current_phase] || 'bg-gray-100 text-gray-700'}`}>
                        {PHASE_LABELS[m.current_phase] || m.current_phase}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={m.current_streak > 0 ? 'text-amber-600 font-medium' : 'text-foreground-muted'}>
                      {m.current_streak > 0 ? `${m.current_streak}d` : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {m.total_journal_entries > 0 ? m.total_journal_entries : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {m.total_prayer_cards > 0 ? m.total_prayer_cards : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {m.cards_mastered.length > 0 ? (
                      <span className="text-gold font-medium">{m.cards_mastered.length}</span>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-between text-xs text-foreground-muted mt-2">
          <span>Showing {filtered.length} of {members.length} people across {churches.length} churches</span>
          <span>{inGroupCount} in a group &middot; {members.length - inGroupCount} app-only</span>
        </div>
      )}
    </div>
  );
}
