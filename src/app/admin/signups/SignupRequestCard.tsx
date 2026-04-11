'use client'

import { useActionState } from 'react'
import { approveSignupAction, rejectSignupAction } from '@/app/actions/signup-requests'

type SignupRequest = {
  id: string
  username: string
  display_name: string | null
  message: string | null
  status: string
  admin_note: string | null
  created_at: string
}

export default function SignupRequestCard({ req }: { req: SignupRequest }) {
  const [approveState, approveAction, approvePending] = useActionState(approveSignupAction, null)
  const [rejectState, rejectAction, rejectPending] = useActionState(rejectSignupAction, null)

  const date = new Date(req.created_at).toLocaleDateString('en-CA', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  if (approveState?.credentials) {
    return (
      <div className="glass rounded-xl p-5 border border-green-500/30">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-green-400 font-bold">✓ Approved: {req.username}</span>
        </div>
        <div className="bg-gray-900 rounded-lg p-3 space-y-1 font-mono text-sm">
          <p className="text-gray-400">Username: <span className="text-white">{approveState.credentials.username}</span></p>
          <p className="text-gray-400">Password: <span className="text-white">{approveState.credentials.password}</span></p>
        </div>
        <p className="text-gray-500 text-xs mt-2">Send these credentials to the user.</p>
      </div>
    )
  }

  if (req.status !== 'pending') {
    return (
      <div className="glass rounded-xl p-5 opacity-50">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-gray-300 font-bold">{req.display_name ?? req.username}</span>
            <span className="text-gray-500 text-sm ml-2">@{req.username}</span>
          </div>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            req.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {req.status}
          </span>
        </div>
        {req.admin_note && <p className="text-gray-600 text-xs mt-1">Note: {req.admin_note}</p>}
      </div>
    )
  }

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="text-white font-bold">
            {req.display_name && req.display_name !== req.username ? (
              <>{req.display_name} <span className="text-gray-500 font-normal text-sm">@{req.username}</span></>
            ) : (
              `@${req.username}`
            )}
          </p>
          <p className="text-gray-600 text-xs mt-0.5">{date}</p>
        </div>
        <span className="text-xs bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded-full shrink-0">pending</span>
      </div>

      {req.message && (
        <p className="text-gray-400 text-sm bg-gray-900/60 rounded-lg px-3 py-2 mb-4 italic">
          &ldquo;{req.message}&rdquo;
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* Approve */}
        <form action={approveAction}>
          <input type="hidden" name="request_id" value={req.id} />
          <div className="mb-2">
            <input
              name="password"
              type="text"
              placeholder="Custom pw (or leave blank)"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white text-xs outline-none focus:border-green-500 placeholder:text-gray-600"
            />
          </div>
          <button
            type="submit"
            disabled={approvePending}
            className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
          >
            {approvePending ? 'Approving…' : '✓ Approve'}
          </button>
          {approveState?.error && <p className="text-red-400 text-xs mt-1">{approveState.error}</p>}
        </form>

        {/* Reject */}
        <form action={rejectAction}>
          <input type="hidden" name="request_id" value={req.id} />
          <div className="mb-2">
            <input
              name="admin_note"
              type="text"
              placeholder="Rejection note (optional)"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white text-xs outline-none focus:border-red-500 placeholder:text-gray-600"
            />
          </div>
          <button
            type="submit"
            disabled={rejectPending}
            className="w-full bg-red-900/60 hover:bg-red-800/60 disabled:opacity-50 border border-red-500/30 text-red-400 text-xs font-bold px-3 py-2 rounded-lg transition-colors"
          >
            {rejectPending ? 'Rejecting…' : '✗ Reject'}
          </button>
          {rejectState?.error && <p className="text-red-400 text-xs mt-1">{rejectState.error}</p>}
        </form>
      </div>
    </div>
  )
}
