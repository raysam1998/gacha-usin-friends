'use client'

import { useActionState, useState } from 'react'
import { updateGachaConfigAction } from '@/app/actions/admin'
import ChipiCatOverlay from '@/components/ChipiCatOverlay'

type Config = {
  daily_tokens: number
  bonus_token_amount: number
  bonus_token_interval_hours: number
  auto_approve_votes: number
  user_news_enabled: boolean
  user_news_cooldown_minutes: number
  user_news_auto_active: boolean
  legendary_cat_count: number
  legendary_cat_duration: number
  legendary_cat_volume: number
}

export default function GachaConfigManager({ config }: { config: Config }) {
  const [state, action, pending] = useActionState(updateGachaConfigAction, null)
  const [testCats, setTestCats] = useState(false)
  // Live-preview sliders so the test button uses current values, not just saved ones
  const [previewCount,    setPreviewCount]    = useState(config.legendary_cat_count)
  const [previewDuration, setPreviewDuration] = useState(config.legendary_cat_duration)
  const [previewVolume,   setPreviewVolume]   = useState(config.legendary_cat_volume)

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

        {/* Legendary animation — Chipi Chipi Chapa Chapa */}
        <div className="border border-amber-900/40 rounded-lg p-4 space-y-3 bg-amber-950/10">
          <div className="flex items-center gap-2">
            <span className="text-lg">🐱</span>
            <div className="text-amber-300 text-xs font-bold uppercase tracking-wider">Legendary Animation</div>
          </div>
          <div className="text-gray-500 text-xs">Chipi Chipi Chapa Chapa — cats invade the screen on every legendary pull.</div>

          {/* Cat count slider */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-gray-400 text-xs">Number of cats</label>
              <span className="text-amber-300 text-xs font-mono">{previewCount}</span>
            </div>
            <input
              name="legendary_cat_count"
              type="range" min="1" max="20"
              value={previewCount}
              onChange={e => setPreviewCount(Number(e.target.value))}
              className="w-full accent-amber-400"
            />
            <div className="flex justify-between text-gray-700 text-xs mt-0.5"><span>1</span><span>20</span></div>
          </div>

          {/* Duration slider */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-gray-400 text-xs">Duration (seconds)</label>
              <span className="text-amber-300 text-xs font-mono">{previewDuration}s</span>
            </div>
            <input
              name="legendary_cat_duration"
              type="range" min="3" max="15"
              value={previewDuration}
              onChange={e => setPreviewDuration(Number(e.target.value))}
              className="w-full accent-amber-400"
            />
            <div className="flex justify-between text-gray-700 text-xs mt-0.5"><span>3s</span><span>15s</span></div>
          </div>

          {/* Volume slider */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-gray-400 text-xs">Volume</label>
              <span className="text-amber-300 text-xs font-mono">{Math.round(previewVolume * 100)}%</span>
            </div>
            <input
              name="legendary_cat_volume"
              type="range" min="0" max="1" step="0.05"
              value={previewVolume}
              onChange={e => setPreviewVolume(Number(e.target.value))}
              className="w-full accent-amber-400"
            />
            <div className="flex justify-between text-gray-700 text-xs mt-0.5"><span>0%</span><span>100%</span></div>
          </div>

          {/* Test button */}
          <button
            type="button"
            onClick={() => setTestCats(true)}
            className="mt-1 bg-amber-600/20 hover:bg-amber-600/35 border border-amber-500/30 text-amber-300 text-xs font-bold px-4 py-2 rounded-lg transition-colors"
          >
            🐾 Test Animation
          </button>
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

      {/* Test overlay — outside the form so it doesn't interfere */}
      <ChipiCatOverlay
        isActive={testCats}
        catCount={previewCount}
        duration={previewDuration}
        volume={previewVolume}
        onComplete={() => setTestCats(false)}
      />
    </div>
  )
}
