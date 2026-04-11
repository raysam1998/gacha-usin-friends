'use client'

import { useActionState, useState } from 'react'
import { createUserAction, deleteUserAction, editUserAction, resetUserPasswordAction } from '@/app/actions/admin'
import type { Profile } from '@/types/database'

// ── Create User Form ──────────────────────────────────────────
function CreateUserForm({ onClose }: { onClose: () => void }) {
  const [state, action, pending] = useActionState(createUserAction, {
    error: null, success: null, credentials: null,
  })

  if (state.credentials) {
    return (
      <div className="p-5 bg-green-900/20 border border-green-500/30 rounded-xl space-y-3">
        <div className="text-green-400 font-bold text-sm">✓ User created! Share these credentials:</div>
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 font-mono text-sm space-y-1">
          <div><span className="text-gray-500">Username: </span><span className="text-white font-bold">{state.credentials.username}</span></div>
          <div><span className="text-gray-500">Password: </span><span className="text-amber-400 font-bold">{state.credentials.password}</span></div>
        </div>
        <p className="text-gray-500 text-xs">Copy this — the password won&apos;t be shown again.</p>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-sm transition-colors">Close</button>
      </div>
    )
  }

  return (
    <form action={action} className="bg-gray-900/60 border border-gray-700/50 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-bold text-white">New User</h3>
        <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-300 text-lg leading-none">×</button>
      </div>
      <input name="username" placeholder="Username" required autoComplete="off"
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-violet-500 outline-none" />
      <input name="display_name" placeholder="Display name (optional)" autoComplete="off"
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-violet-500 outline-none" />
      <div>
        <input name="password" type="text" placeholder="Password (blank = auto-generate)" autoComplete="off"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-violet-500 outline-none" />
        <p className="text-gray-600 text-xs mt-1">Leave blank for a random password.</p>
      </div>
      {state.error && <p className="text-red-400 text-xs">{state.error}</p>}
      <button type="submit" disabled={pending}
        className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
        {pending ? 'Creating...' : 'Create User'}
      </button>
    </form>
  )
}

// ── Inline Edit Panel ─────────────────────────────────────────
function EditUserPanel({ user, onClose }: { user: Profile; onClose: () => void }) {
  const [editState, editAction, editPending] = useActionState(editUserAction, null)
  const [pwState, pwAction, pwPending] = useActionState(resetUserPasswordAction, null)
  const [, deleteAction, deletePending] = useActionState(deleteUserAction, { error: null, success: null })

  return (
    <div className="bg-gray-950 border border-gray-700/70 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Edit @{user.username}</span>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-300 text-lg leading-none">×</button>
      </div>

      {/* Profile + tokens + admin */}
      <form action={editAction} className="space-y-3">
        <input type="hidden" name="id" value={user.id} />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-gray-500 text-xs mb-1">Username</label>
            <input name="username" defaultValue={user.username} required
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white text-sm outline-none focus:border-violet-500" />
          </div>
          <div>
            <label className="block text-gray-500 text-xs mb-1">Display name</label>
            <input name="display_name" defaultValue={user.display_name ?? ''}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white text-sm outline-none focus:border-violet-500" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 items-end">
          <div>
            <label className="block text-gray-500 text-xs mb-1">Tokens</label>
            <input name="tokens" type="number" min="0" defaultValue={user.tokens ?? 0}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white text-sm outline-none focus:border-violet-500" />
          </div>
          <div className="flex gap-3 pb-1.5">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input name="is_admin" type="checkbox" value="true" defaultChecked={user.is_admin ?? false}
                className="w-4 h-4 accent-violet-500" />
              <span className="text-gray-400 text-xs">Admin</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input name="reset_pity" type="checkbox" value="true"
                className="w-4 h-4 accent-amber-500" />
              <span className="text-gray-400 text-xs">Reset pity</span>
            </label>
          </div>
        </div>
        {editState?.error && <p className="text-red-400 text-xs">{editState.error}</p>}
        {editState?.success && <p className="text-green-400 text-xs">{editState.success}</p>}
        <button type="submit" disabled={editPending}
          className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">
          {editPending ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      <div className="border-t border-gray-800" />

      {/* Password reset */}
      <form action={pwAction} className="space-y-2">
        <input type="hidden" name="id" value={user.id} />
        <label className="block text-gray-500 text-xs">New password</label>
        <div className="flex gap-2">
          <input name="password" type="text" placeholder="New password" minLength={6} autoComplete="off"
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white text-sm outline-none focus:border-amber-500 placeholder:text-gray-600" />
          <button type="submit" disabled={pwPending}
            className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
            {pwPending ? '…' : 'Set pw'}
          </button>
        </div>
        <p className="text-gray-700 text-xs">Admin-set. User will be informed their password was reset.</p>
        {pwState?.error && <p className="text-red-400 text-xs">{pwState.error}</p>}
        {pwState?.success && <p className="text-green-400 text-xs">{pwState.success}</p>}
      </form>

      {/* Delete */}
      {!user.is_admin && (
        <>
          <div className="border-t border-gray-800" />
          <form action={deleteAction}>
            <input type="hidden" name="id" value={user.id} />
            <button type="submit" disabled={deletePending}
              onClick={e => { if (!confirm('Delete this user permanently?')) e.preventDefault() }}
              className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50 px-2 py-1 rounded hover:bg-red-900/20 transition-colors">
              {deletePending ? '…' : 'Delete user'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}

// ── Main Manager ──────────────────────────────────────────────
export default function UsersManager({ users }: { users: Profile[] }) {
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black text-white tracking-tight">Users</h2>
        <button onClick={() => setShowCreate(v => !v)}
          className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">
          + New User
        </button>
      </div>

      {showCreate && (
        <div className="mb-4">
          <CreateUserForm onClose={() => setShowCreate(false)} />
        </div>
      )}

      <div className="space-y-2">
        {users.length === 0 ? (
          <div className="text-center py-8 text-gray-600 text-sm bg-gray-900/40 border border-gray-800 rounded-xl">No users yet.</div>
        ) : users.map(user => (
          <div key={user.id}>
            {/* Row */}
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
                editingId === user.id
                  ? 'bg-gray-900/80 border-violet-500/40'
                  : 'bg-gray-900/40 border-gray-800 hover:border-gray-700'
              }`}
              onClick={() => setEditingId(editingId === user.id ? null : user.id)}
            >
              <div className="flex-1 min-w-0">
                <span className="text-white font-mono text-sm font-bold">{user.username}</span>
                {user.display_name && user.display_name !== user.username && (
                  <span className="text-gray-500 text-sm ml-2">{user.display_name}</span>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-amber-400 font-bold text-sm">🪙 {user.tokens ?? 0}</span>
                {user.is_admin && (
                  <span className="text-xs bg-violet-900/50 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full">admin</span>
                )}
                <span className="text-gray-600 text-xs">{editingId === user.id ? '▲' : '▼'}</span>
              </div>
            </div>

            {/* Edit panel */}
            {editingId === user.id && (
              <div className="mt-1 ml-2">
                <EditUserPanel user={user} onClose={() => setEditingId(null)} />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
