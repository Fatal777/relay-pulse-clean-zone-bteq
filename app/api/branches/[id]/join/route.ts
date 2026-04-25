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
    const memberName = body.member_name || 'Unknown';

    const branch = await Branch.findById(id);
    if (!branch) return NextResponse.json({ success: false, error: 'Branch not found' }, { status: 404 });

    await Branch.findByIdAndUpdate(id, { assigned_member: memberName, status: 'active' });

    await PulseEvent.create({
      branch_id: id,
      branch_name: branch.name,
      event_type: 'join',
      message: `${memberName} joined branch "${branch.name}"`,
      author: memberName,
      severity: 'info',
    });

    const updated = await Branch.findById(id);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 });
  }
}

export const POST = authMiddleware(handler);
