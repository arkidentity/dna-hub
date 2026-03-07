import {
  BookOpen,
  FileText,
  Shield,
  Music,
  BarChart3,
  MessageSquare,
  Users,
  Heart,
  Footprints,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react';
import type { BlockType } from '@/lib/types';

export type BlockCategory = 'content' | 'engagement' | 'action';

export interface BlockTypeInfo {
  type: BlockType;
  label: string;
  icon: LucideIcon;
  category: BlockCategory;
  categoryLabel: string;
  description: string;
  defaultConfig: Record<string, unknown>;
}

const BLOCK_TYPES: BlockTypeInfo[] = [
  // Content blocks
  {
    type: 'scripture',
    label: 'Scripture',
    icon: BookOpen,
    category: 'content',
    categoryLabel: 'Content',
    description: 'Push a Bible passage to phones',
    defaultConfig: { passage_ref: '', passage_text: '', translation: 'NIV' },
  },
  {
    type: 'teaching_note',
    label: 'Teaching Note',
    icon: FileText,
    category: 'content',
    categoryLabel: 'Content',
    description: 'Pastor outline or key points',
    defaultConfig: { title: '', text: '' },
  },
  {
    type: 'creed_card',
    label: 'Creed Card',
    icon: Shield,
    category: 'content',
    categoryLabel: 'Content',
    description: 'Push an existing Creed Card',
    defaultConfig: { card_id: 1 },
  },
  {
    type: 'worship_set',
    label: 'Worship Set',
    icon: Music,
    category: 'content',
    categoryLabel: 'Content',
    description: 'Song list for this service',
    defaultConfig: { songs: [] },
  },
  // Engagement blocks
  {
    type: 'poll',
    label: 'Poll',
    icon: BarChart3,
    category: 'engagement',
    categoryLabel: 'Engagement',
    description: 'Multiple choice question',
    defaultConfig: {
      question: '',
      options: [
        { id: 'a', label: '' },
        { id: 'b', label: '' },
      ],
      anonymous: true,
      show_results_live: true,
    },
  },
  {
    type: 'open_response',
    label: 'Open Response',
    icon: MessageSquare,
    category: 'engagement',
    categoryLabel: 'Engagement',
    description: 'Free text answers (moderated)',
    defaultConfig: { title: '', question: '', moderated: true },
  },
  {
    type: 'breakout_prompt',
    label: 'Breakout Prompt',
    icon: Users,
    category: 'engagement',
    categoryLabel: 'Engagement',
    description: 'Discussion question with timer',
    defaultConfig: { title: '', question: '', timer_seconds: 180, timer_warning_at: 30 },
  },
  // Action blocks
  {
    type: 'giving',
    label: 'Giving',
    icon: Heart,
    category: 'action',
    categoryLabel: 'Action',
    description: 'Push church giving link',
    defaultConfig: { giving_url: '', message: '' },
  },
  {
    type: 'next_steps',
    label: 'Next Steps',
    icon: Footprints,
    category: 'action',
    categoryLabel: 'Action',
    description: 'One-tap response options',
    defaultConfig: {
      prompt: '',
      steps: [{ id: 'step_1', label: '', icon: 'heart' }],
    },
  },
  {
    type: 'connect_card',
    label: 'Connect Card',
    icon: ClipboardList,
    category: 'action',
    categoryLabel: 'Action',
    description: 'Guest/visitor information form',
    defaultConfig: {
      fields: ['first_time', 'address', 'how_heard', 'prayer_request'],
      custom_fields: [],
    },
  },
];

export function getBlockTypeInfo(type: BlockType): BlockTypeInfo {
  return BLOCK_TYPES.find((bt) => bt.type === type) || BLOCK_TYPES[0];
}

export function getBlockTypesByCategory(): { category: BlockCategory; label: string; types: BlockTypeInfo[] }[] {
  const categories: BlockCategory[] = ['content', 'engagement', 'action'];
  return categories.map((cat) => {
    const types = BLOCK_TYPES.filter((bt) => bt.category === cat);
    return { category: cat, label: types[0]?.categoryLabel || cat, types };
  });
}

export function getBlockConfigSummary(type: BlockType, config: Record<string, unknown>): string {
  switch (type) {
    case 'scripture':
      return (config.passage_ref as string) || 'No passage set';
    case 'teaching_note':
      return (config.title as string)?.slice(0, 60) || (config.text as string)?.slice(0, 60) || 'No content';
    case 'creed_card':
      return `Card #${config.card_id || '?'}`;
    case 'worship_set': {
      const songs = config.songs as { title: string }[] | undefined;
      return songs?.length ? `${songs.length} song${songs.length > 1 ? 's' : ''}` : 'No songs';
    }
    case 'poll': {
      const opts = config.options as { label: string }[] | undefined;
      return (config.question as string)?.slice(0, 40) || `${opts?.length || 0} options`;
    }
    case 'open_response':
      return (config.title as string)?.slice(0, 50) || (config.question as string)?.slice(0, 50) || 'No question set';
    case 'breakout_prompt': {
      const secs = config.timer_seconds as number | undefined;
      const bTitle = config.title as string | undefined;
      return bTitle || (secs ? `${Math.floor(secs / 60)}min timer` : 'No timer');
    }
    case 'giving':
      return (config.giving_url as string) ? 'Link configured' : 'No link set';
    case 'next_steps': {
      const steps = config.steps as { label: string }[] | undefined;
      return steps?.length ? `${steps.length} step${steps.length > 1 ? 's' : ''}` : 'No steps';
    }
    case 'connect_card': {
      const fields = config.fields as string[] | undefined;
      return fields?.length ? `${fields.length} field${fields.length > 1 ? 's' : ''}` : 'Default fields';
    }
    default:
      return '';
  }
}

export default BLOCK_TYPES;
