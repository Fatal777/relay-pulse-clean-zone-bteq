import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, getCurrentUserId } from 'lyzr-architect';

import getGithubSettingModel from '@/models/GithubSetting';

async function handleGet() {
  try {
    const Model = await getGithubSettingModel();
    const docs = await Model.find({});
    return NextResponse.json({ success: true, data: docs?.[0] || null });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function handlePost(req: NextRequest) {
  try {
    const body = await req.json();
    const Model = await getGithubSettingModel();
    const existing = await Model.find({});
    let doc;
    if (existing && existing.length > 0) {
      doc = await Model.findByIdAndUpdate(existing[0]._id, body, { new: true });
    } else {
      doc = await Model.create({
        ...body,
        owner_user_id: getCurrentUserId(),
      });
    }
    return NextResponse.json({ success: true, data: doc });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const GET = authMiddleware(handleGet);
export const POST = authMiddleware(handlePost);
