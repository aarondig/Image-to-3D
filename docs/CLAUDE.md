# Claude Code Instructions

## Project Context
You are building a single-photo to 3D mesh web application with dual rendering modes:
1. Instant point cloud (MiDaS depth estimation)
2. Full 3D mesh (Tripo API background generation)

Tech stack: React + TypeScript + Vite + Three.js + Vercel

## Your Role
- Execute tasks from `tasks.md` sequentially
- Make a commit after completing each task using the provided commit message
- Test code locally before committing
- Ask clarifying questions if task requirements are unclear
- Update `tasks.md` by checking off completed subtasks

## Current Constraints
- Tripo API: 300 credits/month, 1 concurrent task (free tier)
- Image processing: Max 2MB, resize to 768px
- Point cloud: Cap at 200k points for performance
- No localStorage/sessionStorage (Claude artifacts limitation doesn't apply here, but keep state in React)

## File Organization
src/
components/     # React components
hooks/          # Custom React hooks
utils/          # Helper functions
types/          # TypeScript interfaces
App.tsx         # Main app component
api/              # Vercel serverless functions
docs/             # Documentation
public/           # Static assets

## Coding Standards
- Use TypeScript strict mode
- Prefer functional components with hooks
- Use async/await over promises
- Include error handling for all API calls
- Add JSDoc comments for non-obvious functions
- Keep components under 200 lines (extract subcomponents if needed)

## Testing Before Commit
Before each commit, verify:
1. No TypeScript errors (`npm run build`)
2. Code runs in dev mode (`npm run dev`)
3. All imports resolve correctly
4. No console errors in browser

## When Stuck
If you encounter ambiguity or blockers:
1. State the specific problem
2. Propose 2-3 solutions with tradeoffs
3. Ask for direction before proceeding

## Current Phase
Phase 1: Core Upload & Backend Integration (see tasks.md)

## Next Task
Check `tasks.md` for the first unchecked subtask and begin there.