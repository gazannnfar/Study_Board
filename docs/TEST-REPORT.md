# Test Report

## Automated Checks

Commands:

```bash
npm run lint
npm test
npm run build
```

Expected result: all commands pass.

## Manual Scenarios

1. Student flow: login as `student@edukanban.local`, view assigned tasks, move task from `To Do` to `In Progress`.
2. Starosta flow: login as `starosta@edukanban.local`, assign task, import CSV schedule, check free slot recommendations.
3. Teacher flow: login as `teacher@edukanban.local`, open task, add comment and grade, review KPI.
4. Admin flow: login as `admin@edukanban.local`, change user role/activity in admin panel.

## Known Limitation

The current AI assistant is deterministic rule-based. It has a replaceable service interface for future external LLM integration.
