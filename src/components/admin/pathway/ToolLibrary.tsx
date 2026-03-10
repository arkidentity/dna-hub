'use client';

import { useState } from 'react';
import { Search, Wrench, Activity } from 'lucide-react';
import { getToolIcon, TOOL_CATEGORIES, type PathwayToolRecord, type ToolCategory } from './toolConfig';

interface ToolLibraryProps {
  tools: PathwayToolRecord[];
  onAddTool: (tool: PathwayToolRecord) => void;
}

export default function ToolLibrary({ tools, onAddTool }: ToolLibraryProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ToolCategory | 'all'>('all');

  const filtered = tools.filter((tool) => {
    const matchesSearch = !search || tool.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || tool.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Object.entries(TOOL_CATEGORIES) as [ToolCategory, { label: string }][];

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-sm font-semibold text-navy mb-3">Tool Library</h3>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
        <input
          type="text"
          placeholder="Search tools..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 text-sm border border-card-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
        />
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1 mb-3">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
            categoryFilter === 'all'
              ? 'bg-navy text-white'
              : 'bg-gray-100 text-foreground-muted hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {categories.map(([key, cat]) => (
          <button
            key={key}
            onClick={() => setCategoryFilter(key)}
            className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
              categoryFilter === key
                ? 'bg-navy text-white'
                : 'bg-gray-100 text-foreground-muted hover:bg-gray-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tool list */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {filtered.map((tool) => {
          const Icon = getToolIcon(tool.icon_name);
          return (
            <button
              key={tool.id}
              onClick={() => onAddTool(tool)}
              className="w-full flex items-center gap-2.5 p-2.5 rounded-lg border border-card-border hover:border-gold hover:bg-gold/5 transition-colors text-left group"
            >
              <Icon className="w-4 h-4 text-navy flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-navy">{tool.name}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {tool.tool_type === 'app_tool' ? (
                    <Wrench className="w-3 h-3 text-teal" />
                  ) : (
                    <Activity className="w-3 h-3 text-gold" />
                  )}
                  <span className="text-xs text-foreground-muted">
                    {tool.tool_type === 'app_tool' ? 'App Tool' : 'Activity'}
                  </span>
                </div>
              </div>
              <span className="text-xs text-foreground-muted opacity-0 group-hover:opacity-100 transition-opacity">
                + Add
              </span>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-foreground-muted text-center py-4">No tools match your search</p>
        )}
      </div>
    </div>
  );
}
