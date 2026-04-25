import { initDB, createModel } from 'lyzr-architect';
let _model: any = null;
export default async function getDecisionModel() {
  if (!_model) {
    await initDB();
    _model = createModel('Decision', {
      decision_text: { type: String, required: true },
      decided_date: { type: String, required: true },
      feature_area: { type: String, required: true },
      source_notes: { type: String },
      confidence: { type: String },
    });
  }
  return _model;
}
