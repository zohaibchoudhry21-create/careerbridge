export { buildDimensionScores as buildCommunicationViaDimensions } from './dimensionScoresBuilder.js';

/** Thin section accessor for orchestration clarity. */
export const buildCommunicationSection = (dimensions) =>
  dimensions?.communication || { label: 'Communication', score: null, feedback: '', evidence: [] };
