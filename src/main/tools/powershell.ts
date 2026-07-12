import { execFile } from 'node:child_process'

export async function runPowerShell<T>(script: string, timeout = 15_000): Promise<T> {
  return new Promise((resolve, reject) => {
    execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', `[Console]::OutputEncoding=New-Object System.Text.UTF8Encoding($false);$OutputEncoding=[Console]::OutputEncoding;$ErrorActionPreference='Stop'; ${script}`], { timeout, windowsHide: true, maxBuffer: 10 * 1024 * 1024, encoding: 'utf8' }, (error, stdout, stderr) => {
      if (error) return reject(new Error(stderr.trim() || error.message))
      try { resolve(JSON.parse(stdout.trim() || 'null') as T) }
      catch { reject(new Error(`PowerShell returned invalid JSON: ${stdout.slice(0, 300)}`)) }
    })
  })
}
