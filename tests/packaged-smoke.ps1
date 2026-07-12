$ErrorActionPreference = 'Stop'
$exe = Join-Path $PSScriptRoot '..\dist\win-unpacked\OrchestrAI.exe'
if (!(Test-Path -LiteralPath $exe)) { throw "Packaged executable not found: $exe" }
$env:ORCHESTRAI_SMOKE_EXIT_MS = '4000'
$process = Start-Process -FilePath $exe -PassThru -WindowStyle Hidden
if (!$process.WaitForExit(20000)) { $process.Kill(); throw 'Packaged application did not complete its bounded smoke run.' }
if ($process.ExitCode -ne 0) { throw "Packaged application exited with code $($process.ExitCode)." }
Write-Output 'PACKAGED_SMOKE_PASS'
