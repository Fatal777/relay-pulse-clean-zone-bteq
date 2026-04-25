import { initDB, createModel } from 'lyzr-architect'

let _model: any = null

export default async function getPulseEventModel() {
  if (!_model) {
    await initDB()
    _model = createModel('PulseEvent', {
      kind: {
        type: String,
        enum: [
          'commit',
          'pr_opened',
          'decision_saved',
          'conflict_detected',
          'member_joined',
          'review_generated',
          'branch_synced',
          'status_changed',
        ],
        required: true,
      },

      // Optional branch context
      branch_id:   { type: String },
      branch_name: { type: String },

      // Who triggered this event
      actor: {
        name:            { type: String, required: true },
        github_username: { type: String },
      },

      // Kind-specific data (free-form JSON)
      payload: { type: Object, default: {} },
    })
  }
  return _model
}
