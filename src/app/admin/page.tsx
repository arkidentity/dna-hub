'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Loader2,
  RefreshCw,
  AlertCircle,
  Settings,
  Download,
  UserCheck,
  UserCircle,
  BookOpen,
  Palette,
} from 'lucide-react';
import { DNALeadersTab, ChurchesTab, ResourcesTab, BrandingTab, CoachesTab } from '@/components/admin';
import AuthAuditPanel from '@/components/admin/AuthAuditPanel';

interface ChurchSummary {
  id: string;
  name: string;
  status: string;
  current_phase: number;
  coach_id: string | null;
  coach_name: string | null;
  created_at: string;
  updated_at: string;
  leader_name: string;
  leader_email: string;
  leader_id: string;
  completed_milestones: number;
  total_milestones: number;
  has_overdue: boolean;
  next_call?: {
    call_type: string;
    scheduled_at: string;
  };
  last_activity?: string;
}

interface AdminStats {
  total: number;
  byStatus: Record<string, number>;
  activeThisWeek: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'churches' | 'dna-leaders' | 'coaches' | 'resources' | 'branding'>('churches');
  const [churches, setChurches] = useState<ChurchSummary[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'dna_coach'>('admin');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setError(false);
      const response = await fetch('/api/admin/churches');

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (response.status === 403) {
        router.push('/dashboard');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch admin data');
      }

      const data = await response.json();
      setChurches(data.churches);
      setStats(data.stats);
      if (data.user_role) setUserRole(data.user_role);
    } catch (error) {
      console.error('Admin error:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAdminData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-navy mb-2">Failed to load admin dashboard</h2>
          <p className="text-foreground-muted mb-4">Something went wrong. Please try again.</p>
          <button
            onClick={() => {
              setLoading(true);
              fetchAdminData();
            }}
            className="btn-primary inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Page Title */}
      <div className="bg-navy text-white py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-gold font-medium text-sm tracking-wide">
              {userRole === 'dna_coach' ? 'DNA COACH' : 'DNA ADMIN'}
            </p>
            <p className="font-semibold">
              {userRole === 'dna_coach' ? 'My Churches' : 'Church Management'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <AuthAuditPanel />
            <Link
              href="/admin/settings"
              className="p-2 text-gray-300 hover:text-white transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </Link>
            <a
              href="/api/admin/export"
              download
              className="p-2 text-gray-300 hover:text-white transition-colors"
              title="Export CSV"
            >
              <Download className="w-5 h-5" />
            </a>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-gray-300 hover:text-white transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-card-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-6">
            {[
              { id: 'churches', label: 'Churches', icon: Building2, showFor: 'both' },
              { id: 'dna-leaders', label: 'DNA Leaders', icon: UserCheck, showFor: 'both' },
              { id: 'coaches', label: 'Coaches', icon: UserCircle, showFor: 'admin' },
              { id: 'resources', label: 'Resources', icon: BookOpen, showFor: 'admin' },
              { id: 'branding', label: 'Branding', icon: Palette, showFor: 'admin' },
            ].filter(tab => tab.showFor === 'both' || userRole === 'admin').map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-gold text-navy font-medium'
                    : 'border-transparent text-foreground-muted hover:text-navy'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* DNA Leaders Tab */}
        {activeTab === 'dna-leaders' && <DNALeadersTab />}

        {/* Churches Tab */}
        {activeTab === 'churches' && (
          <ChurchesTab
            churches={churches}
            stats={stats}
            onRefresh={fetchAdminData}
          />
        )}

        {/* Coaches Tab */}
        {activeTab === 'coaches' && <CoachesTab />}

        {/* Resources Tab */}
        {activeTab === 'resources' && <ResourcesTab />}

        {/* Branding Tab */}
        {activeTab === 'branding' && <BrandingTab />}
      </main>
    </div>
  );
}
