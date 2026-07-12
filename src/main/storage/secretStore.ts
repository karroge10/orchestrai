import { safeStorage } from 'electron'
import Store from 'electron-store'
import type { CredentialStatus } from '../../shared/types'

type Provider = 'openai' | 'anthropic'
type SecretShape = { encrypted: Partial<Record<Provider, string>> }

export class SecretStore {
  private store = new Store<SecretShape>({ name: 'credentials', defaults: { encrypted: {} } })

  available(): boolean { return safeStorage.isEncryptionAvailable() }

  save(provider: Provider, value: string): void {
    if (!this.available()) throw new Error('Windows secure credential storage is unavailable on this system.')
    const trimmed = value.trim()
    if (trimmed.length < 10) throw new Error('The API key does not look valid.')
    this.store.set(`encrypted.${provider}`, safeStorage.encryptString(trimmed).toString('base64'))
  }

  get(provider: Provider): string | undefined {
    const env = provider === 'openai' ? process.env.OPENAI_API_KEY : process.env.ANTHROPIC_API_KEY
    if (env) return env
    const encoded = this.store.get(`encrypted.${provider}`)
    if (!encoded || !this.available()) return undefined
    try { return safeStorage.decryptString(Buffer.from(encoded, 'base64')) } catch { return undefined }
  }

  delete(provider: Provider): void { this.store.delete(`encrypted.${provider}`) }
  status(): CredentialStatus { return { openai: Boolean(this.get('openai')), anthropic: Boolean(this.get('anthropic')), secureStorageAvailable: this.available() } }
}
