import { initDB, createModel } from 'lyzr-architect'

let _model: any = null

export default async function getBranchModel() {
  if (!_model) {
    await initDB()
    _model = createModel('Branch', {
      // GitHub identity
      repo_owner:   { type: String, required: true },
      repo_name:    { type: String, required: true },
      branch_name:  { type: String, required: true },

      // Inferred from branch name (feature/fix/chore/refactor)
      kind: {
        type:    String,
        enum:    ['feature', 'fix', 'chore', 'refactor'],
        default: 'feature',
      },

      // Status lifecycle: active → review → merged | abandoned
      status: {
        type:    String,
        enum:    ['active', 'review', 'merged', 'abandoned'],
        default: 'active',
      },

      // From GitHub — branch author
      github_author: { type: String, default: '' },

      // Relay users who joined this branch session (stored as user name strings for simplicity)
      collaborator_user_ids: { type: [String], default: [] },

      // Whether the last sync detected conflicts with other branches
      hasConflict: { type: Boolean, default: false },

      // Free-form intent set by the developer
      intent: { type: String, default: '' },

      // Pinned to top in sidebar
      pinned: { type: Boolean, default: false },

      // Changed files (snapshot from last GitHub sync)
      changed_files: { type: [String], default: [] },

      // PR number if one exists for this branch
      pr_number: { type: Number },
      pr_title:  { type: String },
      pr_url:    { type: String },

      // Timestamp of last GitHub sync
      last_synced_at: { type: Date, default: Date.now },
    })
  }
  return _model
}
