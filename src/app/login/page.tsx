'use client'

import { useActionState } from 'react'
import { loginAction } from '@/app/actions/auth'

const initialState = { error: null as string | null }

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState)

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#08080f]">
      {/* Background atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-900/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-950/30 rounded-full blur-3xl" />
      </div>

      {/* Floating card decorations */}
      <div className="absolute top-16 left-12 text-6xl opacity-10 animate-float" style={{ animationDelay: '0s' }}>🃏</div>
      <div className="absolute top-32 right-16 text-5xl opacity-10 animate-float" style={{ animationDelay: '1s' }}>✨</div>
      <div className="absolute bottom-24 left-20 text-5xl opacity-10 animate-float" style={{ animationDelay: '2s' }}>🎴</div>
      <div className="absolute bottom-16 right-12 text-6xl opacity-10 animate-float" style={{ animationDelay: '0.5s' }}>⭐</div>

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="glass rounded-2xl p-8 shadow-2xl animate-glow-pulse">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🎴</div>
            <h1 className="text-3xl font-black tracking-tight text-gradient mb-2">
              GACHA USIN FRIENDS
            </h1>
            <p className="text-gray-400 text-sm">
              pull cards of your homies
            </p>
          </div>

          {/* Form */}
          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1.5">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                placeholder="your username"
                className="w-full bg-gray-900/80 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="w-full bg-gray-900/80 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            {state?.error && (
              <div className="bg-red-900/30 border border-red-500/40 rounded-lg px-4 py-3 text-red-300 text-sm">
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:from-violet-800 disabled:to-purple-800 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/25 active:scale-[0.98] text-sm tracking-wide"
            >
              {isPending ? 'entering...' : 'ENTER THE GACHA'}
            </button>
          </form>

          <p className="text-center text-gray-600 text-xs mt-6">
            no account? ask the admin (it&apos;s rayan)
          </p>
        </div>
      </div>
    </div>
  )
}
