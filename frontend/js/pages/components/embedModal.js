// shim: forward compatibility for older paths that may request components/embedModal.js
// Re-export the real embedModal implementation located in attendance/embedModal
export { createEmbedModal } from '../attendance/embedModal/embedModal.js';
