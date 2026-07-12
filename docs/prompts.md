# Planning prompts

The application defaults to deterministic intent routing, so it functions without a model. Model-backed planners receive only tool names, descriptions, risks, and relevant local knowledge snippets—not arbitrary execution access.

The system instruction emphasizes safe read-only diagnostics, deterministic tools over clicking, visible evidence, explicit approval for risky or irreversible actions, and strict structured JSON. Every proposed tool name is validated against the registry. Invalid plans fall back to the deterministic planner.

No screenshot should enter a cloud prompt unless the user has both selected a cloud provider and separately enabled cloud screenshots.
