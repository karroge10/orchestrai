# Architecture

OrchestrAI separates display, planning, policy, and execution into explicit trust boundaries.

1. The React renderer is sandboxed, has no Node integration, and receives only purpose-specific methods from the context-isolated preload.
2. Every IPC handler verifies the sender URL. Navigation, new windows, and browser permission requests are denied.
3. The Electron main process owns model calls, encrypted credentials, persistence, planning, policy, and operating-system access.
4. Registered tools expose one bounded capability with a risk level and approval requirement.

The model router supports deterministic, OpenAI Responses, Anthropic Messages, Ollama, and OpenAI-compatible local endpoints. Model plans use a strict schema, contain at most 12 steps, and are rejected if any tool name is absent from the registry. A failed or invalid model plan falls back to deterministic planning and records that fact in the task audit log.

The orchestrator executes safe steps sequentially and turns risky steps into proposed actions. Approval is enforced again by the main-process registry, so renderer state cannot bypass it. Agent Control Mode is an additional requirement for all mouse and keyboard actions. Task snapshots persist in a bounded `electron-store` database and recover after restart.

Windows diagnostics prefer CIM and Event Viewer queries over visual automation. Input uses a narrow Win32 adapter. Screenshot files are served only from the app's screenshot directory through a restricted custom protocol.

Capability routing is provider-independent and records `system_tool`, `file_tool`, `structured_browser`, `desktop_accessibility`, `visual_computer_use`, `ask_user`, or `unsupported`. Visual control remains a fallback. The synthetic harness supplies structured browser and desktop fixture providers with observation revisions; every mutation must match the latest revision, implementing one bounded observe/propose/validate/approve/execute/observe/verify step.

Setting `ORCHESTRAI_E2E_ROOT` to a unique directory under `%TEMP%\orchestrai-e2e` activates visible E2E mode. The main-process registry rejects mutable paths outside that root and process termination outside `ORCHESTRAI_E2E_PIDS`, regardless of renderer or model output.
