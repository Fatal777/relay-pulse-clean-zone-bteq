import { initDB, createModel } from 'lyzr-architect';
let _model: any = null;
export default async function getTeamMemberModel() {
  if (!_model) {
    await initDB();
    _model = createModel('TeamMember', {
      name: { type: String, required: true },
      github_username: { type: String, required: true },
      role: { type: String, default: 'member' },
    });
  }
  return _model;
}
