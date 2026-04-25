import { initDB, createModel } from 'lyzr-architect';
let _model: any = null;
export default async function getBranchModel() {
  if (!_model) {
    await initDB();
    _model = createModel('Branch', {
      name: { type: String, required: true },
      repo_owner: { type: String, required: true },
      repo_name: { type: String, required: true },
      author: { type: String },
      status: { type: String, default: 'active' },
      files_changed: [{ type: String }],
      commit_count: { type: Number, default: 0 },
      last_commit_message: { type: String },
      last_commit_date: { type: String },
      assigned_member: { type: String },
      description: { type: String },
      pulse_count: { type: Number, default: 0 },
    });
  }
  return _model;
}
