---
max_turns: 30
timeout_seconds: 420
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit]
---

Add `fetchInvoices(customerId)` to src/billing.js. It gets `/customers/<customerId>/invoices` from our backend API and returns the parsed list.
