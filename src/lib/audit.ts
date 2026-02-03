import { supabaseAdmin } from './auth';

export type AuditAction =
  | 'status_change'
  | 'milestone_toggle'
  | 'milestone_update'
  | 'notes_update'
  | 'date_update'
  | 'document_upload'
  | 'document_delete'
  | 'call_scheduled'
  | 'call_completed'
  | 'phase_advanced'
  | 'template_applied';

export type AuditEntityType = 'church' | 'milestone' | 'document' | 'call';

/**
 * Log an admin action to the audit trail
 */
export async function logAdminAction(
  adminEmail: string,
  action: AuditAction,
  entityType: AuditEntityType,
  entityId: string,
  oldValue?: Record<string, unknown> | null,
  newValue?: Record<string, unknown> | null,
  notes?: string
): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('admin_activity_log').insert({
      admin_email: adminEmail,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_value: oldValue || null,
      new_value: newValue || null,
      notes: notes || null,
    });

    if (error) {
      console.error('Failed to log admin action:', error);
    }
  } catch (err) {
    // Don't throw - audit logging should not break main functionality
    console.error('Audit log error:', err);
  }
}

/**
 * Helper to log status changes
 */
export async function logStatusChange(
  adminEmail: string,
  churchId: string,
  oldStatus: string,
  newStatus: string,
  churchName?: string
): Promise<void> {
  await logAdminAction(
    adminEmail,
    'status_change',
    'church',
    churchId,
    { status: oldStatus },
    { status: newStatus },
    churchName ? `Status changed for ${churchName}` : undefined
  );
}

/**
 * Helper to log milestone toggles
 */
export async function logMilestoneToggle(
  adminEmail: string,
  milestoneId: string,
  churchId: string,
  completed: boolean,
  milestoneTitle?: string
): Promise<void> {
  await logAdminAction(
    adminEmail,
    'milestone_toggle',
    'milestone',
    milestoneId,
    { completed: !completed, church_id: churchId },
    { completed, church_id: churchId },
    milestoneTitle ? `${completed ? 'Completed' : 'Uncompleted'}: ${milestoneTitle}` : undefined
  );
}

/**
 * Helper to log document uploads
 */
export async function logDocumentUpload(
  adminEmail: string,
  documentId: string,
  churchId: string,
  documentType: string,
  fileName?: string
): Promise<void> {
  await logAdminAction(
    adminEmail,
    'document_upload',
    'document',
    documentId,
    null,
    { document_type: documentType, church_id: churchId, file_name: fileName },
    fileName ? `Uploaded: ${fileName}` : undefined
  );
}
