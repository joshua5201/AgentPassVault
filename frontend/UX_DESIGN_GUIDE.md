# UX Design Guide

Scope: high-level principles

Status: draft

This document captures high-level UX rules for the AgentPassVault frontend.
It focuses on durable design decisions, not page-by-page mockups.
For concrete page patterns and interaction rules, see `UX_DESIGN_PATTERNS.md`.

## Color Fundamental Rules

Color in AgentPassVault must communicate structure and meaning before it communicates style.
The product is a security and approval console, so color should help users read domain, risk, state, and action priority quickly.

### 1. Neutral-first interface

The product should use neutral colors for most surfaces, layout fill, table backgrounds, form backgrounds, and text scaffolding.
Accent colors are for emphasis, orientation, and meaning, not for painting whole screens.

DO

- Use neutral surfaces as the default base for app background, cards, tables, forms, and shells.
- Let accent colors appear as focused signals on top of a stable neutral canvas.
- Keep large reading areas calm and low-noise.

DONT

- Do not use accent colors as the default fill color for large surfaces.
- Do not recolor entire pages to match a domain.
- Do not make the product feel like a marketing site by flooding the UI with brand color.

### 2. Dual-intensity accent system

Each accent hue should have two primary intensities:

- Deep accent: high saturation, low lightness. Target range: around `90% S / 20-30% L`.
- Soft accent: medium saturation, high lightness. Target range: around `45% S / 80-88% L`.

Deep accents carry emphasis.
Soft accents create subtle grouping and lightweight emphasis.

DO

- Use deep accents for active navigation, selected states, primary emphasis, key chips, and compact high-attention UI.
- Use soft accents for subtle card tints, selected rows, section highlights, badge backgrounds, and low-pressure grouping.
- Tune each hue by perception, not only by formula. Equal HSL values across hues do not feel equally bright.

DONT

- Do not apply the same raw saturation and lightness numbers to every hue without visual correction.
- Do not use soft accents as the default page background.
- Do not use deep accents on large surfaces where readability and calmness matter more than energy.

### 3. Domain colors are structural, not semantic status colors

AgentPassVault uses accent colors to help users recognize product domains.
These colors express domain identity and orientation, not success, warning, or danger.

Recommended domain mapping:

- Requests: `H32` family, copper / orange
- Secrets: `H168-172` family, jade / teal-green
- Agents: `H200` family, azure / blue

This mapping is intentionally asymmetric:

- Requests should feel attention-worthy and in motion.
- Secrets should feel secure, contained, and controlled.
- Agents should feel technical, system-oriented, and machine-facing.

DO

- Use domain colors in stable structural places such as nav indicators, page eyebrows, section markers, icon chips, selected tabs, and subtle supporting surfaces.
- Keep the domain mapping consistent across the product.
- Use iconography, labels, and placement alongside color so domain meaning is never color-only.

DONT

- Do not let domain color take over the whole page.
- Do not change the dominant hue of the whole interface when users move between pages.
- Do not depend on domain color alone to explain where the user is.

### 4. Semantic colors stay separate from domain colors

Semantic status colors must remain independent from domain accents.
This is required to avoid collisions between "what area am I in?" and "what state is this in?"

Required semantic separation:

- Danger / destructive / security risk: red family
- Warning / caution / pending attention: yellow or amber family
- Success / fulfilled / healthy: green family
- Informational feedback: blue or neutral-info family

Guardrails:

- The Requests domain may use orange as its domain accent, but request status still uses semantic status colors.
- The Secrets domain may use jade or teal-green as its domain accent, but fulfilled or success states still use semantic success tokens.
- The Agents domain may use blue as its domain accent, but informational banners and links still use semantic info rules.

DO

- Keep domain color and status color as separate token groups.
- Reserve semantic colors for feedback, risk, and state.
- Make destructive actions visually distinct from domain accents.

DONT

- Do not use domain colors as substitutes for warning, success, or danger.
- Do not use semantic colors decoratively.
- Do not let an accent hue silently inherit a second meaning because it "looks close enough."

### 5. Meaning by placement and area

Color meaning is influenced by where it appears and how much area it occupies.
The same hue can signal orientation, state, or urgency depending on location and scale.

DO

- Use small, repeatable placements for domain color so users learn the pattern.
- Use compact high-contrast placements for actionable emphasis.
- Use larger soft-tint areas only for grouping, not for urgency.

DONT

- Do not use a warning-like hue across wide surfaces unless the whole container is actually a warning.
- Do not make every highlighted object colorful, or the product will lose hierarchy.
- Do not place destructive red next to a primary CTA in a way that causes accidental clicks or mixed meaning.

### 6. Dark mode keeps hue identity but uses different tokens

Dark mode should preserve the same domain hue mapping, but it must not reuse light mode token values directly.
Hue identity stays stable; token values change.

DO

- Keep the same domain-to-hue mapping in light and dark themes.
- Create dedicated dark theme aliases for accent foreground, accent border, accent surface, and accent strong states.
- Increase accent foreground brightness in dark mode so the hue remains legible.
- Keep dark mode tinted surfaces subtle and controlled.

DONT

- Do not paste light mode HSL values directly into dark mode.
- Do not brighten dark mode accents so much that they become neon noise.
- Do not change hue per theme in a way that breaks recognition across modes.

### 7. Accessibility is part of color meaning

Color can reinforce meaning, but it must never carry meaning by itself.

DO

- Pair status color with text, icon, label, shape, or placement.
- Check contrast for text, icons, borders, focus treatment, and tinted backgrounds in both light and dark mode.
- Make active, selected, focused, disabled, warning, and destructive states distinguishable without requiring perfect color perception.

DONT

- Do not rely on color alone to show status, validation, or location.
- Do not make focus visible only through a hue shift.
- Do not assume that subtle tint differences are readable in dense tables or low-quality displays.

### 8. Token architecture

Implementation should separate raw palette values from semantic and domain aliases.

Suggested token layers:

- Neutral tokens
- Domain accent tokens
- Semantic status tokens
- Interaction state tokens

Suggested accent aliases per domain:

- `accent.<domain>.strong`
- `accent.<domain>.soft`
- `accent.<domain>.border`
- `accent.<domain>.text`

Suggested semantic aliases:

- `semantic.danger.*`
- `semantic.warning.*`
- `semantic.success.*`
- `semantic.info.*`

DO

- Alias tokens by meaning and usage, not by raw hex value.
- Keep light and dark theme aliases separate.
- Make it possible to adjust a hue family without rewriting component rules.

DONT

- Do not hardcode raw color values directly in component code.
- Do not mix domain and semantic aliases in the same token family.
- Do not name tokens after vague feelings such as `prettyBlue` or `softGreen`.

## Information Architecture

The application should be organized around daily operational work, not summary reporting.
The primary job of the interface is to help admins notice, inspect, and resolve requests safely.

### 1. Requests inbox is the default home

After authentication, the product should open into the Requests experience.
This is the primary operational surface of the product.

DO

- Treat Requests as the default post-login landing page.
- Design the first screen as an actionable inbox, not as an overview dashboard.
- Prioritize scanning, filtering, and opening work over passive summary metrics.

DONT

- Do not make the home screen primarily about KPIs or vanity metrics.
- Do not force users through an overview layer before they can reach pending work.
- Do not bury the most urgent actions under a dashboard that only summarizes status.

### 2. Primary navigation should reflect primary domains

Top-level navigation should represent stable, frequently used product domains.

Recommended first-level navigation:

- Requests
- Secrets
- Agents
- Audit Log
- Settings

DO

- Keep Requests, Secrets, Agents, and Audit Log as first-level destinations.
- Keep Settings as utility navigation, not as the center of the product.
- Make the navigation reflect real operational objects, not implementation detail.

DONT

- Do not hide Agents or Audit Log behind settings-style menus.
- Do not mix daily operational domains with account utilities in the same visual weight.
- Do not let secondary admin options compete with core request handling flows.

### 3. Requests should use an inbox-detail model

The main Requests view should use a two-pane operational layout:

- Left: inbox list for scanning and triage
- Right: detail panel for current selection and next actions

This should feel closer to an inbox than a dashboard.

DO

- Use the left pane for filtering, sorting, scanning, and selecting requests.
- Use the right pane for request context, requirements, linked objects, and safe next actions.
- Keep users in the inbox flow while inspecting details.

DONT

- Do not make every inspection require a full page transition.
- Do not overload the list with full request detail that belongs in the detail panel.
- Do not turn the detail panel into a second independent page structure.

### 4. Default request scope is pending work

The default request filter should show only pending requests.
The product should foreground unresolved work by default.

DO

- Open the Requests inbox in a pending-only state by default.
- Let fulfilled and historical items be accessible through explicit filters.
- Make the default view feel like a work queue.

DONT

- Do not default to "all requests" if it dilutes urgent work.
- Do not mix completed and pending items equally in the initial view.
- Do not require users to apply a filter manually just to see the work that matters now.

### 5. Product-wide density target is 6/10

The interface should feel slightly dense, efficient, and scannable.
This is not a maximal-density terminal UI, but it is also not a spacious marketing layout.

DO

- Keep density consistent across Requests, Secrets, Agents, and Audit Log.
- Favor structured lists, tables, compact filters, and clear metadata blocks.
- Use enough whitespace to preserve scanability and grouping without wasting vertical space.

DONT

- Do not make Requests notably denser than the rest of the product.
- Do not switch between ultra-compact and oversized card layouts from page to page.
- Do not confuse density with clutter.

### 6. Search is domain-local by default

Search should stay close to the object model users are currently working with.
The product does not need a global search-first interaction model.

DO

- Provide search inside Requests, Secrets, Agents, and Audit Log as separate domain tools.
- Let each domain search reflect that domain's vocabulary and filters.
- Keep search scoped enough that results remain predictable.

DONT

- Do not force a global search paradigm onto an operational console that is already domain-driven.
- Do not merge unrelated object types into one ambiguous result set by default.
- Do not make users interpret mixed-type search results just to complete routine work.

## Layout And Position Meaning

Position should carry stable meaning across the product.
Users should be able to infer what an area is for before reading every label.

### 1. Left side means browsing and triage

The left side of the Requests experience is for scanning, filtering, and choosing work.

DO

- Place inbox rows, filters, request counts, and sorting controls in the left pane.
- Keep left-pane interactions lightweight and selection-oriented.
- Make row selection clearly update the right-side detail context.

DONT

- Do not place destructive or high-consequence actions in the inbox pane.
- Do not turn the left pane into a form-heavy workspace.
- Do not overload each row with too many inline controls.

### 2. Right side means context and decision

The right detail panel is where the currently selected object becomes understandable and actionable.

DO

- Use the right panel for request context, metadata, required fields, linked secret, lease state, and next-step actions.
- Let the right panel host the actions that require understanding before execution.
- Keep the panel readable without losing the feeling of staying inside the inbox flow.

DONT

- Do not make the right panel visually compete with the inbox list.
- Do not hide critical request context behind secondary accordions by default.
- Do not use the right panel as a dumping ground for unrelated admin tools.

### 3. Top-level layout should preserve operational rhythm

The product should maintain a clear flow:

- Navigate domain
- Scan list
- Inspect detail
- Act safely

DO

- Keep the layout stable across adjacent operational pages.
- Reuse list-detail structures where it helps users stay oriented.
- Let spacing and section ordering guide the user from overview to detail to action.

DONT

- Do not rearrange core layout grammar on every page.
- Do not make users relearn where primary content and next-step actions live.
- Do not break scan patterns with decorative layout changes.

### 4. Other core domains should reuse list-detail patterns where appropriate

The Requests inbox is the primary model, but other daily operational domains should preserve similar interaction grammar when it improves learnability.

DO

- Use list-detail layouts for Agents where inspection and action happen together.
- Let Audit Log read as a timeline-oriented operational history, not just a raw table dump.
- Reuse predictable panel behavior across domains so users can transfer habits.

DONT

- Do not make Agents a completely different management paradigm unless the task truly requires it.
- Do not flatten Audit Log into an unreadable wall of events.
- Do not introduce a new page interaction model for every domain without a strong reason.

## Action Priority And Safety

Actions should reflect the amount of understanding required before they are safe to take.
The inbox is for opening work. Execution belongs in the detail context.

### 1. List views should expose only low-risk actions

Request rows should expose `Open`-type actions only.
Fulfill, lease, reject, or other consequential actions belong in the detail area.

DO

- Keep row-level actions limited to selecting or opening an item.
- Place fulfillment and lease actions inside the detail panel where full context is visible.
- Require users to see the relevant context before they can complete a consequential action.

DONT

- Do not place fulfill or lease buttons directly in the inbox rows.
- Do not encourage drive-by decisions from the list alone.
- Do not mix navigation and execution in a way that increases accidental action risk.

### 2. Detail context should be the action boundary

The detail panel should be the minimum context required before taking an important action.

DO

- Use the detail panel as the place where action buttons appear and where consequences are explained.
- Keep important actions adjacent to the request data that justifies them.
- Make the user feel they are acting on a fully understood item, not a label in a list.

DONT

- Do not separate the main action from the information needed to judge it.
- Do not make users jump between multiple places to understand a single request.
- Do not hide action consequences behind vague labels.

## Content And Tone

Content should support professional users who can learn quickly, but who often operate with substantial background information and real consequences.
The tone should be calm, precise, and operational.

### 1. Voice should be calm and technical

The interface should sound like a reliable operational tool.
It should not sound playful, emotional, or overly conversational.

DO

- Use calm, direct, professional language.
- Prefer technical precision over friendliness theater.
- Assume users can understand real system concepts with light guidance.

DONT

- Do not use marketing tone in operational flows.
- Do not add artificial warmth where clarity matters more.
- Do not explain advanced concepts as if the audience were novice consumers.

### 2. Keep technical terms when they match the domain

Domain terms should remain visible when they are the correct concepts.
The UI should teach them through context, not replace them with vague wording.

Examples of acceptable product terms:

- Lease
- Fulfill
- Request
- Agent
- Secret
- Revoke
- Audit Log
- Mapped Secret

DO

- Keep technical terms that match backend and product behavior.
- Use surrounding labels and panel structure to make terminology understandable.
- Prefer consistent terminology over "simpler" synonyms that lose meaning.

DONT

- Do not rename important domain concepts into generic consumer language.
- Do not use multiple labels for the same underlying object.
- Do not hide precise meaning behind soft wording.

### 3. System state should be explained in one sentence

When the interface needs to explain a status, it should do so quickly.
One sentence is usually enough to tell the user what is happening right now.

DO

- Use one-sentence summaries to explain current state.
- Make the sentence answer "what is happening now?"
- Keep the explanation adjacent to the object or action it refers to.

DONT

- Do not force users to read long paragraphs to understand current state.
- Do not separate a state label from its explanation when both are needed.
- Do not repeat the same explanation in multiple places on the same screen.

### 4. Error and warning copy should follow a stable structure

Operational feedback should be easy to scan.
Errors and warnings should use a predictable structure:

- What happened
- What the impact is
- What the next step is

DO

- Make warning and error messages structurally consistent.
- Write titles and first lines so they still make sense when scanned quickly.
- Keep remediation steps concrete.

DONT

- Do not bury the action the user needs to take.
- Do not write vague failure messages with no operational next step.
- Do not add incidental detail before the core status is clear.

### 5. Warnings and errors should differ in tone

Warnings signal caution or pending risk.
Errors signal a failure, block, or invalid state.

DO

- Use warning copy for caution, dependency, or attention-needed states.
- Use error copy for blocked actions, failed operations, or invalid data.
- Make the tone difference visible both in wording and presentation.

DONT

- Do not phrase warnings as if failure has already occurred.
- Do not soften real blocking failures into vague advisory language.
- Do not make every problem sound equally severe.
