# OrchestrAI

A Windows-first, local-first desktop companion that combines model planning with deterministic system tools, screenshots, approval-gated computer input, and a persistent audit trail.

Press `Ctrl+Space`, describe a computer task, and OrchestrAI chooses the safest available workflow. It prefers Windows APIs and PowerShell diagnostics, uses screenshots only with permission, and never runs a risky action until the user approves it.

## Production feature set

- Sandboxed Electron 43 + React 19 + TypeScript desktop application
- Persistent task history, live progress, findings, approvals, cancellation, and audit logs
- CPU, memory, disk, process, startup, and recent Event Viewer diagnostics
- Bounded file search and large-file discovery
- Approval-gated ZIP creation, file moves, Recycle Bin deletion, and process termination
- Permission-controlled screenshots served through a restricted custom protocol
- Approval-gated click, typing, hotkey, scrolling, and Windows Game Bar recording
- Password-field detection, secret-text refusal, visible Agent Control Mode, and global `Esc` emergency stop
- Local-first Ollama planning by default, plus deterministic fallback and optional OpenAI/Anthropic adapters
- Strict schema validation and registry allowlisting for every model-generated plan
- API keys encrypted with Electron `safeStorage` and never returned to the renderer
- Configurable global hotkey and model IDs
- NSIS installer configuration, Windows CI, production dependency audit, and unpacked-app smoke testing

The application does not require administrator privileges. It intentionally does not implement registry modification, startup disabling, application uninstall, antivirus/firewall changes, credential entry, purchases, messages, uploads, or form submission.

## Run and build

Requirements: Windows 10/11, Node.js 24+, npm, and Windows PowerShell 5.1+.

```powershell
npm ci
npm run dev
```

Verification and installer creation:

```powershell
npm run check
npm run build
npm run pack
npm run dist
```

`npm run dist` writes an NSIS installer under `dist/`. Public distribution should be Authenticode-signed by setting the standard electron-builder `CSC_LINK` and `CSC_KEY_PASSWORD` secrets in the release environment.

## Models

The default provider is local Ollama at `http://localhost:11434/api/chat` using `qwen3.5:9b`. If local inference is unavailable or produces an invalid plan, OrchestrAI records the failure and falls back to its offline deterministic planner. Settings can also enable:

- OpenAI Responses API with strict structured output
- Anthropic Messages API with validated JSON planning
- Ollama at `/api/chat`
- OpenAI-compatible local chat-completions endpoints

Local integration testing makes a real request to the configured local model and makes no cloud API calls:

```powershell
npm run test:local
```

Override the endpoint or model with `LOCAL_MODEL_URL` and `LOCAL_MODEL_NAME`.

Safe synthetic E2E and packaged smoke commands:

```powershell
npm run test:e2e
npm run test:local
npm run pack
npm run smoke:packaged
npm run dist
```

The E2E harness creates a unique disposable root under `%TEMP%\orchestrai-e2e`, records fixture hashes and action traces in `reports/evaluation-latest.json`, and removes the fixture only after the report is written. It also exercises a real WPF test window through Windows UI Automation and a live loopback-only fixture website. To launch the app itself in visibly labeled E2E mode, set `ORCHESTRAI_E2E_ROOT` to a harness-created root under that base; the main process rejects mutable paths outside it.

Cloud keys are encrypted through Windows secure storage. Model output never receives arbitrary execution access: plans are parsed, bounded to 12 steps, checked against the local registry, and routed through the same approval policy as deterministic plans. Screenshots are not included in cloud requests in version 1.0, even when cloud screenshot permission is enabled.

## Example tasks

- `Why is my PC slow?`
- `Find "budget.xlsx"`
- `Clean Downloads`
- `Compress "C:\Users\me\Documents\Demo"`
- `Take a screenshot`
- `Record a demo video`

Quoted paths are recommended. A model provider can plan additional combinations of the registered tools, while writes and UI actions always pause for approval.

See [architecture](docs/architecture.md), [safety and threat model](docs/safety.md), [prompt design](docs/prompts.md), and [release process](docs/release.md).

## License

MIT
