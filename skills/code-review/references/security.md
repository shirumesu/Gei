# Security Evidence

Use for an explicit security audit or a concrete changed trust boundary. Calibrate to the actual deployment and reachable actors; ordinary local tools do not automatically have hostile remote callers.

For a candidate, trace:

- who controls the input or identity;
- how it reaches a protected operation or sensitive output;
- which authorization, validation, or isolation control fails;
- what access or damage becomes possible;
- what existing guard or deployment fact could defeat the claim.

For an explicit broad audit, begin with real assets and entry points, then follow relevant controls: access to other users' data, credential handling, untrusted input reaching execution/rendering, and privileged state changes. Choose further areas from the actual system; do not enumerate weakness classes as findings.

Use code tracing and bounded non-mutating checks. Scanner hits, dangerous function names, old dependency versions, or absent headers are leads, not proof. Avoid exposing real secrets in commands or reports.

Describe a surviving finding with its preconditions, broken boundary, impact, and supporting location. State missing runtime evidence and counterevidence when material. Reserve high severity for a credible path to substantial harm; optional hardening is not a demonstrated vulnerability. Fit findings into the normal review output rather than appending a mandatory security report.
