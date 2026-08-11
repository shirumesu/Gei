# Initialize GeiSpec

Use this reference only when a Project scaffold is new, incomplete, or still carries `<!-- gei:uninitialized -->`.

SessionStart Hooks own deterministic initialization. They derive a Project id from the normalized exact working-directory path and copy missing files from `templates/project/` into the external GeiSpec store. They never overwrite existing content. Shared Context uses `templates/context/`; a Group is created intentionally from `templates/group/` when the user asks to relate Projects.

For an uninitialized Project Overview:

1. Inspect the current directory and existing authoritative evidence.
2. If purpose, responsibilities, and boundaries are clear, update the fixed sections and remove `gei:uninitialized` autonomously.
3. If the directory is empty or remains genuinely ambiguous, ask the user only when the missing context blocks the current task.
4. Do not invent content merely to complete the template.
5. Preserve the fixed headings; add a small project-specific section only when it materially improves recovery.

Missing files may be restored from templates. Existing unusual Markdown is still readable context: do not validate, normalize, or replace it just because it differs from the template.
