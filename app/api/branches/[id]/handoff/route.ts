import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from 'lyzr-architect';
import getBranchModel from '@/models/Branch';
import getPulseEventModel from '@/models/PulseEvent';

export const dynamic = 'force-dynamic';

async function handler(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const Branch = await getBranchModel();
    const PulseEvent = await getPulseEventModel();

    const body = await req.json();
    const fromMember = body.from_member || 'Unknown';
    const toMember = body.to_member || 'Unknown';
    const notes = body.notes || '';

    const branch = await Branch.findById(id);
    if (!branch) return NextResponse.json({ success: false, error: 'Branch not found' }, { status: 404 });

    await Branch.findByIdAndUpdate(id, { assigned_member: toMember });

    await PulseEvent.create({
      branch_id: id,
      branch_name: branch.name,
      event_type: 'handoff',
      message: `${fromMember} handed off branch "${branch.name}" to ${toMember}${notes ? `: ${notes}` : ''}`,
      author: fromMember,
      severity: 'warning',
      metadata: { from: fromMember, to: toMember, notes },
    });

    const updated = await Branch.findById(id);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 });
  }
}

export const POST = authMiddleware(handler);
