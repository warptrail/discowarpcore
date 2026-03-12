# AGENTS.md

Disco Warp Core is a React + Vite frontend with an Express + MongoDB backend.

## Primary Goal

Refactor the React frontend into smaller, clearer, more maintainable components.

Priorities:

- smaller components
- separation of concerns
- readable code for human developers
- industry-standard React component organization
- preserve existing behavior unless a change is explicitly requested

## Rules

- Do not rewrite working features just because the code looks messy.
- Prefer extraction and reorganization over full rewrites.
- Keep changes incremental and easy to review.
- Do not change backend contracts unless explicitly asked.

## Frontend Constraints

- JavaScript only
- No TypeScript
- No Tailwind
- Use styled-components only
- Keep React component structure developer-friendly and easy to navigate

## Toast Definition

In this project, a “Toast” is not a standard temporary popup.

It is a header-mounted interactive system message shown through `ToastContext` and rendered in the Header.

A toast may:

- contain actions
- remain visible until dismissed
- be used for confirmations, warnings, undo, and status messages

Do not convert this system into standard auto-dismiss toasts.

## Refactor Focus

Main target:

- `BoxActionPanel`

Also refactor any other oversized frontend components that mix too many concerns.

## Working Style

Before large edits:

1. identify the component(s) being refactored
2. explain the extraction plan briefly
3. make changes in small, behavior-preserving steps
