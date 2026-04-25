import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from 'lyzr-architect';
import getBranchModel from '@/models/Branch';

export const dynamic = 'force-dynamic';

async function handler(req: NextRequest) {
  try {
    const Branch = await getBranchModel();

    if (req.method === 'GET') {
      const branches = await Branch.find().sort({ createdAt: -1 });
      return NextResponse.json({ success: true, data: branches });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const branch = await Branch.create({
        name: body.name,
        repo_owner: body.repo_owner,
        repo_name: body.repo_name,
        author: body.author || '',
        status: body.status || 'active',
        files_changed: Array.isArray(body.files_changed) ? body.files_changed : [],
        commit_count: body.commit_count || 0,
        last_commit_message: body.last_commit_message || '',
        last_commit_date: body.last_commit_date || '',
        assigned_member: body.assigned_member || '',
        description: body.description || '',
        pulse_count: 0,
      });
      return NextResponse.json({ success: true, data: branch }, { status: 201 });
    }

    if (req.method === 'DELETE') {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');
      if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
      await Branch.findByIdAndDelete(id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 });
  }
}

export const GET = authMiddleware(handler);
export const POST = authMiddleware(handler);
export const DELETE = authMiddleware(handler);
