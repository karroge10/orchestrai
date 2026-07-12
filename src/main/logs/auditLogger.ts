import { randomUUID } from 'node:crypto'
import type { AuditLog } from '../../shared/types'

export function audit(message: string, detail?: string, level: AuditLog['level'] = 'info'): AuditLog {
  return { id: randomUUID(), timestamp: new Date().toISOString(), message, detail, level }
}
