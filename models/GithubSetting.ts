import { initDB, createModel } from 'lyzr-architect';
let _model: any = null;
export default async function getGithubSettingModel() {
  if (!_model) {
    await initDB();
    _model = createModel('GithubSetting', {
      repo_owner: { type: String, required: true },
      repo_name: { type: String, required: true },
      github_token_ref: { type: String },
    });
  }
  return _model;
}
