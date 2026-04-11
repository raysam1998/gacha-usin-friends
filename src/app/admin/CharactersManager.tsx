'use client'

import { useActionState, useState } from 'react'
import Image from 'next/image'
import {
  createCharacterAction,
  createCardAction,
  deleteCharacterAction,
  deleteCardAction,
} from '@/app/actions/admin'
import type { Character, Card } from '@/types/database'

type CharacterWithCards = Character & { cards: Card[] }

const RARITIES = ['common', 'rare', 'epic', 'legendary'] as const

const rarityColors: Record<string, string> = {
  common: 'text-gray-400 bg-gray-800',
  rare: 'text-blue-300 bg-blue-900/40',
  epic: 'text-purple-300 bg-purple-900/40',
  legendary: 'text-amber-300 bg-amber-900/40',
}

// ── Create Character Form ─────────────────────────────────────
function CreateCharacterForm({ onClose }: { onClose: () => void }) {
  const [state, action, pending] = useActionState(createCharacterAction, { error: null, success: null })

  if (state.success) {
    return (
      <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-xl text-green-400 text-sm flex items-center justify-between">
        <span>✓ {state.success}</span>
        <button onClick={onClose} className="text-green-300 hover:text-white text-xs ml-4">close</button>
      </div>
    )
  }

  return (
    <form action={action} className="bg-gray-900/60 border border-gray-700/50 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-bold text-white">New Character</h3>
        <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-300 text-lg leading-none">×</button>
      </div>
      <input
        name="name"
        placeholder="Name (e.g. Rayan)"
        required
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 outline-none"
      />
      <textarea
        name="bio"
        placeholder="Bio (optional)"
        rows={2}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 outline-none resize-none"
      />
      {state.error && <p className="text-red-400 text-xs">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
      >
        {pending ? 'Creating...' : 'Create Character'}
      </button>
    </form>
  )
}

// ── Add Card Form ─────────────────────────────────────────────
function AddCardForm({ character, onClose }: { character: CharacterWithCards; onClose: () => void }) {
  const [state, action, pending] = useActionState(createCardAction, { error: null, success: null })
  const [preview, setPreview] = useState<string | null>(null)

  if (state.success) {
    return (
      <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-xl text-green-400 text-xs flex items-center justify-between">
        <span>✓ {state.success}</span>
        <button onClick={onClose} className="text-green-300 hover:text-white ml-4">close</button>
      </div>
    )
  }

  return (
    <form action={action} className="bg-gray-900/60 border border-gray-700/50 rounded-xl p-4 space-y-3 mt-3">
      <input type="hidden" name="character_id" value={character.id} />
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-xs font-bold text-gray-300">Add Card for {character.name}</h4>
        <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-300 text-lg leading-none">×</button>
      </div>
      <input
        name="variant_name"
        placeholder="Variant name (e.g. Baby, Meme Lord)"
        required
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 outline-none"
      />
      <select
        name="rarity"
        required
        defaultValue=""
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-violet-500 outline-none"
      >
        <option value="" disabled>Pick rarity...</option>
        {RARITIES.map(r => (
          <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
        ))}
      </select>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Card image</label>
        <input
          name="image"
          type="file"
          accept="image/*"
          required
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) setPreview(URL.createObjectURL(f))
          }}
          className="w-full text-sm text-gray-300 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-violet-600 file:text-white hover:file:bg-violet-500 cursor-pointer"
        />
        {preview && (
          <div className="mt-2 relative w-24 h-32 rounded-lg overflow-hidden border border-gray-700">
            <Image src={preview} alt="preview" fill className="object-cover" />
          </div>
        )}
      </div>
      {state.error && <p className="text-red-400 text-xs">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
      >
        {pending ? 'Uploading...' : 'Add Card'}
      </button>
    </form>
  )
}

// ── Delete buttons ────────────────────────────────────────────
function DeleteCharacterButton({ id }: { id: string }) {
  const [, action, pending] = useActionState(deleteCharacterAction, { error: null, success: null })
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        onClick={(e) => { if (!confirm('Delete this character and ALL their cards?')) e.preventDefault() }}
        className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50 px-2 py-1 rounded hover:bg-red-900/20 transition-colors"
      >
        {pending ? '...' : 'delete'}
      </button>
    </form>
  )
}

function DeleteCardButton({ id }: { id: string }) {
  const [, action, pending] = useActionState(deleteCardAction, { error: null, success: null })
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        onClick={(e) => { if (!confirm('Delete this card?')) e.preventDefault() }}
        className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        ✕
      </button>
    </form>
  )
}

// ── Main Manager ──────────────────────────────────────────────
export default function CharactersManager({ characters }: { characters: CharacterWithCards[] }) {
  const [showCreateChar, setShowCreateChar] = useState(false)
  const [activeCardForm, setActiveCardForm] = useState<string | null>(null)

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black text-white tracking-tight">Characters & Cards</h2>
        <button
          onClick={() => setShowCreateChar(v => !v)}
          className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
        >
          + New Character
        </button>
      </div>

      {showCreateChar && (
        <div className="mb-4">
          <CreateCharacterForm onClose={() => setShowCreateChar(false)} />
        </div>
      )}

      {characters.length === 0 && (
        <div className="text-center py-12 text-gray-600 text-sm border border-dashed border-gray-800 rounded-xl">
          No characters yet. Create one above.
        </div>
      )}

      <div className="space-y-4">
        {characters.map((char) => (
          <div key={char.id} className="bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden">
            {/* Character header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/50">
              <div>
                <span className="font-bold text-white text-sm">{char.name}</span>
                {char.bio && <span className="text-gray-500 text-xs ml-2">{char.bio}</span>}
                <span className="text-gray-600 text-xs ml-2">({char.cards.length} cards)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveCardForm(activeCardForm === char.id ? null : char.id)}
                  className="text-xs text-violet-400 hover:text-violet-300 px-2 py-1 rounded hover:bg-violet-900/20 transition-colors"
                >
                  + add card
                </button>
                <DeleteCharacterButton id={char.id} />
              </div>
            </div>

            {/* Cards grid */}
            <div className="p-4">
              {char.cards.length === 0 && activeCardForm !== char.id && (
                <p className="text-gray-600 text-xs">No cards yet.</p>
              )}
              <div className="flex flex-wrap gap-3">
                {char.cards.map((card) => (
                  <div key={card.id} className="group relative w-20 flex flex-col items-center gap-1">
                    <div className={`relative w-20 h-28 rounded-lg overflow-hidden border-2 ${card.rarity === 'legendary' ? 'rarity-legendary' : card.rarity === 'epic' ? 'rarity-epic' : card.rarity === 'rare' ? 'rarity-rare' : 'rarity-common'}`}>
                      <Image src={card.image_url} alt={card.variant_name} fill className="object-cover" />
                      <div className="absolute top-1 right-1">
                        <DeleteCardButton id={card.id} />
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 text-center leading-tight">{card.variant_name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${rarityColors[card.rarity]}`}>
                      {card.rarity}
                    </span>
                  </div>
                ))}
              </div>

              {activeCardForm === char.id && (
                <AddCardForm character={char} onClose={() => setActiveCardForm(null)} />
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
