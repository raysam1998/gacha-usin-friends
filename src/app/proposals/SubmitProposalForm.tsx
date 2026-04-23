'use client'

import { useActionState, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { submitProposalAction } from '@/app/actions/proposals'

type Character = { id: string; name: string }

const RARITIES = ['common', 'rare', 'epic', 'legendary'] as const
const rarityColors: Record<string, string> = {
  common: 'border-gray-500 text-gray-400 hover:bg-gray-700/40',
  rare: 'border-blue-500 text-blue-400 hover:bg-blue-900/30',
  epic: 'border-purple-500 text-purple-400 hover:bg-purple-900/30',
  legendary: 'border-amber-500 text-amber-400 hover:bg-amber-900/30',
}
const raritySelected: Record<string, string> = {
  common: 'bg-gray-700 border-gray-400 text-gray-200',
  rare: 'bg-blue-900/60 border-blue-400 text-blue-200',
  epic: 'bg-purple-900/60 border-purple-400 text-purple-200',
  legendary: 'bg-amber-900/60 border-amber-400 text-amber-200',
}

export default function SubmitProposalForm({ characters }: { characters: Character[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(submitProposalAction, { error: null, success: null })
  const [isNewChar, setIsNewChar] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedRarity, setSelectedRarity] = useState<string>('common')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state.success) router.refresh()
  }, [state.success, router])

  const handleFile = (file: File | undefined) => {
    if (!file) return
    if (fileInputRef.current) {
      const dt = new DataTransfer()
      dt.items.add(file)
      fileInputRef.current.files = dt.files
    }
    setPreview(URL.createObjectURL(file))
  }

  if (state.success && open) {
    return (
      <div className="glass rounded-2xl p-5 flex items-center justify-between">
        <span className="text-green-400 font-semibold text-sm">✓ {state.success}</span>
        <button onClick={() => { setOpen(false); setPreview(null) }} className="text-gray-400 hover:text-white text-sm">
          close
        </button>
      </div>
    )
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full glass rounded-2xl py-4 text-violet-300 hover:text-violet-200 border border-dashed border-violet-500/30 hover:border-violet-500/60 transition-all text-sm font-semibold"
        >
          + Submit a Card Proposal
        </button>
      ) : (
        <form action={action} className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-white text-lg">New Proposal</h3>
            <button type="button" onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-300 text-2xl leading-none">×</button>
          </div>

          {/* Character picker */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Character</label>
            <div className="flex gap-2 mb-2">
              <button type="button" onClick={() => setIsNewChar(false)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${!isNewChar ? 'bg-violet-600 border-violet-500 text-white' : 'border-gray-700 text-gray-400 hover:text-white'}`}>
                Existing homie
              </button>
              <button type="button" onClick={() => setIsNewChar(true)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${isNewChar ? 'bg-violet-600 border-violet-500 text-white' : 'border-gray-700 text-gray-400 hover:text-white'}`}>
                New homie
              </button>
            </div>
            {isNewChar ? (
              <input name="new_character_name" placeholder="New homie's name" required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-violet-500 outline-none" />
            ) : (
              <select name="character_id" required defaultValue=""
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-violet-500 outline-none">
                <option value="" disabled>Pick a homie...</option>
                {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>

          {/* Variant name */}
          <input name="variant_name" placeholder="Variant name (e.g. Beach Day, Mugshot)" required
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-violet-500 outline-none" />

          {/* Rarity */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Suggested Rarity</label>
            <input type="hidden" name="proposed_rarity" value={selectedRarity} />
            <div className="flex gap-2">
              {RARITIES.map(r => (
                <button key={r} type="button" onClick={() => setSelectedRarity(r)}
                  className={`flex-1 text-xs py-2 rounded-lg border capitalize transition-all ${selectedRarity === r ? raritySelected[r] : rarityColors[r]}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Image */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Photo</label>
            <input ref={fileInputRef} name="image" type="file" accept="image/*" required
              onChange={(e) => handleFile(e.target.files?.[0])}
              className="hidden" />
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
              className={`cursor-pointer rounded-xl border-2 border-dashed transition-colors p-4 text-center text-xs ${
                dragOver
                  ? 'border-violet-400 bg-violet-900/20 text-violet-300'
                  : 'border-gray-700 text-gray-500 hover:border-violet-600 hover:text-gray-400'
              }`}
            >
              {preview ? (
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-20 rounded-lg overflow-hidden border border-gray-700 shrink-0">
                    <Image src={preview} alt="preview" fill className="object-cover" />
                  </div>
                  <span className="text-gray-400">Click or drop to change</span>
                </div>
              ) : (
                <span>Drop image here or click to browse</span>
              )}
            </div>
          </div>

          {state.error && <p className="text-red-400 text-xs">{state.error}</p>}

          <button type="submit" disabled={pending}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all text-sm">
            {pending ? 'Submitting...' : 'Submit Proposal'}
          </button>
        </form>
      )}
    </div>
  )
}
