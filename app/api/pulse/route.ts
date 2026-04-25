import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware, getCurrentUserId } from 'lyzr-architect'
import getPulseEventModel from '@/models/PulseEvent'

export const dynamic = 'force-dynamic'

// ── GET /api/pulse?since=<iso> — polling endpoint ─────────────────────────────
async function handleGet(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const since = searchParams.get('since')

    const PulseEvent = await getPulseEventModel()
    const query: Record<string, unknown> = {}
    if (since) {
      query.createdAt = { $gt: new Date(since) }
    }

    const events = await PulseEvent.find(query)
      .sort({ createdAt: -1 })
      .limit(50)

    // Normalize _id to string for client
    const data = events.map((e: any) => ({
      _id:         e._id.toString(),
      kind:        e.kind,
      branch_id:   e.branch_id,
      branch_name: e.branch_name,
      actor:       e.actor,
      payload:     e.payload ?? {},
      created_at:  e.createdAt?.toISOString() ?? new Date().toISOString(),
    }))

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error('[GET /api/pulse]', err.message)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// ── POST /api/pulse — emit a pulse event ─────────────────────────────────────
async function handlePost(req: NextRequest) {
  try {
    const userId = getCurrentUserId()
    const body   = await req.json()

    const { kind, branch_id, branch_name, payload, actor } = body
    if (!kind) {
      return NextResponse.json({ success: false, error: 'kind is required' }, { status: 400 })
    }

    const PulseEvent = await getPulseEventModel()
    const doc = await PulseEvent.create({
      owner_user_id: userId,
      kind,
      branch_id,
      branch_name,
      actor: actor ?? { name: 'System' },
      payload: payload ?? {},
    })

    return NextResponse.json({ success: true, data: doc }, { status: 201 })
  } catch (err: any) {
    console.error('[POST /api/pulse]', err.message)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export const GET  = authMiddleware(handleGet)
export const POST = authMiddleware(handlePost)
