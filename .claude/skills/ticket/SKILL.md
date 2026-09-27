---
name: ticket
description: Pick up a GitHub issue from the Zeilshipper project board, implement it, verify it locally against a prod snapshot, open a linked PR and move the card. Use when asked to work on a ticket, issue or card ("/ticket 42", "do ticket 42", "pick up the next ready ticket").
---

# Ticket → verified PR

Argument: an issue number, or `next` (top item in the board's **Ready** column).
You finish with an open PR and the card in **In review**. You never merge, deploy, or
change production — merging is the maintainer's release button.

## Board constants (users/jan-ra/projects/5)

```
OWNER=jan-ra  PROJECT=5  PROJECT_ID=PVT_kwHOA-ld0c4Bk3pw  REPO=jan-ra/stichting-zeilshipper
STATUS_FIELD=PVTSSF_lAHOA-ld0c4Bk3pwzhjmm-k
  Backlog=f75ad846  Ready=61e4505c  In progress=47fc9ee4  In review=df73e18b  Done=98236657
```

Move a card:
```sh
ITEM=$(gh project item-list 5 --owner jan-ra --format json --limit 200 \
  | jq -r --argjson n "$N" '.items[] | select(.content.number==$n) | .id')
[ -n "$ITEM" ] || ITEM=$(gh project item-add 5 --owner jan-ra --url "https://github.com/jan-ra/stichting-zeilshipper/issues/$N" --format json | jq -r .id)
gh project item-edit --project-id PVT_kwHOA-ld0c4Bk3pw --id "$ITEM" \
  --field-id PVTSSF_lAHOA-ld0c4Bk3pwzhjmm-k --single-select-option-id <option-id>
```
`next`: `gh project item-list 5 --owner jan-ra --format json --limit 200 | jq '.items[] | select(.status=="Ready")'`, take the first; if none, say so and stop.

## Steps

1. **Read the ticket fully** — `gh issue view $N --comments`. Restate in 2-3 lines what
   done looks like. If a decision only the maintainer can make is missing (content
   wording, which of two behaviours, anything touching prod data), ask in chat and stop
   before writing code. Don't guess on those; do decide ordinary engineering choices.

2. **Start clean.** `git status` must be clean (stash nothing silently — ask). Then
   `git fetch && git switch -c issue-$N-<short-slug> origin/main`.
   If `cms/data/snapshots/LATEST` is older than a day: `npm run pull -- --snapshot-only`.
   Move the card to **In progress**.

3. **Reproduce first (bugs).** Find the failing behaviour on the local stack
   (`npm run dev`, or `npm run verify` and read the screenshots). Where the bug is in
   pure logic, add a failing unit test (`cms/tests`, `site/tests`, `node --test`); where
   it is a page, extend `e2e/smoke.spec.mjs` only if the check is generic enough to keep.

4. **Implement.** Follow CLAUDE.md: schema changes via `npm run migrate:create` (read the
   SQL, additive only); content that must change with the release via a guarded data
   migration. Match the surrounding code style. No emojis.

5. **Verify.** `npm run verify` must pass. Also `npm run rehearse` if you touched
   `cms/src/migrations`, `cms/payload.config.ts`, `cms/Dockerfile` or
   `cms/docker-entrypoint.sh`. Open the screenshots of every page the change affects
   and actually look at them (both languages if strings changed). Fix and re-run until
   green — never open a PR on a red report, and never weaken a check to get green.
   If the change needs a destructive migration or deletes content, stop and explain to
   the maintainer before proceeding.

6. **Commit and PR.**
   ```sh
   git add -A && git commit -m "<imperative summary> (#$N)"
   git push -u origin HEAD
   gh pr create --base main --title "<summary>" --body-file <file>
   ```
   PR body:
   - `Closes #$N`
   - What changed and why (short), anything the reviewer should look at
   - **Data impact**: none / schema (additive, list columns) / content (what the data
     migration does, guarded on what) — from `.verify/db-changes.txt`
   - **Verification**: paste `.verify/report.md`, plus `.verify/rehearsal-report.md` if run
   - **Rollback**: "code-only rollback safe" if migrations are additive; otherwise say what
     a rollback would need
   Add label `destructive-migration` only if the maintainer agreed to it.

7. **Close the loop.** Move the card to **In review**, comment on the issue with the PR
   link and one line of what to check. Report back in chat: PR URL, verify result, and
   anything you were unsure about.

## After merge (only if asked)

`gh run watch` the Release run; on failure read the log (`gh run view --log-failed`),
report, and propose the fix or a rollback — do not trigger Rollback without being told.
