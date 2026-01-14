'use client';

import { FileText, Download } from 'lucide-react';
import { FunnelDocument } from '@/lib/types';

interface DocumentsCardProps {
  documents: FunnelDocument[];
}

export default function DocumentsCard({ documents }: DocumentsCardProps) {
  const proposalPdf = documents.find(d => d.document_type === 'proposal_pdf');
  const implementationPlan = documents.find(d => d.document_type === 'implementation_plan');
  const agreementPdf = documents.find(d => d.document_type === 'agreement_pdf');

  if (!proposalPdf?.file_url && !implementationPlan?.file_url && !agreementPdf?.file_url) {
    return null;
  }

  return (
    <div className="card">
      <h3 className="font-semibold text-navy mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-gold" />
        Your Documents
      </h3>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
        {proposalPdf?.file_url && (
          <a
            href={proposalPdf.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-gold/5 hover:bg-gold/10 rounded-lg transition-colors"
          >
            <Download className="w-5 h-5 text-gold" />
            <div>
              <p className="font-medium text-navy text-sm">Partnership Proposal</p>
              <p className="text-xs text-foreground-muted">PDF Document</p>
            </div>
          </a>
        )}
        {implementationPlan?.file_url && (
          <a
            href={implementationPlan.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-teal/5 hover:bg-teal/10 rounded-lg transition-colors"
          >
            <Download className="w-5 h-5 text-teal" />
            <div>
              <p className="font-medium text-navy text-sm">Implementation Plan</p>
              <p className="text-xs text-foreground-muted">90-Day Game Plan</p>
            </div>
          </a>
        )}
        {agreementPdf?.file_url && (
          <a
            href={agreementPdf.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-success/5 hover:bg-success/10 rounded-lg transition-colors"
          >
            <Download className="w-5 h-5 text-success" />
            <div>
              <p className="font-medium text-navy text-sm">Partnership Agreement</p>
              <p className="text-xs text-foreground-muted">Signed Agreement</p>
            </div>
          </a>
        )}
      </div>
    </div>
  );
}
