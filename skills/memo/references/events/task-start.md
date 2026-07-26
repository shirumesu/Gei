# Start A Durable Task Reference

Use this event when accepted work needs a persistent handoff or recovery document.

1. Confirm that session context, repository artifacts, or an existing project tracker are insufficient.
2. Read `../contracts/task-spec.md`.
3. Reuse the repository's naming and location convention; otherwise choose a concise file under `spec/docs/`.
4. Record the goal, accepted decisions, constraints, high-fidelity references, open decisions, and verification needed.

Do not create the file for ordinary implementation, task size alone, or to duplicate a conversation plan.

After creation, verify links and facts against the repository. The reference remains a recovery aid, not an execution state machine.
