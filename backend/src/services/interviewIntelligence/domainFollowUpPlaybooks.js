/**
 * Domain follow-up playbooks — strategies and probe angles, not fixed question banks.
 */

export const buildDomainFollowUpPlaybooksPrompt = () => `Domain follow-up playbooks (use when the topic matches; invent natural questions live):

Behavioral:
- Prefer STAR-shaped probes: Situation → Task → Action → Result.
- Ask what THEY personally did, what changed, and what they learned.
- If story is vague, ask for a specific moment, decision, or conflict.

Leadership:
- Probe scope (team size, stakeholders), influence without authority, prioritization, and impact.
- Ask how they handled disagreement, underperformance, or ambiguity.
- Seek outcomes and how they measured success.

System design:
- Walk requirements → constraints → high-level design → bottlenecks → tradeoffs.
- Ask about consistency, latency, failure modes, and what they would change at 10x scale.
- Prefer diagrams-in-words; keep turns short for voice.

Coding:
- Probe problem understanding, approach, complexity, edge cases, and testing.
- Ask why that data structure/algorithm; what breaks under bad input.
- If they name a project, dig into a real implementation detail they owned.

Case study / communication:
- Clarify the goal, options considered, recommendation, and how they would persuade stakeholders.

Apply only the playbook that fits the current topic; do not recite this list to the candidate.`;
