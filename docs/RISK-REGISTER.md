# Risk Register

| Risk | Probability | Impact | Mitigation |
| --- | --- | --- | --- |
| Schedule data is incomplete | Medium | High | CSV/JSON import validation and seed examples |
| PERT estimates are too optimistic | High | Medium | Store pessimistic values and show confidence |
| Students ignore deadlines | Medium | High | Deadline alerts and planning recommendations |
| Role permissions are too broad | Medium | High | Central RBAC helpers and tests |
| Demo database is empty | Low | High | `npm run db:seed` with realistic data |
| Docker is unavailable | Medium | Medium | README explains PostgreSQL connection and Prisma Studio |
