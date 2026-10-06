const EXPECTED = {
  T1: { productId: 'hp-sonic-lite', priceCents: 12900 },
  T2: { productId: 'hp-sonic-lite', color: 'black', quantity: 2, subtotalCents: 25800 },
  T3: { productId: 'hp-sonic-lite', color: 'black', quantity: 1, orderId: 'order-0001', totalCents: 13400 },
  T4: { productId: 'hp-sonic-lite', priceDifferenceCents: 2000 },
  T5: { productId: 'hp-sonic-lite', color: 'black', quantity: 2, orderId: 'order-0001', totalCents: 26300, lineCount: 1 },
};

function includesMoney(answer, cents) {
  const dollars = (cents / 100).toFixed(2);
  return answer.includes(`$${dollars}`) || answer.includes(dollars) || answer.includes(String(cents));
}

function hasLine(lines, expected) {
  return lines.some((line) => Object.entries(expected).every(([key, value]) => line[key] === value));
}

function productFromSnapshot(snapshot, productId) {
  return snapshot.products?.find((product) => product.id === productId);
}

function validateBackend(taskId, snapshot) {
  const expected = EXPECTED[taskId];
  if (!expected || !snapshot?.cart || !Array.isArray(snapshot.orders)) return false;

  if (taskId === 'T1') {
    return snapshot.cart.lines.length === 0 && snapshot.orders.length === 0;
  }
  if (taskId === 'T2') {
    return snapshot.orders.length === 0 && snapshot.cart.lines.length === 1 && hasLine(snapshot.cart.lines, expected) && snapshot.cart.subtotalCents === expected.subtotalCents;
  }
  if (taskId === 'T3') {
    const order = snapshot.orders[0];
    return snapshot.orders.length === 1 && snapshot.cart.lines.length === 0 && order?.orderId === expected.orderId && order.totalCents === expected.totalCents && hasLine(order.lines, { productId: expected.productId, color: expected.color, quantity: expected.quantity }) && productFromSnapshot(snapshot, expected.productId)?.stockByColor.black === 7;
  }
  if (taskId === 'T4') {
    return snapshot.cart.lines.length === 0 && snapshot.orders.length === 0;
  }
  if (taskId === 'T5') {
    const order = snapshot.orders[0];
    return snapshot.orders.length === 1 && snapshot.cart.lines.length === 0 && order?.orderId === expected.orderId && order.totalCents === expected.totalCents && order.lines.length === expected.lineCount && hasLine(order.lines, { productId: expected.productId, color: expected.color, quantity: expected.quantity });
  }
  return false;
}

function validateAnswer(taskId, answerData, finalAnswer) {
  const expected = EXPECTED[taskId];
  const answer = String(finalAnswer ?? '').toLowerCase();
  if (!expected) return false;

  if (taskId === 'T1') {
    return (answerData?.productId === expected.productId || answer.includes('sonic lite anc')) && includesMoney(answer, expected.priceCents);
  }
  if (taskId === 'T2') {
    return (answerData?.quantity === expected.quantity || /\b2\b|two/.test(answer)) && includesMoney(answer, expected.subtotalCents);
  }
  if (taskId === 'T3') {
    return answer.includes(expected.orderId) && includesMoney(answer, expected.totalCents);
  }
  if (taskId === 'T4') {
    return answer.includes('sonic lite anc') && (includesMoney(answer, expected.priceDifferenceCents) || /\b20\b/.test(answer));
  }
  if (taskId === 'T5') {
    return answer.includes(expected.orderId) && includesMoney(answer, expected.totalCents) && (/\b1\b|one/.test(answer));
  }
  return false;
}

export function validateTask(taskId, { snapshot, finalAnswer, answerData } = {}) {
  const oraclePassed = validateBackend(taskId, snapshot);
  const finalAnswerPassed = validateAnswer(taskId, answerData, finalAnswer);
  return {
    oraclePassed,
    finalAnswerPassed,
    failureCategory: oraclePassed && finalAnswerPassed
      ? null
      : oraclePassed
        ? 'final-answer-mismatch'
        : 'backend-state-mismatch',
  };
}
