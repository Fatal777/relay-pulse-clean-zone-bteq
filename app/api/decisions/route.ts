import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, getCurrentUserId } from 'lyzr-architect';

import getDecisionModel from '@/models/Decision';

async function handleGet() {
  try {
    const Model = await getDecisionModel();
    const docs = await Model.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: docs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function handlePost(req: NextRequest) {
  try {
    const body = await req.json();
    const Model = await getDecisionModel();
    const doc = await Model.create({
      ...body,
      owner_user_id: getCurrentUserId(),
    });
    return NextResponse.json({ success: true, data: doc }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const GET = authMiddleware(handleGet);
export const POST = authMiddleware(handlePost);
