import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from 'lyzr-architect';
import getBranchModel from '@/models/Branch';

export const dynamic = 'force-dynamic';

async function handler(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const Branch = await getBranchModel();

    if (req.method === 'GET') {
      const branch = await Branch.findById(id);
      if (!branch) return NextResponse.json({ success: false, error: 'Branch not found' }, { status: 404 });
      return NextResponse.json({ success: true, data: branch });
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const body = await req.json();
      const branch = await Branch.findByIdAndUpdate(id, body, { new: true });
      if (!branch) return NextResponse.json({ success: false, error: 'Branch not found' }, { status: 404 });
      return NextResponse.json({ success: true, data: branch });
    }

    if (req.method === 'DELETE') {
      await Branch.findByIdAndDelete(id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 });
  }
}

export const GET = authMiddleware(handler);
export const PUT = authMiddleware(handler);
export const PATCH = authMiddleware(handler);
export const DELETE = authMiddleware(handler);
