---
type: llm
weight: 2
focus: { source: file, path: src/state.js }
---
PASS if cloneState returns a deep copy in which nested plain objects and arrays are new objects, and Date and Map values come back as Date and Map instances (structuredClone does all of this; a hand-written recursive copy must handle plain objects, arrays, Date and Map).
FAIL if it is still shallow, loses Date or Map types (for example JSON.parse(JSON.stringify(...))), or is missing.
