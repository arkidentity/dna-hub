import { Church, PhaseWithMilestones } from '@/lib/types';

export const parseLocalDate = (dateStr: string) => {
  const parts = dateStr.split('T')[0].split('-');
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
};

export const formatTargetDate = (dateStr?: string) => {
  if (!dateStr) return null;
  return parseLocalDate(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

export const isOverdue = (dateStr?: string, completed?: boolean) => {
  if (!dateStr || completed) return false;
  const targetDate = parseLocalDate(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return targetDate < today;
};

export const formatCallDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const getPhaseDate = (phase: PhaseWithMilestones, church: Church) => {
  const startKey = `phase_${phase.phase_number}_start` as keyof Church;
  const targetKey = `phase_${phase.phase_number}_target` as keyof Church;

  const start = church[startKey] as string | undefined;
  const target = church[targetKey] as string | undefined;

  if (start && target) {
    const startDate = parseLocalDate(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const targetDate = parseLocalDate(target).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${startDate} - ${targetDate}`;
  }

  return null;
};

export const formatFileSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const getResourceIcon = (type?: string) => {
  return type;
};
