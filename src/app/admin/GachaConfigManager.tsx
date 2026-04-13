'use client'

import { useActionState } from 'react'
import { updateGachaConfigAction } from '@/app/actions/admin'

type Config = {
  daily_tokens: number
  bonus_token_amount: number
  bonus_token_interval_hours: number
  auto_approve_votes: number
  user_news_enabled: boolean
  user_news_cooldown_minutes: number
  user_news_auto_active: boolean
}

export default function GachaConfigManager({ config }: { config: Config }) {
  const [state, action, pending] = useActionState(updateGachaConfigAction, null)

  return (
    <div className="glass rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">⚙️</span>
        <div>
          <div className="text-white font-bold text-sm">Gacha Config</div>
          <div className="text-gray-400 text-xs">Token economy + auto-approve settings</div>
        </div>
      </div>

      <form action={action} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Daily tokens */}
          <div>
            <label className="text-gray-400 text-xs block mb-1">Daily tokens (reset)</label>
            <input
              name="daily_tokens"
              type="number"
              min="0"
              defaultValue={config.daily_tokens}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Auto-approve threshold */}
          <div>
            <label className="text-gray-400 text-xs block mb-1">Auto-approve at N yay votes</label>
            <input
              name="auto_approve_votes"
              type="number"
              min="1"
              defaultValue={config.auto_approve_votes}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>

        {/* Bonus token drip */}
        <div className="border border-gray-800 rounded-lg p-4 space-y-3">
          <div className="text-gray-300 text-xs font-bold uppercase tracking-wider">Bonus Token Drip</div>
          <div className="text-gray-500 text-xs">
            Grant extra tokens on a recurring schedule (on page load). Set amount to 0 to disable.
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-xs block mb-1">Bonus tokens per interval</label>
              <input
                name="bonus_token_amount"
                type="number"
                min="0"
                defaultValue={config.bonus_token_amount}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs block mb-1">Interval (minutes)</label>
              <input
                name="bonus_token_interval_minutes"
                type="number"
                min="0"
                step="1"
                defaultValue={Math.round(config.bonus_token_interval_hours * 60)}
                placeholder="e.g. 1, 5, 60"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
          {config.bonus_token_amount > 0 && config.bonus_token_interval_hours > 0 && (
            <div className="text-violet-400 text-xs">
              Active: +{config.bonus_token_amount} tokens every {Math.round(config.bonus_token_interval_hours * 60)} min
            </div>
          )}
          {(config.bonus_token_amount === 0 || config.bonus_token_interval_hours === 0) && (
            <div className="text-gray-600 text-xs">Disabled (amount or interval is 0)</div>
          )}
        </div>

        {/* User news submissions */}
        <div className="border border-gray-800 rounded-lg p-4 space-y-3">
          <div className="text-gray-300 text-xs font-bold uppercase tracking-wider">User News Submissions</div>
          <div className="text-gray-500 text-xs">
            Let users submit messages to the ticker. Off by default.
          </div>
          <div className="flex items-center gap-6 flex-wrap">
            {/* Enable toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="user_news_enabled"
                value="true"
                defaultChecked={config.user_news_enabled}
                className="w-4 h-4 accent-violet-500"
              />
              <span className="text-gray-300 text-xs">Enable submissions</span>
            </label>
            {/* Auto-active toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="user_news_auto_active"
                value="true"
                defaultChecked={config.user_news_auto_active}
                className="w-4 h-4 accent-violet-500"
              />
              <span className="text-gray-300 text-xs">Auto-approve (live immediately)</span>
            </label>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-gray-400 text-xs whitespace-nowrap">Cooldown (minutes)</label>
            <input
              name="user_news_cooldown_minutes"
              type="number"
              min="1"
              defaultValue={config.user_news_cooldown_minutes}
              className="w-24 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
            />
          </div>
          <div className="text-gray-600 text-xs">
            {config.user_news_enabled
              ? `Active · ${config.user_news_cooldown_minutes}min cooldown · ${config.user_news_auto_active ? 'auto-approved' : 'pending admin review'}`
              : 'Disabled — submission widget hidden from users'}
          </div>
        </div>

        {state?.error && (
          <div className="text-red-400 text-xs bg-red-900/20 border border-red-500/20 rounded-lg px-3 py-2">
            {state.error}
          </div>
        )}
        {state?.success && (
          <div className="text-green-400 text-xs bg-green-900/20 border border-green-500/20 rounded-lg px-3 py-2">
            {state.success}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-bold px-6 py-2 rounded-lg transition-colors"
        >
          {pending ? 'Saving...' : 'Save Config'}
        </button>
      </form>
    </div>
  )
}
