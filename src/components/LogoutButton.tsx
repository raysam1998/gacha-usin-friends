'use client'

import { signOutAction } from '@/app/actions/auth'

export default function LogoutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="text-gray-400 hover:text-white text-sm transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
      >
        logout
      </button>
    </form>
  )
}
