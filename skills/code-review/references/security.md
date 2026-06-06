# Security Review Reference

Read this reference for explicit security reviews or when a general code review touches a security-sensitive surface.

Security review is candidate-driven: discover plausible issues, validate them against code evidence, then calibrate attack path and severity. Do not report generic weakness classes without a realistic source, broken control or sink, and impact.

## Scope First

Establish the security context before listing vulnerabilities:

- review type: diff, PR, commit, working tree, targeted files, or baseline module review
- language, framework, runtime, and deployment shape when discoverable
- assets: secrets, credentials, PII, tenant data, money movement, admin controls, signing keys, model weights, customer content, or privileged state
- exposure: internet-facing, internal, local-only, CLI, plugin boundary, CI, package consumer, or operator-only
- actors and trust boundaries: anonymous user, authenticated user, tenant member, admin, service account, plugin, dependency, file parser, webhook sender, CI job, or local process
- existing controls: authentication, authorization, validation, encoding, sandboxing, allowlists, rate limits, audit logs, encryption, and dependency policy

For diff-based reviews, stay anchored to the changed code and directly supporting files. Use unchanged sibling code as context or negative control unless the diff changes a shared guard, sink, helper, route pattern, template pattern, dependency, or configuration that affects those siblings.

## Candidate Discovery

For each plausible candidate, preserve the proof tuple:

- attacker-controlled source
- transformation or state transition
- closest validation, authorization, or trust-boundary control
- sink or broken control
- affected location with file and line
- impact if exploited
- counterevidence already visible
- CWE or OWASP class when known

Look for these high-value families first:

- authentication and session flaws: missing auth, weak token handling, insecure session lifecycle, credential leakage
- authorization and tenancy flaws: IDOR, horizontal or vertical privilege escalation, missing server-side enforcement, direct object access without ownership checks
- injection: SQL, NoSQL, LDAP, XPath, command, template, header, log, path traversal, XSS, and unsafe DOM or output rendering
- parser, file, and archive handling: unsafe path joins, symlink or hardlink extraction, unbounded recursion, unsafe XML, untrusted deserialization, decompression bombs
- outbound request surfaces: SSRF, webhooks, importers, previews, redirect-following clients, callback URLs, metadata-service reachability
- cryptography and secrets: hardcoded secrets, custom crypto, weak algorithms, key reuse, missing certificate or signature validation, secrets in logs or URLs
- sensitive data exposure: verbose errors, stack traces, overbroad API responses, PII in logs, debug config, missing redaction
- business logic: workflow bypass, race conditions, TOCTOU, quota bypass, replay, missing state validation, non-atomic updates
- CSRF and state-changing requests: missing tokens or same-site protections on meaningful state changes
- configuration and supply chain: insecure defaults, debug endpoints, permissive CORS, unsafe dependency or CI changes, untrusted package sources

Do not collapse independent source/sink pairs into one vague finding. If several changed endpoints or helpers independently expose the same issue, keep each affected location addressable, then group the final prose if useful.

## Validation

A plausible security candidate is not yet a finding. Validate with the strongest proportionate method available:

- run or inspect existing tests that exercise the affected path
- add no files during review mode; if a proof-of-concept would require edits, describe the minimal validation step instead
- use bounded local commands, existing app entry points, CLI calls, or test harnesses when available
- otherwise perform static tracing from source to control to sink and document the exact proof gap

Validation must answer:

- Can a realistic attacker control the source?
- Does the input reach the sink or broken control?
- Which guard is absent, bypassed, mis-scoped, fail-open, or applied too late?
- What preconditions are required?
- What counterevidence could defeat the claim?
- Is the impact security-relevant rather than merely a correctness bug?

Do not treat scanner output, grep hits, dangerous function names, missing headers, old packages, or theoretical best-practice gaps as reportable by themselves. They are leads until reachability and impact are shown.

## Attack Path And Severity

For surviving candidates, write the attacker story before assigning severity:

1. Entry point: how the attacker reaches the affected code.
2. Capability: what identity, privilege, tenant, local access, file control, or network position they need.
3. Boundary crossing: which trust or authorization boundary is crossed.
4. Control failure: what check is missing, incomplete, inconsistent, or bypassed.
5. Impact: what the attacker can read, write, execute, impersonate, persist, tamper with, or deny.
6. Counterevidence: strongest repository evidence that the path is internal-only, admin-only, unreachable, already validated, or low impact.

High and critical findings need a clear, professional-grade exploit story. Keep severity lower when the issue is theoretical, internal-only, admin-only without privilege delta, dependent on unusual operator mistakes, or missing proof of meaningful security impact.

Security severity calibration:

- `critical`: credible RCE, account takeover, auth bypass, cross-tenant compromise, broad sensitive data exposure, signing or identity compromise, severe supply-chain compromise, or persistent arbitrary file write with realistic exploitation.
- `high`: reachable authz bypass, meaningful IDOR, practical injection with impact, SSRF with credible internal/cloud/service impact, exploitable deserialization, serious CSRF, dangerous file handling, or cryptographic failure enabling forgery or data exposure.
- `medium`: real security bug with narrower reach, meaningful defense-in-depth failure with plausible chain value, limited data exposure, weak control that needs additional conditions, or hard-to-exploit race/business-logic issue.
- `low`: security hygiene issue with limited demonstrated impact, low-sensitivity disclosure, constrained misconfiguration, or finding that is valid but unlikely to be exploitable in normal deployment.
- `informational`: useful security note, not a vulnerability.

Do not keep a finding high or critical when the argument depends on "could maybe matter if chained" without showing the chain.

## Reporting Additions

For security findings, include these fields inside the normal Code Review finding:

```text
attack path: source -> control gap -> sink -> impact
preconditions: ...
counterevidence: ...
taxonomy: CWE/OWASP when known
```

If no security issue survives validation, say so and name the security surfaces reviewed. Also state any proof gap, such as missing runtime configuration, unavailable deployment context, or unreviewed supporting service.
