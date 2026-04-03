import { ref, computed } from 'vue'

export function usePasswordValidation() {
  const password = ref('')
  const confirmPassword = ref('')

  function checkPasswordStrength(pwd: string): 'weak' | 'fair' | 'strong' {
    if (pwd.length < 8) return 'weak'
    if (/^[a-z]+$/.test(pwd)) return 'weak'
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return 'strong'
    if (/[A-Z]|[0-9]|[!@#$%^&*]/.test(pwd)) return 'fair'
    return 'weak'
  }

  const strength = computed(() => checkPasswordStrength(password.value))
  const passwordsMatch = computed(() => password.value === confirmPassword.value)
  const isStrongEnough = computed(() => password.value.length >= 8)

  const requirements = computed(() => [
    { label: 'At least 8 characters', met: password.value.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password.value) },
    { label: 'Number', met: /[0-9]/.test(password.value) },
  ])

  const strengthBarColor = computed(() => {
    if (strength.value === 'strong') return 'bg-emerald-500'
    if (strength.value === 'fair') return 'bg-amber-400'
    return 'bg-rose-500'
  })

  const strengthTextColor = computed(() => {
    if (strength.value === 'strong') return 'text-emerald-400'
    if (strength.value === 'fair') return 'text-amber-400'
    return 'text-rose-400'
  })

  const strengthLabel = computed(() => {
    if (strength.value === 'strong') return 'Strong'
    if (strength.value === 'fair') return 'Fair'
    return 'Weak'
  })

  return {
    password,
    confirmPassword,
    strength,
    passwordsMatch,
    isStrongEnough,
    requirements,
    strengthBarColor,
    strengthTextColor,
    strengthLabel,
  }
}
