'use client';

import { PhaseWithMilestones, Church, FunnelDocument, ScheduledCall, GlobalResource } from '@/lib/types';
import ProgressBar from './ProgressBar';
import NextStepsCard from './NextStepsCard';
import ScheduleCallCard from './ScheduleCallCard';
import DocumentsCard from './DocumentsCard';
import ResourcesCard from './ResourcesCard';
import QuickStats from './QuickStats';
import ChurchAppQRCard from '@/components/shared/ChurchAppQRCard';

interface OverviewTabProps {
  phases: PhaseWithMilestones[];
  church: Church;
  documents: FunnelDocument[];
  calls: ScheduledCall[];
  globalResources: GlobalResource[];
  onViewAllClick: () => void;
}

export default function OverviewTab({
  phases,
  church,
  documents,
  calls,
  globalResources,
  onViewAllClick,
}: OverviewTabProps) {
  const currentPhase = phases.find(p => p.phase_number === church.current_phase) || phases.find(p => p.phase_number === 1);

  return (
    <div className="space-y-6">
      {/* Overall Progress Card */}
      <ProgressBar
        phases={phases}
        church={church}
        title="Implementation Progress"
        showPerPhase={true}
        compact={true}
      />

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-6">
        <NextStepsCard
          phases={phases}
          currentPhase={currentPhase}
          onViewAllClick={onViewAllClick}
        />
        <ScheduleCallCard calls={calls} />
      </div>

      {/* Documents Section */}
      <DocumentsCard documents={documents} />

      {/* DNA Resources Section */}
      <ResourcesCard resources={globalResources} />

      {/* Church App Link & QR Code — shown when subdomain is configured */}
      {church.subdomain && (
        <ChurchAppQRCard
          url={`https://${church.subdomain}.dailydna.app`}
          logoUrl={church.icon_url || church.splash_logo_url}
          downloadName={church.subdomain}
        />
      )}

      {/* Quick Stats */}
      <QuickStats phases={phases} church={church} />
    </div>
  );
}
