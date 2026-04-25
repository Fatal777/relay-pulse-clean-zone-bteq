import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware, getCurrentUserId } from 'lyzr-architect'
import getBranchModel from '@/models/Branch'
import getPulseEventModel from '@/models/PulseEvent'
import getDecisionModel from '@/models/Decision'

export const dynamic = 'force-dynamic'

// ── GET /api/branches/[id] — branch detail ────────────────────────────────────
async function handleGet(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const Branch = await getBranchModel()
    const branch = await Branch.findById(params.id)
    if (!branch) {
      return NextResponse.json({ success: false, error: 'Branch not found' }, { status: 404 })
    }

    // Also fetch decisions linked to this branch
    const Decision = await getDecisionModel()
    const decisions = await Decision.find({ branch_id: params.id }).sort({ createdAt: -1 })

    return NextResponse.json({ success: true, data: { branch, decisions } })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// ── PATCH /api/branches/[id] — update intent, status, pinned, kind ────────────
async function handlePatch(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body   = await req.json()
    const Branch = await getBranchModel()
    const allowed = ['intent', 'status', 'pinned', 'kind']
    const update: Record<string, unknown> = {}
    for (const key of allowed) {
      if (body[key] !== undefined) update[key] = body[key]
    }

    const branch = await Branch.findByIdAndUpdate(params.id, { $set: update }, { new: true })
    if (!branch) {
      return NextResponse.json({ success: false, error: 'Branch not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: branch })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export const GET   = authMiddleware(handleGet)
export const PATCH = authMiddleware(handlePatch)
