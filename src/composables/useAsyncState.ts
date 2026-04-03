import { ref } from 'vue'
import { useToast } from './useToast'

export function useAsyncState() {
  const { addToast } = useToast()
  const isLoading = ref(false)
  const error = ref('')
  const success = ref(false)

  const reset = () => {
    error.value = ''
    success.value = false
  }

  const wrapAsync = async <T>(
    fn: () => Promise<T>,
    options?: { successMsg?: string; errorMsg?: string },
  ): Promise<T | undefined> => {
    isLoading.value = true
    reset()

    try {
      const result = await fn()
      success.value = true
      if (options?.successMsg) addToast(options.successMsg, 'success')
      return result
    } catch (err: any) {
      const msg = options?.errorMsg || err.message || 'An error occurred'
      error.value = msg
      addToast(msg, 'error')
      return undefined
    } finally {
      isLoading.value = false
    }
  }

  return { isLoading, error, success, wrapAsync }
}
