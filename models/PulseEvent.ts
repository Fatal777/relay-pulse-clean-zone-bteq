import { initDB, createModel } from 'lyzr-architect';
let _model: any = null;
export default async function getPulseEventModel() {
  if (!_model) {
    await initDB();
    _model = createModel('PulseEvent', {
      branch_id: { type: String, required: true },
      branch_name: { type: String, required: true },
      event_type: { type: String, required: true },
      message: { type: String, required: true },
      author: { type: String },
      severity: { type: String, default: 'info' },
      metadata: { type: Object },
    });
  }
  return _model;
}
