'use client'

import { useActionState } from 'react'
import { updateDisplayNameAction, updateUsernameAction, updatePasswordAction } from '@/app/actions/settings'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  )
}

import type { SettingsState } from '@/app/actions/settings'

function StatusMsg({ state }: { state: SettingsState | null }) {
  if (!state) return null
  if (state.error) return <p className="text-red-400 text-xs mt-2">{state.error}</p>
  if (state.success) return <p className="text-green-400 text-xs mt-2">{state.success}</p>
  return null
}

export default function SettingsForm({
  currentDisplayName,
  currentUsername,
}: {
  currentDisplayName: string
  currentUsername: string
}) {
  const [displayNameState, displayNameAction, displayNamePending] = useActionState(updateDisplayNameAction, null)
  const [usernameState, usernameAction, usernamePending] = useActionState(updateUsernameAction, null)
  const [passwordState, passwordAction, passwordPending] = useActionState(updatePasswordAction, null)

  return (
    <div className="space-y-6">

      {/* Display Name */}
      <div className="glass rounded-xl p-5">
        <h2 className="text-white font-bold mb-4">Display Name</h2>
        <form action={displayNameAction} className="space-y-3">
          <Field label="New display name">
            <input
              name="display_name"
              defaultValue={currentDisplayName}
              maxLength={32}
              required
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-violet-500 transition-colors"
            />
          </Field>
          <button
            type="submit"
            disabled={displayNamePending}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
          >
            {displayNamePending ? 'Saving…' : 'Save'}
          </button>
          <StatusMsg state={displayNameState} />
        </form>
      </div>

      {/* Username */}
      <div className="glass rounded-xl p-5">
        <h2 className="text-white font-bold mb-4">Username</h2>
        <form action={usernameAction} className="space-y-3">
          <Field label="New username">
            <input
              name="username"
              defaultValue={currentUsername}
              maxLength={32}
              pattern="[a-z0-9_-]+"
              title="Lowercase letters, numbers, _ and - only"
              required
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-violet-500 transition-colors"
            />
          </Field>
          <p className="text-gray-600 text-xs">Lowercase letters, numbers, _ and - only. Changing this also changes your login.</p>
          <button
            type="submit"
            disabled={usernamePending}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
          >
            {usernamePending ? 'Saving…' : 'Save'}
          </button>
          <StatusMsg state={usernameState} />
        </form>
      </div>

      {/* Password */}
      <div className="glass rounded-xl p-5">
        <h2 className="text-white font-bold mb-4">Password</h2>
        <form action={passwordAction} className="space-y-3">
          <Field label="New password">
            <input
              name="new_password"
              type="password"
              minLength={6}
              required
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-violet-500 transition-colors"
            />
          </Field>
          <Field label="Confirm new password">
            <input
              name="confirm_password"
              type="password"
              minLength={6}
              required
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-violet-500 transition-colors"
            />
          </Field>
          <button
            type="submit"
            disabled={passwordPending}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
          >
            {passwordPending ? 'Saving…' : 'Change password'}
          </button>
          <StatusMsg state={passwordState} />
        </form>
      </div>

    </div>
  )
}
