---
name: git-safe-push
description: Check whether a repository is safe to commit or push without pushing anything. Use when the user asks to check git safety, verify the repo before pushing, confirm changes are clean, or generate a commit message from current changes.
---

# Git Safe Push

## Purpose

Use this skill to inspect a repository before the user commits or pushes. The workflow must never push, force push, reset, checkout away changes, amend commits, or mutate git history.

## Workflow

1. State that no push will be performed.
2. Inspect git state:
   - `git status --short`
   - `git diff --stat`
   - `git diff`
   - `git diff --cached`
   - `git log --oneline -5`
   - `git branch --show-current`
   - `git status --branch --short`
3. Identify risky files:
   - Secrets or environment files such as `.env`, `.env.local`, keys, credentials, service accounts, private certs.
   - Generated or bulky artifacts such as `dist`, `.next`, `node_modules`, coverage, logs, screenshots, videos, archives.
   - Accidental local files such as `.DS_Store`.
4. Review the actual diff, not just filenames. Summarize what changed and flag anything suspicious.
5. Run targeted checks that fit the repo:
   - Prefer lint/build/test commands for changed projects.
   - In monorepos, run commands from the relevant package directories.
   - If a check cannot be run, say why.
6. Produce a final safety report with:
   - Verdict: `Safe to push`, `Safe after review`, or `Not safe yet`.
   - What changed.
   - Checks run and results.
   - Risks or files the user should review.
   - A concise git commit message.

## Commit Message Guidance

Draft one message that reflects the overall change set and follows recent repository style from `git log`. Prefer a short imperative subject. Add a body only when it helps explain the why.

## Strict Rules

- Do not run `git push`.
- Do not run destructive commands such as `git reset --hard`, `git checkout --`, `git clean`, or force operations.
- Do not create a commit unless the user explicitly asks for a commit.
- Do not stage files unless the user explicitly asks.
- Do not hide warnings. If there are unrelated existing changes, mention them separately.
