import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware, getCurrentUserId } from 'lyzr-architect'
import getBranchModel from '@/models/Branch'
import getPulseEventModel from '@/models/PulseEvent'

export const dynamic = 'force-dynamic'

// POST /api/branches/[id]/handoff — mark branch as ready for review
async function handlePost(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getCurrentUserId()
    const Branch = await getBranchModel()
    const branch = await Branch.findByIdAndUpdate(
      params.id,
      { $set: { status: 'review' } },
      { new: true }
    )
    if (!branch) {
      return NextResponse.json({ success: false, error: 'Branch not found' }, { status: 404 })
    }

    // Emit pulse event
    const PulseEvent = await getPulseEventModel()
    await PulseEvent.create({
      owner_user_id: userId,
      kind:          'status_changed',
      branch_id:     params.id,
      branch_name:   branch.branch_name,
      actor:         { name: 'You' },
      payload:       { status: 'review' },
    })

    return NextResponse.json({ success: true, data: branch })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export const POST = authMiddleware(handlePost)
