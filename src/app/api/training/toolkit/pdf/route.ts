import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedSession, hasRole, isAdmin } from '@/lib/unified-auth';
import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * GET /api/training/toolkit/pdf?file=<filename>&download=true
 * Serves leader guide PDFs to authenticated DNA Leaders and Church Leaders.
 * PDFs are stored locally in docs/resources/DNA Toolkit Leader Guides/.
 * When Supabase Storage is set up, this can redirect to signed URLs instead.
 */
export async function GET(request: NextRequest) {
  const session = await getUnifiedSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasRole(session, 'dna_leader') && !hasRole(session, 'church_leader') && !isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const filename = request.nextUrl.searchParams.get('file');
  const isDownload = request.nextUrl.searchParams.get('download') === 'true';

  if (!filename) {
    return NextResponse.json({ error: 'Missing file parameter' }, { status: 400 });
  }

  // Prevent path traversal
  const sanitized = filename.replace(/[^a-zA-Z0-9\s\-_.&]/g, '');
  if (sanitized !== filename || filename.includes('..') || filename.includes('/')) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }

  try {
    const filePath = join(process.cwd(), 'docs', 'resources', 'DNA Toolkit Leader Guides', filename);
    const fileBuffer = await readFile(filePath);

    const headers: Record<string, string> = {
      'Content-Type': 'application/pdf',
      'Cache-Control': 'private, max-age=3600',
    };

    if (isDownload) {
      headers['Content-Disposition'] = `attachment; filename="${filename}"`;
    } else {
      headers['Content-Disposition'] = `inline; filename="${filename}"`;
    }

    return new NextResponse(fileBuffer, { headers });
  } catch {
    return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
  }
}
