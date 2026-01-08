'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function SignInContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isActivating, setIsActivating] = useState(false)
  const [error, setError] = useState('')
  const [showActivation, setShowActivation] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccessMessage('')
    setShowActivation(false)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      })

      if (result?.error) {
        // Check if this is a "not registered for this app" error
        if (result.error.toLowerCase().includes('not registered for this application')) {
          setShowActivation(true)
          setError('You have an Autentico account but haven\'t activated it for Cardything yet.')
        } else {
          setError(result.error)
        }
      } else if (result?.ok) {
        router.push(callbackUrl)
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleActivate = async () => {
    setIsActivating(true)
    setError('')
    setSuccessMessage('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Activation failed')
        return
      }

      if (data.existingUser && data.canLoginNow) {
        setSuccessMessage('Account activated! You can now sign in.')
        setShowActivation(false)
      } else if (data.existingUser && data.requiresApproval) {
        setSuccessMessage('Account linked! Your access is pending administrator approval.')
        setShowActivation(false)
      } else if (data.success) {
        setSuccessMessage(data.message || 'Please check your email to complete setup.')
        setShowActivation(false)
      }
    } catch {
      setError('Activation failed. Please try again.')
    } finally {
      setIsActivating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Cardything
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Organize your tasks with Cardything
          </p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg space-y-6">
          {/* Email/Password Form */}
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
                {successMessage}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            {showActivation && (
              <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded">
                <p className="text-blue-800 text-sm mb-3">
                  Would you like to activate your account for Cardything using your existing credentials?
                </p>
                <button
                  type="button"
                  onClick={handleActivate}
                  disabled={isActivating}
                  className="w-full flex justify-center py-2 px-4 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isActivating ? 'Activating...' : 'Activate Account'}
                </button>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your email"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your password"
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => router.push('/auth/forgot-password')}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Register Link */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => router.push('/auth/register')}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Create one
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}
