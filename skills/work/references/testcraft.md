# Testcraft

## Purpose

Testcraft is the test-design reference for the Work skill. Load it when writing tests before implementation — regardless of whether the flow is light or heavy.

Its job is to ensure every test defends a real contract, not just transcribes the current code. A test that passes when the code is wrong is noise. A test that fails for the wrong reason is a trap.

## Core Rule

**Every test must answer: "Which specific contract breaks when this test fails?"**

If you cannot answer that question for a test, do not write it yet.

## Phase 1: Contract Recovery

Before writing any test, recover the contract of the unit under test. Read function signatures, docstrings, API specs, spec-task acceptance criteria, existing callers, and existing tests. If the contract is unclear, state the assumption and flag it.

Do not start from the implementation. Reading the implementation to write tests produces tests that confirm current behavior, not correct behavior.

- **What does this unit promise?** State its postconditions: given valid input, what output, state change, or side effect is guaranteed?
- **What does it require?** State its preconditions: what assumptions does it make about its inputs or environment?
- **What invariants must always hold?** Identify rules that must be true regardless of inputs (e.g., "balance is never negative", "response always includes a status field").
- **What are the failure contracts?** When given bad input or when a dependency fails, what behavior is guaranteed — error type, fallback, no-op?

## Phase 2: Test Surface Map

Map the full surface before writing a single test. Work through each dimension below and identify the specific cases worth covering. Skip a dimension only when you can state why it does not apply.

### Functional

Core behavior: does the unit do what it promises for valid, representative inputs?

- Cover each distinct output type or state change the contract specifies.
- Cover representative inputs across each equivalence class, not every possible value.
- Do not test internal implementation details. Test observable outcomes.

### Boundary

Inputs at the edge of valid and invalid ranges.

- Numeric: zero, one, min, max, max+1, negative when signed, integer overflow risk.
- String and collection: empty, single element, maximum allowed length, length+1.
- Time: epoch, far future, timezone edges, DST transitions if the unit handles time.
- Type coercion: if the language permits mixed types at the call site, include unexpected types.

### Adversarial and Security

Skip this dimension only if the unit has no external input surface, no authorization logic, and no I/O. State why when skipping.

Inputs that a hostile or careless caller might supply. Cover only the vectors the unit's real data flow exposes.

- **Injection**: SQL, shell, HTML, LDAP, path traversal, template injection — whichever injection surfaces the unit's data flow reaches.
- **Null and missing**: every nullable parameter, optional field, and missing required key in structured input.
- **Encoding attacks**: unicode normalization, null bytes, control characters, homoglyphs in identifiers.
- **Excessive input**: payloads larger than expected, deeply nested structures, wide fan-out.
- **Replay and ordering**: if the unit processes events or tokens, test out-of-order or duplicated inputs.
- **Privilege escalation**: if the unit enforces authorization, test with under-privileged, mis-privileged, and forged identity inputs.

### Error Handling

Does the unit fail correctly when things go wrong?

- Each declared error type: confirm the correct error is raised or returned, not just that some error occurred.
- Dependency failure: if the unit calls external services, databases, or file systems, test behavior when those calls fail or return unexpected shapes.
- Partial failure: if the unit performs multiple operations, test behavior when one succeeds and the next fails.
- Error output: error responses must not leak internal paths, stack traces, secrets, or implementation details to untrusted callers.

### Integration

Does the unit work correctly in context with its real neighbors?

- The contract at each real interface boundary: does the unit hand off the right shape to its downstream consumers?
- Configuration and feature flag combinations: cover the material combinations that change behavior.
- State across calls: if the unit is stateful, test the state machine transitions.

Integration tests should use real collaborators or faithful fakes, not mocks that make the test circular.

### Performance and Load

Apply only when a performance requirement is explicitly stated in the spec, task description, or existing test suite. Skip and state why otherwise.

- Throughput under normal load.
- Degradation under peak load.
- Behavior at or near resource limits: memory, connections, file handles.

## Phase 3: Write Tests

Write one test at a time. For each test:

1. **Name it as a statement about behavior**, not a reference to a function name.
   - Good: `returns_401_when_token_is_expired`
   - Bad: `test_authenticate` or `testAuthenticateFunction`

2. **State the contract being defended** in a comment or docstring when the test name alone is insufficient.

3. **Arrange precisely**: set up only the state this test needs. Shared state between tests is a source of ordering bugs.

4. **Assert specifically**: the assertion must be tight enough to fail when the specific contract breaks, but not so tight that it fails on irrelevant implementation changes.
   - Good: `assert response.status_code == 401 and response.json()["error"] == "token_expired"`
   - Bad: `assert response is not None`
   - Bad: `assert response.status_code != 200`

5. **One behavioral claim per test**: a test that checks five things produces an ambiguous failure. Split compound assertions into separate tests when each represents a distinct contract.

6. **Do not modify production code to make a test pass**: if the test reveals a design problem, fix the design. If the test is wrong, fix the test.

## Phase 4: Red Verification

After writing all tests, run them before writing any production code.

- Every test must fail before the implementation exists.
- A test that passes immediately is either testing something already implemented, testing the wrong contract, or has a broken assertion.
- A test that fails for the wrong reason — wrong exception type, wrong assertion message, error inside the test setup — must be fixed before implementation begins.

The failure message for each test should be self-explanatory: it should name the expected behavior, not just report a traceback.

## Self-Review Before Handoff

Before declaring the test surface complete, answer each question:

1. For each test: what real bug would cause this test to fail? If the answer is "I am not sure," delete or rewrite the test.
2. For each test: mentally remove its core assertion. If the test would still pass, the assertion is not testing the right thing. Rewrite it.
3. Are any assertions weaker than they need to be — `not None`, `> 0`, `isinstance` alone? Tighten them.
4. Are there duplicate tests that cover the same contract from the same angle? Remove the weaker one.
5. Do the test names tell a readable story about what the unit does and does not do?

If the self-review passes, hand the test surface back to the work flow and begin implementation.
