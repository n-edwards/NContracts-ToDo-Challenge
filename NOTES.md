# Notes

## What I'd add with another hour

- **Persistence tests.** The app uses `localStorage`; I'd add a test that adds items, reloads the page, and verifies they survive. This catches bugs that only show up between sessions.
- **Keyboard accessibility.** Verify that every action (add, toggle, edit, delete, filter) is reachable via keyboard alone, which matters for accessibility compliance.
- **Editing.** The current suite doesn't cover editing at all. I'd add a baseline test for double-clicking to edit and confirming a change, then cover the cancel case (Escape should discard and restore the original text) and the empty-edit case (Enter on a blank field should delete the item).
- **Performance guard.** Add 100+ items and assert the UI remains responsive (no layout shift, render under a set threshold). Playwright's `page.metrics()` makes this measurable without external tooling.

## CI/CD integration

The suite already works with `npx playwright test`, so plugging it into a pipeline is minimal:

1. **GitHub Actions example:** add a workflow that runs on PRs, installs dependencies with `npx playwright install --with-deps`, and runs `npx playwright test`. Publish the HTML report as a build artifact.
2. **Parallelism:** The config sets `fullyParallel: true` and limits workers to 1 in CI to stay predictable on shared runners. Tune workers up if the runner has capacity.
3. **Retries:** The config already sets `retries: 2` when the `CI` env variable is present, which handles network or rendering flakiness without masking real failures.
4. **Reporting:** The HTML reporter is configured to generate a report on every run. In CI, upload it as a build artifact so reviewers can inspect failures without reproducing locally.

## Anything surprising or concerning

- **No input feedback or warnings.** Submitting an empty or whitespace-only string is silently ignored with no visible cue to the user. Confirmed edits also have no undo. A production app should give users feedback in both cases, both for usability and accessibility.
- **LocalStorage as the only data layer.** All state lives in `localStorage`, meaning todos are silently lost if the user clears browser data or switches devices.
- **Double-click to edit is undiscoverable.** There's no tooltip, icon, or instruction in the UI that tells a user they can double-click a todo to edit it. On mobile/touch, this interaction may not work at all.
