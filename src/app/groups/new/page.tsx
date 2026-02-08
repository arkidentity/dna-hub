'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewGroupPage() {
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [groupName, setGroupName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [multiplicationDate, setMultiplicationDate] = useState('');

  // Calculate suggested multiplication date (8 weeks from start)
  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    if (date) {
      const start = new Date(date);
      start.setDate(start.getDate() + 56); // 8 weeks
      setMultiplicationDate(start.toISOString().split('T')[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_name: groupName.trim(),
          start_date: startDate,
          multiplication_target_date: multiplicationDate || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setError(data.error || 'Failed to create group');
        setSubmitting(false);
        return;
      }

      // Redirect to the new group's page
      router.push(`/groups/${data.group.id}?new=true`);
    } catch (err) {
      console.error('Create group error:', err);
      setError('Failed to create group. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-navy text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/groups"
              className="text-white/70 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Create New Group</h1>
              <p className="text-white/70 text-sm mt-1">Start a new DNA discipleship group</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 md:p-8">
          {/* Error message */}
          {error && (
            <div className="bg-red-50 text-red-700 rounded-lg p-4 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Group Name */}
            <div>
              <label htmlFor="groupName" className="block text-sm font-medium text-navy mb-2">
                Group Name *
              </label>
              <input
                type="text"
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold"
                placeholder="e.g., Men's DNA Group, Tuesday Night DNA"
              />
              <p className="text-xs text-gray-500 mt-1">
                Choose a name that helps you identify this group
              </p>
            </div>

            {/* Start Date */}
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-navy mb-2">
                Start Date *
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold"
              />
              <p className="text-xs text-gray-500 mt-1">
                When will the group have their first meeting?
              </p>
            </div>

            {/* Multiplication Target Date */}
            <div>
              <label htmlFor="multiplicationDate" className="block text-sm font-medium text-navy mb-2">
                Multiplication Target Date <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="date"
                id="multiplicationDate"
                value={multiplicationDate}
                onChange={(e) => setMultiplicationDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold"
              />
              <p className="text-xs text-gray-500 mt-1">
                When do you hope this group will multiply? (Typically 8 weeks from start)
              </p>
            </div>

            {/* Info box */}
            <div className="bg-navy/5 rounded-lg p-4">
              <h3 className="font-medium text-navy mb-2">What happens next?</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>1. Create your group</li>
                <li>2. Add disciples to your group</li>
                <li>3. Send them the Week 1 Life Assessment</li>
                <li>4. Begin your 8-week DNA journey together</li>
              </ul>
            </div>

            {/* Submit buttons */}
            <div className="flex items-center justify-end gap-4 pt-4">
              <Link
                href="/groups"
                className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || !groupName.trim() || !startDate}
                className="bg-gold hover:bg-gold/90 text-white font-semibold py-3 px-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
