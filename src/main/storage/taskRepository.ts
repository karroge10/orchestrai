import Store from 'electron-store'
import type { Task } from '../../shared/types'

type TaskShape = { tasks: Task[] }

export class TaskRepository {
  private store = new Store<TaskShape>({ name: 'tasks', defaults: { tasks: [] } })
  constructor(private limit: () => number) {}

  list(): Task[] { return this.store.get('tasks', []).map((task) => ({ ...task, updatedAt: task.updatedAt ?? task.createdAt, provider: task.provider ?? 'mock' })).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) }
  save(task: Task): void {
    const tasks = [structuredClone(task), ...this.list().filter((item) => item.id !== task.id)].slice(0, Math.max(10, this.limit()))
    this.store.set('tasks', tasks)
  }
  get(id: string): Task | undefined { return this.list().find((task) => task.id === id) }
  delete(id: string): void { this.store.set('tasks', this.list().filter((task) => task.id !== id)) }
  clear(): void { this.store.set('tasks', []) }
}
