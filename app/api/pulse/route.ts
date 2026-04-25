import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from 'lyzr-architect';
import getPulseEventModel from '@/models/PulseEvent';

export const dynamic = 'force-dynamic';

async function handler(req: NextRequest) {
  try {
    const PulseEvent = await getPulseEventModel();

    if (req.method === 'GET') {
      const { searchParams } = new URL(req.url);
      const branchId = searchParams.get('branch_id');
      const limit = parseInt(searchParams.get('limit') || '50', 10);

      const query = branchId ? { branch_id: branchId } : {};
      const events = await PulseEvent.find(query).sort({ createdAt: -1 }).limit(limit);
      return NextResponse.json({ success: true, data: events });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const event = await PulseEvent.create({
        branch_id: body.branch_id,
        branch_name: body.branch_name || '',
        event_type: body.event_type || 'note',
        message: body.message,
        author: body.author || '',
        severity: body.severity || 'info',
        metadata: body.metadata || {},
      });
      return NextResponse.json({ success: true, data: event }, { status: 201 });
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 });
  }
}

export const GET = authMiddleware(handler);
export const POST = authMiddleware(handler);
