'use client';

import { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Loader2,
  AlertCircle,
  FileText,
  Video,
  Link as LinkIcon,
  Edit2,
  Trash2,
  Upload,
  X,
  ExternalLink,
  Eye,
  EyeOff,
} from 'lucide-react';
import { GlobalResource } from '@/lib/types';

type ResourceFormData = {
  name: string;
  description: string;
  file_url: string;
  resource_type: 'pdf' | 'video' | 'link';
  category: string;
  display_order: number;
  is_active: boolean;
};

export default function ResourcesTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resources, setResources] = useState<GlobalResource[]>([]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingResource, setEditingResource] = useState<GlobalResource | null>(null);
  const [formData, setFormData] = useState<ResourceFormData>({
    name: '',
    description: '',
    file_url: '',
    resource_type: 'pdf',
    category: '',
    display_order: 0,
    is_active: true,
  });

  // File upload state
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  // Saving state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/resources');
      if (!response.ok) {
        throw new Error('Failed to fetch resources');
      }

      const data = await response.json();
      setResources(data.resources || []);
    } catch (err) {
      console.error('Error fetching resources:', err);
      setError('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (resource?: GlobalResource) => {
    if (resource) {
      setEditingResource(resource);
      setFormData({
        name: resource.name,
        description: resource.description || '',
        file_url: resource.file_url || '',
        resource_type: (resource.resource_type as 'pdf' | 'video' | 'link') || 'pdf',
        category: resource.category || '',
        display_order: resource.display_order,
        is_active: resource.is_active,
      });
      // Extract filename from URL if it's a PDF
      if (resource.resource_type === 'pdf' && resource.file_url) {
        const urlParts = resource.file_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        setUploadedFileName(decodeURIComponent(fileName));
      }
    } else {
      setEditingResource(null);
      setFormData({
        name: '',
        description: '',
        file_url: '',
        resource_type: 'pdf',
        category: '',
        display_order: resources.length,
        is_active: true,
      });
      setUploadedFileName('');
    }
    setSaveError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingResource(null);
    setUploadedFileName('');
    setSaveError(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setSaveError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/resources/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      setFormData(prev => ({ ...prev, file_url: data.file_url }));
      setUploadedFileName(data.file_name);
    } catch (err) {
      console.error('Upload error:', err);
      setSaveError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);

    try {
      // Validation
      if (!formData.name.trim()) {
        throw new Error('Name is required');
      }

      if (formData.resource_type === 'pdf' && !formData.file_url) {
        throw new Error('Please upload a PDF file');
      }

      if ((formData.resource_type === 'video' || formData.resource_type === 'link') && !formData.file_url.trim()) {
        throw new Error('URL is required');
      }

      const url = editingResource
        ? `/api/admin/resources/${editingResource.id}`
        : '/api/admin/resources';

      const method = editingResource ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save resource');
      }

      await fetchResources();
      handleCloseModal();
    } catch (err) {
      console.error('Save error:', err);
      setSaveError(err instanceof Error ? err.message : 'Failed to save resource');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/resources/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete resource');
      }

      await fetchResources();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete resource');
    }
  };

  const toggleActive = async (resource: GlobalResource) => {
    try {
      const response = await fetch(`/api/admin/resources/${resource.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...resource,
          is_active: !resource.is_active,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update resource');
      }

      await fetchResources();
    } catch (err) {
      console.error('Toggle error:', err);
      alert('Failed to update resource');
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'video':
        return <Video className="w-5 h-5 text-purple-500" />;
      case 'link':
        return <LinkIcon className="w-5 h-5 text-blue-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-navy mb-2">Failed to load resources</h3>
        <p className="text-foreground-muted mb-4">{error}</p>
        <button onClick={fetchResources} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-navy flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-purple-600" />
            Global Resources
          </h2>
          <p className="text-foreground-muted mt-1">
            Manage PDFs, videos, and links available to all churches
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Resource
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <p className="text-sm text-foreground-muted mb-1">Total Resources</p>
          <p className="text-2xl font-bold text-navy">{resources.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-foreground-muted mb-1">Active</p>
          <p className="text-2xl font-bold text-green-600">
            {resources.filter(r => r.is_active).length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-foreground-muted mb-1">PDFs</p>
          <p className="text-2xl font-bold text-red-500">
            {resources.filter(r => r.resource_type === 'pdf').length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-foreground-muted mb-1">Videos & Links</p>
          <p className="text-2xl font-bold text-purple-500">
            {resources.filter(r => r.resource_type === 'video' || r.resource_type === 'link').length}
          </p>
        </div>
      </div>

      {/* Resources List */}
      {resources.length === 0 ? (
        <div className="card text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-navy mb-2">No resources yet</h3>
          <p className="text-foreground-muted mb-4">
            Add your first global resource to make it available to all churches
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Resource
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {resources.map((resource) => (
            <div
              key={resource.id}
              className={`card flex items-start gap-4 ${!resource.is_active ? 'opacity-50' : ''}`}
            >
              {/* Icon */}
              <div className="flex-shrink-0 mt-1">
                {getResourceIcon(resource.resource_type || 'pdf')}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-navy mb-1">{resource.name}</h3>
                    {resource.description && (
                      <p className="text-sm text-foreground-muted mb-2">{resource.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-foreground-muted">
                      <span className="capitalize">{resource.resource_type || 'pdf'}</span>
                      {resource.category && <span>• {resource.category}</span>}
                      <span>• Order: {resource.display_order}</span>
                      {!resource.is_active && (
                        <span className="text-orange-600 font-medium">• Inactive</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {resource.file_url && (
                      <a
                        href={resource.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-navy transition-colors"
                        title="View resource"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => toggleActive(resource)}
                      className="p-2 text-gray-400 hover:text-navy transition-colors"
                      title={resource.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {resource.is_active ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleOpenModal(resource)}
                      className="p-2 text-gray-400 hover:text-navy transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(resource.id)}
                      className="p-2 text-gray-400 hover:text-error transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-card-border px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-navy">
                {editingResource ? 'Edit Resource' : 'Add New Resource'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 text-gray-400 hover:text-navy transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {saveError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-error">{saveError}</p>
                </div>
              )}

              {/* Resource Type */}
              <div>
                <label className="block text-sm font-medium text-navy mb-2">
                  Resource Type <span className="text-error">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['pdf', 'video', 'link'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, resource_type: type, file_url: '' }))}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        formData.resource_type === type
                          ? 'border-gold bg-gold/10'
                          : 'border-card-border hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        {type === 'pdf' && <FileText className="w-6 h-6 text-red-500" />}
                        {type === 'video' && <Video className="w-6 h-6 text-purple-500" />}
                        {type === 'link' && <LinkIcon className="w-6 h-6 text-blue-500" />}
                        <span className="text-sm font-medium capitalize">{type}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-navy mb-2">
                  Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="input w-full"
                  placeholder="e.g., Leader Identification Worksheet"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-navy mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="input w-full"
                  rows={3}
                  placeholder="Brief description of this resource..."
                />
              </div>

              {/* File Upload (PDF) or URL (Video/Link) */}
              {formData.resource_type === 'pdf' ? (
                <div>
                  <label className="block text-sm font-medium text-navy mb-2">
                    PDF File <span className="text-error">*</span>
                  </label>
                  {uploadedFileName ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-700">{uploadedFileName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, file_url: '' }));
                          setUploadedFileName('');
                        }}
                        className="text-green-600 hover:text-green-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-card-border rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-foreground-muted mb-2">
                        Upload a PDF file (max 10MB)
                      </p>
                      <label className="btn-secondary inline-flex items-center gap-2 cursor-pointer">
                        <Upload className="w-4 h-4" />
                        {uploadingFile ? 'Uploading...' : 'Choose File'}
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={handleFileUpload}
                          disabled={uploadingFile}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-navy mb-2">
                    URL <span className="text-error">*</span>
                  </label>
                  <input
                    type="url"
                    value={formData.file_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, file_url: e.target.value }))}
                    className="input w-full"
                    placeholder={formData.resource_type === 'video' ? 'https://youtube.com/watch?v=...' : 'https://...'}
                  />
                  {formData.resource_type === 'video' && (
                    <p className="text-xs text-foreground-muted mt-1">
                      Enter a YouTube link or other video URL
                    </p>
                  )}
                </div>
              )}

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-navy mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="input w-full"
                  placeholder="e.g., welcome_package, phase_1, training"
                />
                <p className="text-xs text-foreground-muted mt-1">
                  Optional: Used for organizing resources
                </p>
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-sm font-medium text-navy mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                  className="input w-full"
                  min="0"
                />
                <p className="text-xs text-foreground-muted mt-1">
                  Lower numbers appear first
                </p>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4 text-gold focus:ring-gold border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-navy">
                  Active (visible to all churches)
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-card-border px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="btn-secondary"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="btn-primary"
                disabled={saving || uploadingFile}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>Save Resource</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
