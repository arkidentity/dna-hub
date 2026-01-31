import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/auth';
import { getUnifiedSession } from '@/lib/unified-auth';

// Generate ICS file content
function generateICS(events: Array<{
  title: string;
  description: string;
  date: string;
  churchName: string;
}>): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DNA Church Hub//DNA Implementation//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  events.forEach((event, index) => {
    const date = new Date(event.date);
    const dateStr = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const uid = `dna-milestone-${index}-${Date.now()}@arkidentity.com`;

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dateStr}`,
      `DTSTART;VALUE=DATE:${event.date.replace(/-/g, '')}`,
      `SUMMARY:${escapeICS(event.title)}`,
      `DESCRIPTION:${escapeICS(event.description)}\\n\\nChurch: ${escapeICS(event.churchName)}`,
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

// Escape special characters for ICS format
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export async function GET(request: NextRequest) {
  try {
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const churchId = session.churchId;
    if (!churchId) {
      return NextResponse.json(
        { error: 'No church associated with session' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const phaseNumber = searchParams.get('phase');

    // Get church name
    const { data: church } = await supabaseAdmin
      .from('churches')
      .select('name')
      .eq('id', churchId)
      .single();

    const churchName = church?.name || 'Unknown Church';

    // Build query for milestones with target dates
    let query = supabaseAdmin
      .from('church_progress')
      .select(`
        target_date,
        milestone:milestones(
          id,
          title,
          description,
          phase:phases(phase_number, name)
        )
      `)
      .eq('church_id', churchId)
      .not('target_date', 'is', null);

    const { data: progressData, error: progressError } = await query;

    if (progressError) {
      console.error('Calendar fetch error:', progressError);
      return NextResponse.json(
        { error: 'Failed to fetch calendar data' },
        { status: 500 }
      );
    }

    // Filter by phase if specified
    let events = progressData?.filter(p => p.milestone && p.target_date) || [];

    if (phaseNumber) {
      events = events.filter(p => {
        const milestone = p.milestone as unknown as {
          phase: Array<{ phase_number: number }>;
        };
        return milestone?.phase?.[0]?.phase_number === parseInt(phaseNumber);
      });
    }

    // Transform to calendar events
    const calendarEvents = events.map(p => {
      const milestone = p.milestone as unknown as {
        title: string;
        description?: string;
        phase: Array<{ name: string; phase_number: number }>;
      };

      return {
        title: `DNA: ${milestone.title}`,
        description: milestone.description || '',
        date: p.target_date as string,
        churchName: churchName,
      };
    });

    // Sort by date
    calendarEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Generate ICS content
    const icsContent = generateICS(calendarEvents);

    // Return as downloadable file
    const phaseSuffix = phaseNumber ? `-phase${phaseNumber}` : '';
    const filename = `dna-milestones${phaseSuffix}.ics`;

    return new NextResponse(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Calendar export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
