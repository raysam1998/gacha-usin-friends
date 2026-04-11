'use client'

import { useActionState, useState } from 'react'
import { createUserAction, deleteUserAction } from '@/app/actions/admin'
import type { Profile } from '@/types/database'

// ── Create User Form ──────────────────────────────────────────
function CreateUserForm({ onClose }: { onClose: () => void }) {
  const [state, action, pending] = useActionState(createUserAction, {
    error: null,
    success: null,
    credentials: null,
  })

  if (state.credentials) {
    return (
      <div className="p-5 bg-green-900/20 border border-green-500/30 rounded-xl space-y-3">
        <div className="text-green-400 font-bold text-sm">✓ User created! Share these credentials:</div>
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 font-mono text-sm space-y-1">
          <div>
            <span className="text-gray-500">Username: </span>
            <span className="text-white font-bold">{state.credentials.username}</span>
          </div>
          <div>
            <span className="text-gray-500">Password: </span>
            <span className="text-amber-400 font-bold">{state.credentials.password}</span>
          </div>
        </div>
        <p className="text-gray-500 text-xs">Copy this — the password won&apos;t be shown again.</p>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-sm transition-colors"
        >
          Close
        </button>
      </div>
    )
  }

  return (
    <form action={action} className="bg-gray-900/60 border border-gray-700/50 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-bold text-white">New User</h3>
        <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-300 text-lg leading-none">×</button>
      </div>
      <input
        name="username"
        placeholder="Username (e.g. ahmed)"
        required
        autoComplete="off"
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 outline-none"
      />
      <input
        name="display_name"
        placeholder="Display name (optional, defaults to username)"
        autoComplete="off"
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 outline-none"
      />
      <div>
        <input
          name="password"
          type="text"
          placeholder="Password (leave blank to auto-generate)"
          autoComplete="off"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 outline-none"
        />
        <p className="text-gray-600 text-xs mt-1">If blank, a random password is generated for you.</p>
      </div>
      {state.error && <p className="text-red-400 text-xs">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
      >
        {pending ? 'Creating...' : 'Create User'}
      </button>
    </form>
  )
}

// ── Delete User Button ────────────────────────────────────────
function DeleteUserButton({ id }: { id: string }) {
  const [, action, pending] = useActionState(deleteUserAction, { error: null, success: null })
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        onClick={(e) => { if (!confirm('Delete this user? This is permanent.')) e.preventDefault() }}
        className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50 px-2 py-1 rounded hover:bg-red-900/20 transition-colors"
      >
        {pending ? '...' : 'delete'}
      </button>
    </form>
  )
}

// ── Main Manager ──────────────────────────────────────────────
export default function UsersManager({ users }: { users: Profile[] }) {
  const [showCreateUser, setShowCreateUser] = useState(false)

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black text-white tracking-tight">Users</h2>
        <button
          onClick={() => setShowCreateUser(v => !v)}
          className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
        >
          + New User
        </button>
      </div>

      {showCreateUser && (
        <div className="mb-4">
          <CreateUserForm onClose={() => setShowCreateUser(false)} />
        </div>
      )}

      <div className="bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden">
        {users.length === 0 ? (
          <div className="text-center py-8 text-gray-600 text-sm">No users yet.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500">
                <th className="text-left px-4 py-3 font-medium">Username</th>
                <th className="text-left px-4 py-3 font-medium">Display Name</th>
                <th className="text-center px-4 py-3 font-medium">Tokens</th>
                <th className="text-center px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-800/50 last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-white">{user.username}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{user.display_name ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-amber-400 text-center font-bold">{user.tokens}</td>
                  <td className="px-4 py-3 text-center">
                    {user.is_admin ? (
                      <span className="text-xs bg-violet-900/50 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full">admin</span>
                    ) : (
                      <span className="text-xs text-gray-600">user</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!user.is_admin && <DeleteUserButton id={user.id} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}
