'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Download, Search, Users, BookOpen, Flame, Shield, ChevronDown, ChevronUp, Building2, MoreVertical, UserCheck, X, Link2 } from 'lucide-react';

interface GroupInfo {
  id: string;
  name: string;
  phase: string | null;
  leader: string | null;
  status: string; // 'active' | 'leader' | 'completed' | 'dropped'
}

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
  groups_json: GroupInfo[];
  current_streak: number;
  longest_streak: number;
  total_journal_entries: number;
  total_prayer_sessions: number;
  total_prayer_cards: number;
  cards_mastered: number[];
  creed_study_sessions: number;
  last_activity_date: string | null;
}

interface ChurchOption {
  id: string;
  name: string;
  subdomain: string | null;
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

interface LeaderOption {
  id: string;
  name: string;
  email: string;
}

// ── Action Menu ──
function ActionMenu({
  member,
  allChurches,
  onAction,
}: {
  member: NetworkDisciple;
  allChurches: ChurchOption[];
  onAction: (id: string, action: string, payload?: Record<string, string>) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [submenu, setSubmenu] = useState<'church' | 'link_leader' | null>(null);
  const [busy, setBusy] = useState(false);
  const [leaderSearch, setLeaderSearch] = useState('');
  const [leaderResults, setLeaderResults] = useState<LeaderOption[]>([]);
  const [leaderLoading, setLeaderLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSubmenu(null);
        setLeaderSearch('');
        setLeaderResults([]);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced leader search
  const searchLeaders = (q: string) => {
    setLeaderSearch(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (q.trim().length < 2) {
      setLeaderResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setLeaderLoading(true);
      try {
        const res = await fetch(`/api/admin/disciples/network/leaders?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          setLeaderResults(data.leaders || []);
        }
      } catch { /* ignore */ }
      setLeaderLoading(false);
    }, 300);
  };

  // Load all leaders when submenu opens (for browsing without typing)
  const openLeaderSubmenu = async () => {
    setSubmenu('link_leader');
    setLeaderSearch('');
    setLeaderLoading(true);
    try {
      const res = await fetch('/api/admin/disciples/network/leaders');
      if (res.ok) {
        const data = await res.json();
        setLeaderResults(data.leaders || []);
      }
    } catch { /* ignore */ }
    setLeaderLoading(false);
  };

  const handleAction = async (action: string, payload?: Record<string, string>) => {
    setBusy(true);
    try {
      await onAction(member.app_account_id, action, payload);
    } finally {
      setBusy(false);
      setOpen(false);
      setSubmenu(null);
      setLeaderSearch('');
      setLeaderResults([]);
    }
  };

  const isLeaderOrAbove = member.account_role === 'dna_leader' || member.account_role === 'church_leader' || member.account_role === 'admin';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); setSubmenu(null); setLeaderSearch(''); setLeaderResults([]); }}
        className="p-1 rounded hover:bg-gray-100 text-foreground-muted hover:text-navy transition-colors"
        disabled={busy}
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-border rounded-lg shadow-lg z-50 min-w-[240px] py-1">
          {/* Assign Church */}
          <button
            onClick={() => setSubmenu(submenu === 'church' ? null : 'church')}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
          >
            <Building2 className="w-3.5 h-3.5 text-teal" />
            {member.church_id ? 'Change Church' : 'Assign Church'}
          </button>
          {submenu === 'church' && (
            <div className="border-t border-border max-h-48 overflow-y-auto">
              {allChurches.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleAction('assign_church', { church_id: c.id })}
                  disabled={busy || c.id === member.church_id}
                  className={`w-full text-left px-6 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-40 ${
                    c.id === member.church_id ? 'font-medium text-teal' : ''
                  }`}
                >
                  {c.name}{c.subdomain ? ` (${c.subdomain})` : ''}
                  {c.id === member.church_id && ' ✓'}
                </button>
              ))}
            </div>
          )}

          {/* Link to DNA Leader — for disciples who logged in with wrong email */}
          {!isLeaderOrAbove && (
            <>
              <button
                onClick={() => submenu === 'link_leader' ? setSubmenu(null) : openLeaderSubmenu()}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Link2 className="w-3.5 h-3.5 text-navy" />
                Link to DNA Leader
              </button>
              {submenu === 'link_leader' && (
                <div className="border-t border-border">
                  <div className="px-3 py-2">
                    <input
                      type="text"
                      value={leaderSearch}
                      onChange={(e) => searchLeaders(e.target.value)}
                      placeholder="Search by name or email..."
                      className="w-full px-2 py-1 text-xs border border-border rounded bg-white"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {leaderLoading ? (
                      <div className="px-4 py-2 text-xs text-foreground-muted">Searching...</div>
                    ) : leaderResults.length === 0 ? (
                      <div className="px-4 py-2 text-xs text-foreground-muted">
                        {leaderSearch.length < 2 ? 'No leaders found' : 'No matches'}
                      </div>
                    ) : (
                      leaderResults.map((l) => (
                        <button
                          key={l.id}
                          onClick={() => handleAction('link_to_leader', { leader_id: l.id })}
                          disabled={busy}
                          className="w-full text-left px-4 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-40"
                        >
                          <div className="font-medium">{l.name}</div>
                          <div className="text-foreground-muted">{l.email}</div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Promote / Demote */}
          {!isLeaderOrAbove ? (
            <button
              onClick={() => handleAction('promote_to_leader')}
              disabled={busy}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <UserCheck className="w-3.5 h-3.5 text-gold" />
              Promote to DNA Leader
            </button>
          ) : member.account_role === 'dna_leader' ? (
            <button
              onClick={() => handleAction('remove_leader_role')}
              disabled={busy}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
            >
              <X className="w-3.5 h-3.5" />
              Remove Leader Role
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default function NetworkDisciplesTab() {
  const [members, setMembers] = useState<NetworkDisciple[]>([]);
  const [allChurches, setAllChurches] = useState<ChurchOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [churchFilter, setChurchFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [phaseFilter, setPhaseFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('church');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [toast, setToast] = useState<string | null>(null);

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

  const fetchChurches = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/churches');
      if (!res.ok) return;
      const data = await res.json();
      const list: ChurchOption[] = (data.churches || []).map((c: { id: string; name: string; subdomain?: string }) => ({
        id: c.id,
        name: c.name,
        subdomain: c.subdomain || null,
      }));
      setAllChurches(list.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      console.error('Failed to fetch churches:', err);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
    fetchChurches();
  }, [fetchMembers, fetchChurches]);

  // Show toast then auto-dismiss
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Handle admin actions
  const handleAction = async (accountId: string, action: string, payload?: Record<string, string>) => {
    try {
      const res = await fetch(`/api/admin/disciples/network/${accountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(`Error: ${data.error}`);
        return;
      }
      showToast(data.message);
      // Refresh the list to reflect changes
      await fetchMembers();
    } catch {
      showToast('Action failed');
    }
  };

  // Derived: unique churches from members (for filter dropdown)
  const memberChurches = useMemo(() => {
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
    const list = churchFilter !== 'all' && churchFilter !== 'no_church'
      ? members.filter(m => m.church_id === churchFilter)
      : members;
    list.forEach((m) => {
      (m.groups_json || []).forEach((g) => {
        if (g.id && g.name) map.set(g.id, g.name);
      });
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
    if (churchFilter === 'no_church') {
      list = list.filter((m) => !m.church_id);
    } else if (churchFilter !== 'all') {
      list = list.filter((m) => m.church_id === churchFilter);
    }
    if (groupFilter === 'none') {
      list = list.filter((m) => !m.groups_json || m.groups_json.length === 0);
    } else if (groupFilter !== 'all') {
      list = list.filter((m) => (m.groups_json || []).some(g => g.id === groupFilter));
    }
    if (phaseFilter !== 'all') {
      list = list.filter((m) => (m.groups_json || []).some(g => g.phase === phaseFilter));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.display_name.toLowerCase().includes(q) ||
          m.account_email.toLowerCase().includes(q) ||
          (m.church_name && m.church_name.toLowerCase().includes(q)) ||
          (m.church_subdomain && m.church_subdomain.toLowerCase().includes(q)) ||
          (m.groups_json || []).some(g =>
            g.name?.toLowerCase().includes(q) ||
            g.leader?.toLowerCase().includes(q)
          )
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
          cmp = ((a.groups_json || [])[0]?.name || 'zzz').localeCompare((b.groups_json || [])[0]?.name || 'zzz');
          break;
        case 'phase':
          cmp = ((a.groups_json || [])[0]?.phase || 'zzz').localeCompare((b.groups_json || [])[0]?.phase || 'zzz');
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
  const noChurchCount = members.filter((m) => !m.church_id).length;
  const inGroupCount = members.filter((m) => m.groups_json && m.groups_json.length > 0).length;

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
      'Name', 'Email', 'Role', 'Church', 'Subdomain', 'Groups', 'Phases',
      'Streak', 'Longest Streak', 'Journals',
      'Prayer Cards', 'Creed Cards Mastered',
      'Last Active', 'Last Login',
    ];
    const rows = filtered.map((m) => {
      const grps = m.groups_json || [];
      return [
        m.display_name,
        m.account_email,
        m.account_role ? ROLE_LABELS[m.account_role] || m.account_role : 'Disciple',
        m.church_name || '',
        m.church_subdomain || '',
        grps.map(g => `${g.name}${g.status === 'leader' ? ' (leading)' : ''}`).join('; ') || '',
        grps.map(g => PHASE_LABELS[g.phase || ''] || g.phase || '').join('; ') || '',
        String(m.current_streak),
        String(m.longest_streak),
        String(m.total_journal_entries),
        String(m.total_prayer_cards),
        String(m.cards_mastered.length),
        m.last_activity_date || '',
        m.last_login_at ? new Date(m.last_login_at).toLocaleDateString() : '',
      ];
    });

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
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[9999] bg-navy text-white px-4 py-2.5 rounded-lg shadow-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          {toast}
          <button onClick={() => setToast(null)} className="text-white/60 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="card p-4 text-center">
          <Users className="w-5 h-5 mx-auto mb-1 text-navy" />
          <div className="text-2xl font-bold text-navy">{members.length}</div>
          <div className="text-xs text-foreground-muted">Total Users</div>
        </div>
        <div className="card p-4 text-center">
          <Building2 className="w-5 h-5 mx-auto mb-1 text-teal" />
          <div className="text-2xl font-bold text-navy">{memberChurches.length}</div>
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
          <option value="no_church">No Church ({noChurchCount})</option>
          {memberChurches.map(([id, info]) => (
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
                <th className="w-10 px-2 py-2"></th>
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
                      {m.church_name || <span className="text-xs italic text-amber-600">No church</span>}
                    </div>
                    {m.church_subdomain && (
                      <div className="text-xs text-foreground-muted/60">{m.church_subdomain}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-foreground-muted">
                    {m.groups_json && m.groups_json.length > 0 ? (
                      <div className="space-y-1">
                        {m.groups_json.map((g) => (
                          <div key={g.id} className="flex items-center gap-1.5">
                            <span className="text-sm">{g.name}</span>
                            {g.status === 'leader' && (
                              <span className="text-[10px] px-1.5 py-0 rounded-full bg-teal/10 text-teal font-medium">Lead</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs italic">No group</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {m.groups_json && m.groups_json.length > 0 ? (
                      <div className="space-y-1">
                        {m.groups_json.map((g) => (
                          <div key={g.id}>
                            {g.phase ? (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PHASE_COLORS[g.phase] || 'bg-gray-100 text-gray-700'}`}>
                                {PHASE_LABELS[g.phase] || g.phase}
                              </span>
                            ) : (
                              <span className="text-xs text-foreground-muted">—</span>
                            )}
                          </div>
                        ))}
                      </div>
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
                  <td className="px-2 py-3">
                    <ActionMenu
                      member={m}
                      allChurches={allChurches}
                      onAction={handleAction}
                    />
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
          <span>Showing {filtered.length} of {members.length} people across {memberChurches.length} churches</span>
          <span>{inGroupCount} in a group &middot; {members.length - inGroupCount} app-only</span>
        </div>
      )}
    </div>
  );
}
