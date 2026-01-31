// Admin API: Fireflies Settings Management
// GET - Get current settings
// POST - Save/update API key
// DELETE - Disconnect Fireflies

import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth';
import {
  getFirefliesSettings,
  saveFirefliesApiKey,
  disconnectFireflies,
  isFirefliesConnected,
} from '@/lib/fireflies';

/**
 * GET /api/admin/fireflies/settings
 * Get Fireflies connection status and settings
 */
export async function GET() {
  try {
    const session = await getUnifiedSession();
    if (!session || !isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connected = await isFirefliesConnected();
    const settings = await getFirefliesSettings();

    return NextResponse.json({
      connected,
      settings: settings ? {
        admin_email: settings.admin_email,
        auto_process_enabled: settings.auto_process_enabled,
        auto_match_enabled: settings.auto_match_enabled,
        auto_share_with_churches: settings.auto_share_with_churches,
        connected_at: settings.connected_at,
        last_webhook_received_at: settings.last_webhook_received_at,
        // Don't expose API key
      } : null,
    });
  } catch (error) {
    console.error('Failed to get Fireflies settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/fireflies/settings
 * Save or update Fireflies API key and settings
 *
 * Body:
 * {
 *   api_key: string
 *   webhook_secret?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getUnifiedSession();
    if (!session || !isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { api_key, webhook_secret } = body;

    if (!api_key) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    const result = await saveFirefliesApiKey(
      session.email,
      api_key,
      webhook_secret
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to save API key' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Fireflies connected successfully',
    });
  } catch (error) {
    console.error('Failed to save Fireflies API key:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/fireflies/settings
 * Disconnect Fireflies
 */
export async function DELETE() {
  try {
    const session = await getUnifiedSession();
    if (!session || !isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await disconnectFireflies(session.email);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to disconnect' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Fireflies disconnected successfully',
    });
  } catch (error) {
    console.error('Failed to disconnect Fireflies:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
