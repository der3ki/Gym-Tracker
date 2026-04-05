export interface StoragePort<T> {
  getAll(): T[] | Promise<T[]>
  getById(id: string): T | undefined | Promise<T | undefined>
  save(item: T): void | Promise<void>
  remove(id: string): void | Promise<void>
}

export class LocalStorageAdapter<T extends { id: string }> implements StoragePort<T> {
  constructor(private readonly key: string) {}

  getAll(): T[] {
    const raw = localStorage.getItem(this.key)
    if (!raw) return []
    return JSON.parse(raw) as T[]
  }

  getById(id: string): T | undefined {
    return this.getAll().find((item) => item.id === id)
  }

  save(item: T): void {
    const items = this.getAll()
    const index = items.findIndex((i) => i.id === item.id)
    if (index >= 0) {
      items[index] = item
    } else {
      items.push(item)
    }
    localStorage.setItem(this.key, JSON.stringify(items))
  }

  remove(id: string): void {
    const items = this.getAll().filter((item) => item.id !== id)
    localStorage.setItem(this.key, JSON.stringify(items))
  }
}

export class ApiStorageAdapter<T extends { id: string }> implements StoragePort<T> {
  constructor(
    private readonly endpoint: string,
    private readonly getAuthToken: () => string | null,
    private readonly baseUrl: string = import.meta.env.VITE_API_URL || 'http://localhost:3001',
  ) {}

  private get headers() {
    const h: Record<string, string> = { 'Content-Type': 'application/json' }
    const token = this.getAuthToken()
    if (token) {
      h['Authorization'] = `Bearer ${token}`
    }
    return h
  }

  async getAll(): Promise<T[]> {
    const res = await fetch(`${this.baseUrl}${this.endpoint}`, { headers: this.headers })
    if (!res.ok) return []
    return res.json()
  }

  async getById(id: string): Promise<T | undefined> {
    const res = await fetch(`${this.baseUrl}${this.endpoint}/${id}`, { headers: this.headers })
    if (!res.ok) return undefined
    return res.json()
  }

  async save(item: T): Promise<void> {
    const existing = await this.getById(item.id)
    if (existing) {
      await fetch(`${this.baseUrl}${this.endpoint}/${item.id}`, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify(item),
      })
    } else {
      await fetch(`${this.baseUrl}${this.endpoint}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(item),
      })
    }
  }

  async remove(id: string): Promise<void> {
    await fetch(`${this.baseUrl}${this.endpoint}/${id}`, {
      method: 'DELETE',
      headers: this.headers,
    })
  }
}
