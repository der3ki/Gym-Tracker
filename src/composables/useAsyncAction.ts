import { ref, type Ref } from 'vue'

export function useAsyncAction<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
): { loading: Ref<boolean>; run: (...args: TArgs) => Promise<TResult | undefined> } {
  const loading = ref(false)

  async function run(...args: TArgs): Promise<TResult | undefined> {
    if (loading.value) return undefined
    loading.value = true
    try {
      return await fn(...args)
    } finally {
      loading.value = false
    }
  }

  return { loading, run }
}
