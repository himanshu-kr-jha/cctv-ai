const ort = require('onnxruntime-node');
const fs = require('fs');
async function test() {
  const models = fs.readdirSync('backend/uploads/models').filter(f => f.endsWith('.onnx'));
  const modelFile = 'backend/uploads/models/' + models.find(m => m.includes('fd1') || m.includes('model') || models.length > 0);
  console.log('Testing', modelFile);
  const session = await ort.InferenceSession.create(modelFile);
  console.log('Inputs:', session.inputNames);
  console.log('Outputs:', session.outputNames);
  // Create a dummy input tensor of 1x3x640x640 with 0.5 values
  const data = new Float32Array(1 * 3 * 640 * 640).fill(0.5);
  const tensor = new ort.Tensor('float32', data, [1, 3, 640, 640]);
  const feeds = {};
  feeds[session.inputNames[0]] = tensor;
  const results = await session.run(feeds);
  const output = results[session.outputNames[0]];
  console.log('Output dims:', output.dims);
  console.log('First bounding box:', output.data.slice(0, 7));
  console.log('Second bounding box:', output.data.slice(7, 14));
}
test().catch(console.error);
