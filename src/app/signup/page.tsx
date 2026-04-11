'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { submitSignupRequestAction } from '@/app/actions/signup-requests'

export default function SignupPage() {
  const [state, action, pending] = useActionState(submitSignupRequestAction, null)

  if (state?.success) {
    return (
      <main className="min-h-screen bg-[#08080f] flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="text-5xl">✅</div>
          <h1 className="text-2xl font-black text-white">Request sent!</h1>
          <p className="text-gray-400 text-sm">
            Your signup request is waiting for admin approval. Once approved, you&apos;ll get your login credentials.
          </p>
          <Link href="/login" className="inline-block text-violet-400 hover:text-violet-300 text-sm transition-colors">
            ← Back to login
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#08080f] flex items-center justify-center px-4">
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center">
          <span className="text-4xl">🎴</span>
          <h1 className="text-2xl font-black text-white mt-3">Request Access</h1>
          <p className="text-gray-500 text-sm mt-1">Accounts require admin approval</p>
        </div>

        <form action={action} className="glass rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
              Username
            </label>
            <input
              name="username"
              placeholder="your_username"
              maxLength={32}
              pattern="[a-z0-9_-]+"
              title="Lowercase letters, numbers, _ and - only"
              required
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-violet-500 transition-colors placeholder:text-gray-600"
            />
            <p className="text-gray-600 text-xs mt-1">Lowercase, no spaces</p>
          </div>

          <div>
            <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
              Display name <span className="text-gray-600 normal-case font-normal">(optional)</span>
            </label>
            <input
              name="display_name"
              placeholder="How you want to appear"
              maxLength={32}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-violet-500 transition-colors placeholder:text-gray-600"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
              Message <span className="text-gray-600 normal-case font-normal">(optional)</span>
            </label>
            <textarea
              name="message"
              placeholder="Why do you want in? Who are you?"
              rows={3}
              maxLength={200}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-violet-500 transition-colors placeholder:text-gray-600 resize-none"
            />
          </div>

          {state?.error && (
            <p className="text-red-400 text-xs">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
          >
            {pending ? 'Sending…' : 'Send request'}
          </button>
        </form>

        <p className="text-center text-gray-600 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
