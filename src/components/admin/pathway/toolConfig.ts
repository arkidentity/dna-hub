import {
  ClipboardCheck,
  BookOpen,
  Heart,
  Shield,
  HelpCircle,
  Ear,
  Globe,
  Mic,
  Hammer,
  Sparkles,
  Gift,
  Users,
  Moon,
  Music,
  MessageCircle,
  Wine,
  type LucideIcon,
} from 'lucide-react';

export type ToolCategory = 'spiritual_formation' | 'community' | 'mission' | 'assessment';

export interface ToolCategoryInfo {
  label: string;
  color: string;
}

export const TOOL_CATEGORIES: Record<ToolCategory, ToolCategoryInfo> = {
  spiritual_formation: { label: 'Spiritual Formation', color: '#2D6A6A' },
  community: { label: 'Community', color: '#D4A853' },
  mission: { label: 'Mission', color: '#8B4513' },
  assessment: { label: 'Assessment', color: '#4A5568' },
};

const ICON_MAP: Record<string, LucideIcon> = {
  ClipboardCheck,
  BookOpen,
  Heart,
  Shield,
  HelpCircle,
  Ear,
  Globe,
  Mic,
  Hammer,
  Sparkles,
  Gift,
  Users,
  Moon,
  Music,
  MessageCircle,
  Wine,
};

export function getToolIcon(iconName: string | null): LucideIcon {
  if (iconName && ICON_MAP[iconName]) {
    return ICON_MAP[iconName];
  }
  return BookOpen; // fallback
}

export interface PathwayToolRecord {
  id: number;
  slug: string;
  name: string;
  description: string;
  category: ToolCategory;
  tool_type: 'app_tool' | 'activity';
  app_route: string | null;
  icon_name: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface PathwayItemRecord {
  id: string;
  pathway_id: string;
  week_number: number;
  tool_id: number;
  pathway_tools: PathwayToolRecord;
}
