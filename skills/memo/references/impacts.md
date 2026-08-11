# Impact Routes

Use this reference when changing one component, interface, process, generated artifact, or Project could silently invalidate another surface.

Add an entry only when a future agent inspecting the changed area alone could plausibly miss the consequence. Preserve the fixed `IMPACTS.md` sections:

- **Change Routes**: when B changes, which A/C surface must also be inspected or updated, why, and what evidence checks it.
- **Cross-Boundary Invariants**: a contract shared across modules, processes, artifacts, or Projects.
- **High-Risk Boundaries**: a boundary with a concrete failure mode and guard.
- **Context Routes**: links to the wider or narrower scope that owns detail.

Prefer exact paths, interfaces, schemas, artifacts, ordering constraints, and checks. Do not record normal imports, general architecture prose, framework summaries, full module maps, or blanket advice such as “run all tests.”

Use Project IMPACTS for consequences inside one working directory. Move the route to Group IMPACTS when more than one member Project is affected; leave a link in the Project only when it helps discovery.
