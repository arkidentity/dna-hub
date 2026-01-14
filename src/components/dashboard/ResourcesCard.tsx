'use client';

import { BookOpen, FileText, Video } from 'lucide-react';
import { GlobalResource } from '@/lib/types';

interface ResourcesCardProps {
  resources: GlobalResource[];
}

export default function ResourcesCard({ resources }: ResourcesCardProps) {
  const filteredResources = resources.filter(r => r.file_url);

  if (filteredResources.length === 0) {
    return null;
  }

  return (
    <div className="card">
      <h3 className="font-semibold text-navy mb-4 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-purple-600" />
        DNA Resources
      </h3>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
        {filteredResources.map((resource) => (
          <a
            key={resource.id}
            href={resource.file_url!}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
          >
            {resource.resource_type === 'worksheet' && <FileText className="w-5 h-5 text-blue-500" />}
            {resource.resource_type === 'pdf' && <FileText className="w-5 h-5 text-red-500" />}
            {resource.resource_type === 'guide' && <BookOpen className="w-5 h-5 text-purple-600" />}
            {resource.resource_type === 'video' && <Video className="w-5 h-5 text-purple-500" />}
            {!resource.resource_type && <FileText className="w-5 h-5 text-gray-500" />}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-navy text-sm truncate">{resource.name}</p>
              {resource.description && (
                <p className="text-xs text-foreground-muted truncate">{resource.description}</p>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
