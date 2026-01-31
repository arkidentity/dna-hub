import { NextResponse } from 'next/server'
import { getUnifiedSession } from '@/lib/unified-auth'
import { cookies } from 'next/headers'

/**
 * Debug endpoint to check session status
 * Visit /api/test-session to see what getUnifiedSession() returns
 */
export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('user_session')

    const session = await getUnifiedSession()

    return NextResponse.json({
      success: true,
      hasCookie: !!sessionCookie,
      cookieValue: sessionCookie?.value ? `${sessionCookie.value.substring(0, 20)}...` : null,
      hasSession: !!session,
      session: session ? {
        userId: session.userId,
        email: session.email,
        name: session.name,
        roles: session.roles
      } : null
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
