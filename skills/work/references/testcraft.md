# Testcraft

## Purpose

Testcraft is the test-design reference for the Work skill. Load it only after Work decides that a section needs new tests.

Its job is to make each test defend a real contract instead of transcribing the current implementation. A test that still passes when the behavior is wrong is noise; a test that fails for the wrong reason is a trap.

## Core Rules

Every test must answer: **which specific contract breaks when this test fails?** If you cannot answer that, do not write the test yet.

Tests cover meaningful behavior risk, not proof that work happened. Do not add a new test when the only useful assertion is that a file, folder, function, import, string, or implementation detail exists. Use existing command-line verification instead, and state why no new test is warranted.

## When To Add A Test

Add a test when the change affects a behavior contract that a future edit could break:

- user-visible behavior, CLI output, API responses, or UI state transitions
- configuration and feature flag behavior, including enable and disable paths
- persistence, serialization, migration, or cache behavior
- parsing, validation, permissions, security, or error handling
- integration across real neighbors such as IPC, network clients, storage adapters, or plugin boundaries
- bug fixes where the broken behavior can be exercised through a stable surface

Do not add a test by default for pure documentation, comments, formatting, generated outputs, empty scaffolding, mechanical moves already covered by build/typecheck, or deleting dead files when existing checks prove the files are unused.

When a behavior deserves coverage but a good automated test is not practical in the current repository, say so explicitly and use the strongest command-line substitute available. Do not fill the gap with a weak existence test.

## Phase 1: Recover The Contract

Before writing a test, recover the contract under test from the most stable sources available: task acceptance criteria, API specs, existing tests, callers, public signatures, docstrings, and relevant implementation files.

Do not derive expected behavior solely from the current implementation. Use implementation files to understand interfaces and data flow, not to bless whatever the code currently does.

State the contract in practical terms:

- **Postconditions:** given valid input, what output, state change, or side effect is guaranteed?
- **Preconditions:** what assumptions does the unit make about inputs or environment?
- **Invariants:** what must always remain true regardless of input?
- **Failure contracts:** for bad input or dependency failure, what error, fallback, or no-op behavior is guaranteed?

If the contract is unclear after this recovery, state the assumption and flag it before writing the test.

## Phase 2: Map The Relevant Surface

Map the surface proportional to the changed contract and blast radius. Cover the dimensions that can realistically break; skip a dimension when you can state why it does not apply.

When the contract names distinct accepted or rejected input categories, cover a representative case for each category that can fail independently. Do this instead of testing only the reported example or expanding into a full matrix.

### Functional

- Cover each distinct output type or state change the contract specifies.
- Use representative inputs across equivalence classes, not every possible value.
- Test observable outcomes, not internal implementation details.
- Prefer the full behavior chain over the nearest function. For configuration, prove the setting can be enabled and disabled, persists or loads through the real config path, and changes the consuming behavior.

### Boundary

Cover edges of valid and invalid ranges when the unit accepts such input:

- Numeric: zero, one, min, max, max+1, negative when signed, overflow risk.
- String and collection: empty, single item, maximum allowed length, length+1.
- Time: epoch, far future, timezone edges, DST transitions when time is part of the contract.
- Type coercion: unexpected types when the language or call site permits them.

### Adversarial And Security

Apply when the unit has external input, authorization logic, or I/O. Cover only vectors the real data flow exposes:

- injection surfaces such as SQL, shell, HTML, LDAP, path traversal, or template injection
- null, missing, malformed, or oversized structured input
- encoding hazards such as unicode normalization, null bytes, or control characters
- replay, duplication, or out-of-order events when processing events or tokens
- under-privileged, mis-privileged, or forged identities when enforcing authorization

For example, if a path contract rejects both parent-directory traversal and absolute paths, cover one representative of each because they can bypass different checks.

### Error Handling

- Confirm each declared error type or error response, not just that some error occurred.
- Test dependency failures for external services, databases, file systems, or unexpected response shapes.
- Test partial failure when the unit performs multiple operations.
- Ensure untrusted error output does not expose internal paths, stack traces, secrets, or implementation details.

### Integration

- Verify the contract at real interface boundaries and downstream handoff shapes.
- Cover material configuration or feature-flag combinations that change behavior.
- For stateful units, test the state transitions across calls.
- Use real collaborators or faithful fakes; avoid mocks that merely repeat the implementation's assumptions.

### Performance And Load

Apply only when a performance requirement is explicit in the task, spec, or existing tests. Otherwise skip it and say why.

## Phase 3: Write Tests

Write one test at a time:

1. Name it as a behavior statement, such as `returns_401_when_token_is_expired`, not just `test_authenticate`.
2. State the defended contract in a comment or docstring when the name is not enough.
3. Arrange only the state this test needs; shared state creates ordering bugs.
4. Assert specifically enough to fail when the contract breaks, but not on irrelevant implementation changes.
5. Keep one contract per test. Multiple assertions are fine when they jointly prove the same contract; split tests when assertions defend separate contracts.
6. Do not add test-only hooks or distort production design to satisfy an implementation-shaped test. If a valid failing test exposes a product issue, fix production behavior; if the test is wrong, fix the test.

## Phase 4: Red Verification

When a test can be written before implementation, run it first.

- A regression or feature test should fail before the bug is fixed or the behavior exists.
- A test that passes immediately is probably testing existing behavior, the wrong contract, or a broken assertion.
- A test that fails for the wrong reason, such as setup failure or the wrong error type, must be corrected before implementation.
- The failure should make the expected behavior clear, not merely dump a traceback.

If the best test surface only exists after part of the implementation is present, state that constraint before implementation, then run the test as soon as the behavior is reachable.

## Self-Review Before Handoff

Before returning to the Work flow, check:

1. For each test, what real bug would make it fail? If unclear, delete or rewrite it.
2. If the core assertion were removed, would the test still pass? If yes, rewrite it.
3. Are any assertions weak, such as `not None`, `> 0`, or `isinstance` alone? Tighten them.
4. Are duplicate tests covering the same contract from the same angle? Remove the weaker one.
5. Do the test names describe the behavior story clearly?
