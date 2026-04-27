---
description: "Use when a plan is approved and ready to execute: set up feature branch before plan execution, create branch from main before starting work, plan execution git workflow, commit and push changes after plan completion, open a pull request after plan execution, stage and commit plan execution results."
---

# Plan Execution Git Workflow

This workflow covers the full lifecycle from plan approval through an open pull request. The branch setup happens **before** execution begins so that all plan work occurs on a clean, up-to-date feature branch.

## Step 1 — Branch Setup (before execution)

1. Sync remote tracking refs without touching the working tree:

   ```sh
   git fetch origin
   ```

2. List all local and remote branch names to check for collisions:

   ```sh
   git branch -a
   ```

3. Derive a semantic, lowercase kebab-case branch name from the plan title (e.g. `add-db-query-script`). If that name already exists as either a local or remote branch, append `-2` (or the next available suffix that is unique against both). Note the actual branch name in the post-PR summary if a suffix was appended.

4. Create and switch to the new branch, rooted on the latest remote `main`:

   ```sh
   git checkout -b <branch-name> origin/main
   ```

   The working tree is now clean and fully up to date. Verify no commits exist on this branch yet before proceeding:

   ```sh
   git log --oneline origin/main..HEAD
   ```

   This should produce no output. If any commits appear, stop and report to the user — the branch was not created cleanly from `origin/main`.

   Proceed with plan execution.

## Step 2 — Execute the Plan

Execute every step of the approved plan on this branch. Do not commit during execution — changes accumulate until the initial commit in Step 3.

If execution fails or is blocked at any point, stop immediately. Do not proceed to Step 3 or beyond. Report the failure to the user, including:
- which step failed and why
- the current state of the working tree (`git status`)
- the branch name

Do not delete or abandon the branch — leave it in place so the user can inspect it, continue work from it, or reuse it as a base.

## Step 3 — Initial Commit

1. Review what will be staged:

   ```sh
   git status
   ```

   Confirm every listed file is related to the plan. If unexpected files appear (e.g. `output/query-result.json`, debug outputs, unrelated in-progress files), stage selectively:

   ```sh
   git add <file1> <file2> ...
   ```

   Otherwise stage all:

   ```sh
   git add -A
   ```

2. Commit and push. The `<topic>` is a shortened form of the plan title, derived the same way as the branch name:

   ```sh
   git commit -m "Initial Execution of <topic> plan"
   git push -u origin <branch-name>
   ```

## Step 4 — Agent Self-Review

The self-review is an analytical code review performed independently of the constraints that shaped execution. The goal is to read the changed code as a reviewer who was not involved in writing it — without the forward teleology of "does it fulfill the plan" dominating the lens. Concerns that execution is unlikely to surface are precisely what the review is for.

1. Read every file changed during plan execution. To get the exact list and full diff:

   ```sh
   git diff --name-only origin/main
   git diff origin/main
   ```

2. Review each changed file against the following criteria. Each is a distinct lens — apply all of them:

   - **Alignment** — Does the implementation match the intent of the plan and the broader feature? Has anything drifted, been over-engineered, or added scope not in the plan?
   - **Impact on existing code** — Do changes to shared modules, types, utilities, or interfaces affect callsites beyond what was planned? Are existing behaviors preserved?
   - **Stability** — Are there unhandled edge cases, fragile error paths, implicit assumptions about ordering or state, or race conditions?
   - **Security** — Are there injection vulnerabilities, unvalidated inputs, exposed secrets, or other OWASP concerns introduced?
   - **Accuracy** — Is the logic correct? Are there off-by-one errors, wrong data transformations, incorrect assumptions about data shape, or silent failures?
   - **Efficiency** — Are there obvious performance concerns (unnecessary iterations, unbounded queries, redundant work) that could be avoided without significant added complexity?
   - **Clarity** — Is the code readable and consistent with codebase conventions? Would a future reader understand it without asking questions?

   For each criterion, record concrete observations — what was examined, what was found, and any concern or confirmation. Do not summarize with "looks fine"; name what was checked.

3. Run the Verification Standards suite defined in `.github/copilot-instructions.md` as a mechanical complement to the review. That file is the source of truth for required steps; follow it exactly. Report whether each step passed or describe what was found.

4. If any changes result from the review:

   ```sh
   git status
   ```

   Confirm files, stage plan-related changes, then:

   ```sh
   git add <files>
   git commit -m "Agent Self-Review"
   git push
   ```

## Step 5 — Open Pull Request

1. Write the PR body to `/tmp/pr-body.md`. If `/tmp/pr-body.md` is absent (e.g. after a reboot or session restart), regenerate it before running `gh pr create`.

   The Plan section of the body is sourced from `/memories/session/plan.md`. If that file is absent (e.g. context window exhaustion or session restart), reconstruct the Plan section from the current conversation history.

   The body must follow the format described in the **PR Body Format** section below.

2. Open the pull request:

   ```sh
   gh pr create \
     --title "<plan title>" \
     --body-file /tmp/pr-body.md \
     --assignee seanmhanson \
     --reviewer copilot
   ```

   If the command fails due to the `--reviewer` flag, retry without it:

   ```sh
   gh pr create \
     --title "<plan title>" \
     --body-file /tmp/pr-body.md \
     --assignee seanmhanson
   ```

   Note the failed reviewer assignment in the post-PR summary so the review can be requested manually.

3. After the PR opens, send a brief summary to the user that includes:
   - The PR URL
   - The branch name (especially if a suffix was appended)
   - Any notable findings from the self-review

---

## PR Body Format

The body uses GitHub-flavored Markdown with HTML used sparingly (`<details>`, `<summary>`, `<strong>`, `<br/>`). The format avoids H3–H6 headings everywhere — including inside `<details>` blocks — to prevent GitHub's heading margin/padding from breaking the visual layout.

### Structure

The body has exactly three H1 sections in this order:

```
# Plan: <Title>
# Execution
# Agent Self-Review
```

### Formatting Rules

- **H1** (`#`) for the three top-level section headers only.
- **H2** (`##`) for `Summary`, `Steps`, and `Specifications` inside the Plan section only.
- **No H3–H6 anywhere** — use `<strong>` inside `<summary>` instead.
- Inside `<summary>`: always `<strong>Label text</strong>`, never a heading.
- After `</summary>`: add `<br/>` on the same line (for visual spacing), then a blank line, then the first content line. The blank line is what causes subsequent Markdown to be parsed as Markdown — without it, content immediately after a block-level HTML closing tag is treated as literal text.
- Inside `<details>`: bullet lists, code blocks, inline code, `**bold**` — no headings.
- `</details>` on its own line, preceded and followed by a blank line.
- Self-review `<details>` summary labels: append `✅` for passing categories; describe the finding plainly for anything else.

### Section 1 — Plan

Source: `/memories/session/plan.md` (the final approved plan before execution began). Feedback and iteration history are excluded.

```markdown
# Plan: <Title>

## Summary

<one or two sentence overview>

## Steps

<details>
<summary><strong>Phase 1 — Description</strong></summary><br/>

- bullet
- bullet
</details>

<details>
<summary><strong>Phase N — Description</strong></summary><br/>

- bullet
</details>

## Specifications

<details>
<summary><strong>Relevant files</strong></summary><br/>

- `path/to/file` — description
</details>

<details>
<summary><strong>Verification</strong></summary><br/>

- `yarn build:noEmit` — no TypeScript errors
</details>

<details>
<summary><strong>Decisions</strong></summary><br/>

- Decision rationale
</details>
```

### Section 2 — Execution

Written by the executing agent after the plan is complete.

```markdown
# Execution

## Summary

- `file.ts` — one-line description of what was done
- `package.json` — one-line description

<details>
<summary><strong>Verified</strong></summary><br/>

- `yarn build:noEmit` — clean
- `yarn lint` — only the pre-existing warning
- Happy path — description
- Edge case — description
</details>

<details>
<summary><strong>Usage Note</strong></summary><br/>

Any notes relevant for using the feature.
</details>
```

### Section 3 — Agent Self-Review

Written by the executing agent after the self-review step.

```markdown
# Agent Self-Review

## Summary

One or two sentences on the overall finding (e.g. "Implementation matches the plan. No corrections needed." or describe what was corrected).

<details>
<summary><strong>Alignment ✅</strong></summary><br/>

- bullet observation
- bullet observation
</details>

<details>
<summary><strong>Impact on existing code ✅</strong></summary><br/>

- bullet observation
</details>

<details>
<summary><strong>Stability ✅</strong></summary><br/>

- bullet observation
</details>

<details>
<summary><strong>Security ✅</strong></summary><br/>

- bullet observation
</details>

<details>
<summary><strong>Accuracy ✅</strong></summary><br/>

- bullet observation
</details>

<details>
<summary><strong>Efficiency ✅</strong></summary><br/>

- bullet observation
</details>

<details>
<summary><strong>Clarity ✅</strong></summary><br/>

- bullet observation
</details>

<details>
<summary><strong>Verification</strong></summary><br/>

- `yarn test` — N suites, N tests, all passed
- `yarn build:noEmit` — clean
- `yarn lint` — clean
</details>
```
