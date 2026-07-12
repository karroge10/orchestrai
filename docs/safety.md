# Safety and threat model

The main threats are malicious or malformed model output, renderer compromise, accidental broad file changes, secret exposure, and runaway computer input.

## Enforced controls

- Model plans are schema-validated, step-bounded, registry-allowlisted, and never execute code supplied by the model.
- Every write, deletion, process stop, and computer-input tool requires explicit approval in the main process.
- File deletion uses the Windows Recycle Bin rather than permanent removal.
- Existing ZIP files and move destinations are not overwritten without an explicit approved argument.
- UI input additionally requires visible Agent Control Mode. `Esc` disables it globally, and the banner's emergency stop also cancels the active task.
- Typing is rejected when the focused accessibility element reports a password field, when focus safety cannot be determined, or when text appears to contain a credential or secret.
- PowerShell runs non-interactively, without elevation, with output limits and timeouts.
- The renderer is sandboxed with context isolation, a restrictive CSP, denied navigation/window creation, and sender-validated IPC.
- API keys are encrypted with Electron `safeStorage`; the renderer receives only boolean credential status.
- Screenshots require separate permission, remain in app data, and are not included in model prompts in version 1.0.
- E2E mode is opt-in through a validated disposable root, visibly labeled in Settings, and enforced in the main tool registry. Mutable filesystem paths and process IDs outside the harness allowlist are rejected before execution.
- Structured GUI actions carry an observation revision. A moved window or changed page invalidates old proposals, preventing stale coordinate/state reuse and repeated blind actions.

## Deliberately unsupported

The registry contains no tool for registry edits, startup disabling, uninstalling software, changing security controls, elevation, purchasing, messaging, uploading data, or submitting forms. Agent Control Mode does not grant any capability that is absent from the registry.

## Residual risks

Windows accessibility metadata is not perfect, Game Bar recording may be unavailable by system policy, and approved input may target a window that changes between review and execution. Users should keep sensitive applications closed, approve one action at a time, and use `Esc` immediately if focus changes unexpectedly.
