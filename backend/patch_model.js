const mongoose = require('mongoose');
const AIModel = require('./models/AIModel');

async function patch() {
  await mongoose.connect('mongodb://localhost:27017/cctv_ai');
  const models = await AIModel.find();
  for (const m of models) {
    if (m.labels.includes('drowsy')) {
      m.alertLabels = ['drowsy'];
      await m.save();
      console.log('Patched drowsy model:', m.name);
    }
  }
  await mongoose.disconnect();
}
patch().catch(console.error);
