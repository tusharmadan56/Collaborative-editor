/**
 * Operational Transformation (OT) Helpers
 *
 * Three operation types:
 *   - insert: { type: 'insert', position: number, text: string }
 *   - delete: { type: 'delete', position: number, length: number }
 *   - retain: { type: 'retain', length: number }
 *
 * The core function `transform(op1, op2)` resolves conflicts when two
 * operations are applied concurrently to the same document version.
 *
 * Convention: op1 has priority (server-side operation) when positions collide.
 */

/**
 * Apply a single operation to a document string.
 * @param {string} doc - The current document content
 * @param {Object} op - An operation object
 * @returns {string} The document after applying the operation
 */
function apply(doc, op) {
  switch (op.type) {
    case 'insert':
      return doc.slice(0, op.position) + op.text + doc.slice(op.position);

    case 'delete': {
      const end = Math.min(op.position + op.length, doc.length);
      return doc.slice(0, op.position) + doc.slice(end);
    }

    case 'retain':
      // Retain is a no-op on the document — it only matters for composition
      return doc;

    default:
      throw new Error(`Unknown operation type: ${op.type}`);
  }
}

/**
 * Apply an array of operations to a document sequentially.
 * @param {string} doc - The current document content
 * @param {Object[]} ops - Array of operation objects
 * @returns {string} The document after applying all operations
 */
function applyAll(doc, ops) {
  return ops.reduce((current, op) => apply(current, op), doc);
}

/**
 * Transform op2 against op1 so that op2 can be applied after op1.
 *
 * Both op1 and op2 were intended to be applied to the same document state.
 * After applying op1, we need to adjust op2 so it still makes sense.
 *
 * @param {Object} op1 - The operation that was applied first (server priority)
 * @param {Object} op2 - The operation to transform
 * @returns {Object} The transformed version of op2
 */
function transform(op1, op2) {
  // If either is a retain, no transformation needed
  if (op1.type === 'retain' || op2.type === 'retain') {
    return { ...op2 };
  }

  // ── INSERT vs INSERT ─────────────────────────────────────
  if (op1.type === 'insert' && op2.type === 'insert') {
    // If op2's insert is after op1's, shift it right by op1's text length
    if (op2.position > op1.position) {
      return { ...op2, position: op2.position + op1.text.length };
    }
    // If at the same position, op1 has priority — shift op2 right
    if (op2.position === op1.position) {
      return { ...op2, position: op2.position + op1.text.length };
    }
    // op2 is before op1, no change needed
    return { ...op2 };
  }

  // ── INSERT vs DELETE ─────────────────────────────────────
  if (op1.type === 'insert' && op2.type === 'delete') {
    // op2 (delete) starts after op1's insert point — shift right
    if (op2.position >= op1.position) {
      return { ...op2, position: op2.position + op1.text.length };
    }
    // op2's delete range overlaps with op1's insert point
    if (op2.position + op2.length > op1.position) {
      // Split: delete what's before the insert, skip the inserted text, delete the rest
      return { ...op2, length: op2.length + op1.text.length };
    }
    // op2 is entirely before op1, no change
    return { ...op2 };
  }

  // ── DELETE vs INSERT ─────────────────────────────────────
  if (op1.type === 'delete' && op2.type === 'insert') {
    // op2's insert is after the deleted region — shift left
    if (op2.position >= op1.position + op1.length) {
      return { ...op2, position: op2.position - op1.length };
    }
    // op2's insert is within the deleted region — place at delete start
    if (op2.position >= op1.position) {
      return { ...op2, position: op1.position };
    }
    // op2 is before the delete, no change
    return { ...op2 };
  }

  // ── DELETE vs DELETE ─────────────────────────────────────
  if (op1.type === 'delete' && op2.type === 'delete') {
    const op1End = op1.position + op1.length;
    const op2End = op2.position + op2.length;

    // op2 is entirely after op1 — shift left
    if (op2.position >= op1End) {
      return { ...op2, position: op2.position - op1.length };
    }

    // op2 is entirely before op1 — no change
    if (op2End <= op1.position) {
      return { ...op2 };
    }

    // Overlapping deletes — compute what's left to delete after op1
    if (op2.position >= op1.position && op2End <= op1End) {
      // op2 is fully contained within op1 — nothing left to delete
      return { type: 'retain', length: 0 };
    }

    if (op2.position < op1.position && op2End > op1End) {
      // op2 fully contains op1 — reduce length by op1's length
      return { ...op2, length: op2.length - op1.length };
    }

    if (op2.position < op1.position) {
      // op2 starts before op1 but overlaps — truncate to before op1
      return { ...op2, length: op1.position - op2.position };
    }

    // op2 starts inside op1 but extends beyond — shift and truncate
    return {
      ...op2,
      position: op1.position,
      length: op2End - op1End,
    };
  }

  // Fallback — return unmodified
  return { ...op2 };
}

/**
 * Transform an array of operations against another array.
 * Useful when a client sends multiple ops that need to be rebased.
 *
 * @param {Object[]} clientOps - Operations from the client
 * @param {Object[]} serverOps - Operations already applied on the server
 * @returns {Object[]} Transformed client operations
 */
function transformAll(clientOps, serverOps) {
  let transformed = [...clientOps];

  for (const serverOp of serverOps) {
    transformed = transformed.map((clientOp) => transform(serverOp, clientOp));
  }

  return transformed;
}

module.exports = { apply, applyAll, transform, transformAll };
