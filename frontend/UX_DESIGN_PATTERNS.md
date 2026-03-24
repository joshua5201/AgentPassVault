# UX Design Patterns

Scope: low-level guidelines

Status: draft

This document captures page patterns and interaction rules for the AgentPassVault frontend.
It applies the high-level principles defined in `UX_DESIGN_GUIDE.md`.

## Requests Page Pattern

The Requests page should behave like an operational inbox with a persistent detail context.

Left inbox columns:

- Status
- Name
- Agent
- Updated time
- Type

Right detail panel order:

- Status summary
- Context
- Requirements
- Metadata
- Linked secret or lease
- Actions

Metadata in the detail panel should default to prettified raw JSON.

DO

- Keep the left pane compact and scan-friendly.
- Use the right panel to explain the currently selected request in a stable order.
- Make the right panel readable enough that users can act without leaving the inbox.

DONT

- Do not overload the inbox with secondary metadata columns.
- Do not rearrange the detail panel order between request types unless the model truly changes.
- Do not hide raw request metadata when it is part of the operator's decision.

## Audit Log Page Pattern

Audit Log should read as a compact timeline rather than as a dashboard or oversized event cards.

DO

- Present events in a dense timeline list with strong timestamp and actor visibility.
- Keep each event compact enough that sequence remains readable across many entries.
- Let the timeline structure explain causality and progression over time.

DONT

- Do not turn audit history into a gallery of large cards.
- Do not consume excessive vertical space per event.
- Do not optimize the audit view for decoration instead of chronology.

## Secrets Page Pattern

Secrets should support fast inspection for expert operators without turning every inspection into a full drill-down.

DO

- Allow quick reveal directly from the list when the operator needs to inspect a value quickly.
- Keep reveal controls visually reversible and operationally clear.
- Let reveal stay visible until the user explicitly changes it or leaves the current page context.

DONT

- Do not force all reveal actions into detail-only flows.
- Do not auto-hide revealed values on a short timer.
- Do not style reveal controls as if they were dangerous or destructive actions.

## Agents Page Pattern

Agents should use the same list-detail interaction grammar as other operational domains.

Agent detail panels should prioritize:

- Agent identity
- Registration and public key state
- Active leases
- Last activity
- Rotate and revoke actions

DO

- Use the detail panel to make agent trust state and operational posture easy to assess.
- Keep identity and key state near the top of the panel.
- Place rotate and revoke actions close to the information that justifies them.

DONT

- Do not bury registration or key state deep in the panel.
- Do not treat agents as a purely static inventory record.
- Do not separate risky agent actions from the context that makes them understandable.

## Settings Page Pattern

Settings remains a secondary utility area, but its information architecture should not be artificially frozen too early.

DO

- Keep Settings clearly secondary to the operational domains.
- Allow the Settings information architecture to grow with real product needs.
- Group settings by operational meaning when those needs become clearer.

DONT

- Do not try to force Settings into a prematurely rigid category model.
- Do not let Settings become the default place to hide unrelated product features.
- Do not give Settings equal visual urgency to the day-to-day operational flows.

## Interaction Patterns

### 1. Metadata presentation

Professional users can handle raw detail, but readability still matters.
Metadata should be shown as explicit structured information, not hidden.

DO

- Show metadata in a readable structured format when it is relevant to the current object.
- Default to prettified raw JSON when metadata fidelity matters to operator judgment.
- Preserve exact structure and field names instead of flattening everything into friendlier summaries.
- Keep metadata visible in the detail context rather than burying it.

DONT

- Do not hide metadata that helps users judge a request or audit event.
- Do not collapse all technical detail into prose summaries.
- Do not make structured data visually chaotic.

### 2. Confirmation pattern

Not every action needs a confirmation step.
Confirmation should be reserved for operations with material risk.

Required confirmation targets:

- Delete
- Revoke
- Reject

DO

- Use confirmation for destructive or hard-to-reverse actions.
- Make the consequence explicit in the confirmation copy.
- Keep lower-risk operational actions direct when context is already visible.

DONT

- Do not add confirmation to every routine action.
- Do not use confirmation as a substitute for clear action labels.
- Do not make safe actions feel slow just to appear cautious.

### 3. Toast pattern

Toasts are appropriate for lightweight feedback, not for required decision-making.

DO

- Use toasts for success feedback, background completion, or non-blocking reminders.
- Keep critical warnings and blocking errors persistent in the page or panel where they matter.
- Make toast copy short and status-oriented.

DONT

- Do not hide necessary actions inside toasts.
- Do not rely on transient messaging for important warnings or failures.
- Do not stack multiple noisy toasts when the page itself should explain the situation.

### 4. Form validation pattern

Validation should happen early enough to guide professional users before submission.
Predictable errors should be surfaced inline as users work.

DO

- Prefer immediate validation for fields with clear constraints.
- Show validation feedback close to the field that needs attention.
- Keep validation copy short, specific, and operational.

DONT

- Do not wait until submit to reveal obvious validation failures.
- Do not make users guess which field caused the problem.
- Do not use delayed validation where immediate guidance would reduce friction.
