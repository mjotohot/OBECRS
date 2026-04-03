import { supabase } from './supabase.service'
import type { User } from '../types/userTypes'

const ALLOWED_ROLES = ['Faculty', 'Chairperson', 'Admin'] as const

export type AuthResponse<T = User> = {
  data: T | null
  error: string | null
}

export async function getCurrentUser(): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    return {
      data: null,
      error: error?.message ?? null,
    }
  }

  try {
    const { data: profile } = await supabase
      .from('user')
      .select('*')
      .eq('user_id', data.user.id)
      .maybeSingle()

    return {
      data: profile,
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error: 'Failed to load user profile',
    }
  }
}

export async function signInWithPassword(email: string, password: string): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data.user) {
    return {
      data: null,
      error: error?.message ?? 'Login failed',
    }
  }

  const { data: profileData, error: profileError } = await supabase
    .from('user')
    .select('*')
    .eq('user_id', data.user.id)
    .single()

  if (profileError || !profileData?.role || !ALLOWED_ROLES.includes(profileData.role as any)) {
    await supabase.auth.signOut()
    return { data: null, error: 'Your account does not have a valid role.' }
  }

  return {
    data: profileData,
    error: null,
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: 'Faculty' | 'Chairperson' | 'Admin' = 'Faculty',
): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error || !data.user) {
    return {
      data: null,
      error: error?.message ?? 'Registration failed',
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from('user')
    .insert({
      user_id: data.user.id,
      first_name: firstName,
      last_name: lastName,
      role,
    })
    .select()
    .single()

  if (profileError) {
    return {
      data: null,
      error: 'User created but profile setup failed',
    }
  }

  return {
    data: profile,
    error: null,
  }
}

export async function forgotPassword(email: string): Promise<AuthResponse<null>> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) {
    return {
      data: null,
      error: error.message,
    }
  }
  return {
    data: null,
    error: null,
  }
}

export async function resetPassword(newPassword: string): Promise<AuthResponse<null>> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })
  if (error) {
    return {
      data: null,
      error: error.message,
    }
  }
  return {
    data: null,
    error: null,
  }
}

export async function signOut(): Promise<AuthResponse<null>> {
  const { error } = await supabase.auth.signOut()
  return {
    data: null,
    error: error?.message ?? null,
  }
}
