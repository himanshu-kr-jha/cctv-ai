/**
 * Non-Maximum Suppression (NMS)
 * Filters overlapping bounding boxes keeping only the most confident ones.
 *
 * @param {Array} boxes - [{x, y, w, h, label, confidence}]
 * @param {number} iouThreshold - IoU threshold (default 0.45)
 * @returns {Array} filtered boxes
 */
function nms(boxes, iouThreshold = 0.45) {
  if (!boxes.length) return [];

  // Sort by confidence descending
  const sorted = [...boxes].sort((a, b) => b.confidence - a.confidence);
  const kept = [];

  while (sorted.length > 0) {
    const current = sorted.shift();
    kept.push(current);

    // Remove boxes with high IoU overlap
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (iou(current, sorted[i]) > iouThreshold) {
        sorted.splice(i, 1);
      }
    }
  }

  return kept;
}

/**
 * Intersection over Union
 */
function iou(boxA, boxB) {
  const x1 = Math.max(boxA.x, boxB.x);
  const y1 = Math.max(boxA.y, boxB.y);
  const x2 = Math.min(boxA.x + boxA.w, boxB.x + boxB.w);
  const y2 = Math.min(boxA.y + boxA.h, boxB.y + boxB.h);

  const intersectionArea = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const boxAArea = boxA.w * boxA.h;
  const boxBArea = boxB.w * boxB.h;
  const unionArea = boxAArea + boxBArea - intersectionArea;

  return unionArea === 0 ? 0 : intersectionArea / unionArea;
}

module.exports = { nms, iou };
