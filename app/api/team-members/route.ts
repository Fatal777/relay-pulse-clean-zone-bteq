import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, getCurrentUserId } from 'lyzr-architect';

import getTeamMemberModel from '@/models/TeamMember';

async function handleGet() {
  try {
    const Model = await getTeamMemberModel();
    const docs = await Model.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: docs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function handlePost(req: NextRequest) {
  try {
    const body = await req.json();
    const Model = await getTeamMemberModel();
    const doc = await Model.create({
      ...body,
      owner_user_id: getCurrentUserId(),
    });
    return NextResponse.json({ success: true, data: doc }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function handleDelete(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }
    const Model = await getTeamMemberModel();
    await Model.findByIdAndDelete(id);
    return NextResponse.json({ success: true, data: { deleted: id } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const GET = authMiddleware(handleGet);
export const POST = authMiddleware(handlePost);
export const DELETE = authMiddleware(handleDelete);
