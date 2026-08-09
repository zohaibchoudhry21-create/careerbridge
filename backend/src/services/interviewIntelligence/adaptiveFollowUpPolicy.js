/**
 * Adaptive follow-up policy for the live interviewer (prompt text only — no hardcoded Qs).
 */

import { ADAPTIVE_DEPTH_ENABLED } from '../../config/interviewIntelligenceConfig.js';

const BASE_POLICY = `Adaptive difficulty (critical):
After each candidate answer, silently classify performance as one of: weak | solid | strong | excellent.
Then choose the NEXT move (still one spoken question at a time):

- Weak answer → Easy follow-up: simplify, scaffold, ask for a concrete example or clarification. Do not pile on jargon. Help them recover without coaching the "right" answer.
- Solid answer → Standard follow-up: deepen slightly (ownership, constraints, or a related scenario).
- Strong answer → Hard follow-up: push on tradeoffs, edge cases, failure modes, or metrics.
- Excellent answer → Deep technical discussion: explore architecture choices, alternatives considered, scale, or leadership judgment — still conversational and concise for voice.

Never announce the classification out loud. Never ask multiple stacked questions in one turn.
Match overall interview baseline difficulty, but adapt locally based on the last answer.`;

const DEPTH_HINT_LADDER = `Depth-hint ladder (enabled for this session):
The question guide lists depthHint values (warmup | standard | deep). Do not regenerate the guide.
- After two consecutive strong, detailed on-topic answers, if the NEXT guide item is depthHint "standard", treat it as "deep" for that item only.
- After two consecutive weak / off-topic / empty answers, step the NEXT item one level easier (deep→standard, standard→warmup).
- If unsure, leave depthHint unchanged. Never announce these adjustments.`;

export const buildAdaptiveFollowUpPolicyPrompt = () =>
  ADAPTIVE_DEPTH_ENABLED ? `${BASE_POLICY}\n\n${DEPTH_HINT_LADDER}` : BASE_POLICY;
