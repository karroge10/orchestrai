# Windows release process

1. Run `npm ci` and `npm run check` on a clean Windows machine.
2. Run `npm run pack`, launch `dist/win-unpacked/OrchestrAI.exe`, and execute the release checklist.
3. Configure an Authenticode certificate using electron-builder's `CSC_LINK` and `CSC_KEY_PASSWORD` environment variables.
4. Run `npm run dist` to create the signed per-user NSIS installer.
5. Verify the signature with `Get-AuthenticodeSignature` and scan the installer with the organization's malware-analysis service.
6. Test install, upgrade, uninstall, retained settings, hotkey fallback, model-key storage, screenshot permission, and `Esc` emergency stop on supported Windows versions.

The repository does not contain signing credentials or an update server. `publish` is intentionally disabled; releases must be explicitly signed and uploaded by the project owner.
