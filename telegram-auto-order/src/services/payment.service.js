const { updateOrder } = require('./order.service');
function markProofSubmitted(orderId, photoFileId) { return updateOrder(orderId, { status: 'awaiting_owner_confirmation', paymentProofFileId: photoFileId, proofSubmittedAt: new Date().toISOString() }); }
function approvePayment(orderId) { return updateOrder(orderId, { status: 'payment_approved', paymentApprovedAt: new Date().toISOString() }); }
function rejectPayment(orderId, reason) { return updateOrder(orderId, { status: 'payment_rejected', rejectionReason: reason, paymentRejectedAt: new Date().toISOString() }); }
module.exports = { markProofSubmitted, approvePayment, rejectPayment };
