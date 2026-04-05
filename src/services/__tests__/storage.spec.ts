import { describe, it, expect, beforeEach } from 'vitest'
import { LocalStorageAdapter } from '../storage'

interface TestItem {
  id: string
  name: string
}

describe('LocalStorageAdapter', () => {
  let storage: LocalStorageAdapter<TestItem>

  beforeEach(() => {
    storage = new LocalStorageAdapter<TestItem>('test-items')
  })

  describe('getAll', () => {
    it('should return empty array when no data exists', () => {
      // Arrange - empty localStorage (cleared in setup)

      // Act
      const result = storage.getAll()

      // Assert
      expect(result).toEqual([])
    })

    it('should return stored items', () => {
      // Arrange
      const items: TestItem[] = [{ id: '1', name: 'Item 1' }]
      localStorage.setItem('test-items', JSON.stringify(items))

      // Act
      const result = storage.getAll()

      // Assert
      expect(result).toEqual(items)
    })
  })

  describe('getById', () => {
    it('should return undefined when item does not exist', () => {
      // Arrange - empty storage

      // Act
      const result = storage.getById('non-existent')

      // Assert
      expect(result).toBeUndefined()
    })

    it('should return the item matching the id', () => {
      // Arrange
      const item: TestItem = { id: '1', name: 'Item 1' }
      storage.save(item)

      // Act
      const result = storage.getById('1')

      // Assert
      expect(result).toEqual(item)
    })
  })

  describe('save', () => {
    it('should add a new item', () => {
      // Arrange
      const item: TestItem = { id: '1', name: 'Item 1' }

      // Act
      storage.save(item)

      // Assert
      expect(storage.getAll()).toEqual([item])
    })

    it('should update an existing item', () => {
      // Arrange
      storage.save({ id: '1', name: 'Original' })

      // Act
      storage.save({ id: '1', name: 'Updated' })

      // Assert
      const items = storage.getAll()
      expect(items).toHaveLength(1)
      expect(items[0].name).toBe('Updated')
    })
  })

  describe('remove', () => {
    it('should remove the item by id', () => {
      // Arrange
      storage.save({ id: '1', name: 'Item 1' })
      storage.save({ id: '2', name: 'Item 2' })

      // Act
      storage.remove('1')

      // Assert
      const items = storage.getAll()
      expect(items).toHaveLength(1)
      expect(items[0].id).toBe('2')
    })

    it('should not throw when removing non-existent item', () => {
      // Arrange - empty storage

      // Act & Assert
      expect(() => storage.remove('non-existent')).not.toThrow()
    })
  })
})
