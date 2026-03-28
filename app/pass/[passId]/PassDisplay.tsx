'use client'

import { useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface Pass {
  id: string
  barcode_value: string
  current_stamps: number
  reward_available: boolean
  customers: { name: string; email: string }
  promotions: {
    title: string
    stamps_required: number
    reward_name: string
    businesses: { name: string }
  }
}

const KEYFRAMES = `
  @keyframes stamp-pop {
    0%   { transform: scale(0.4) rotate(-8deg); opacity: 0; }
    60%  { transform: scale(1.25) rotate(4deg);  opacity: 1; }
    80%  { transform: scale(0.92) rotate(-2deg); }
    100% { transform: scale(1)    rotate(0deg);  }
  }
  @keyframes stamp-pulse {
    0%, 100% { box-shadow: 0 4px 12px rgba(249,115,22,0.4); }
    50%       { box-shadow: 0 4px 28px rgba(249,115,22,0.85); }
  }
  @keyframes reward-enter {
    0%   { opacity: 0; transform: translateY(24px) scale(0.95); }
    100% { opacity: 1; transform: translateY(0)    scale(1);    }
  }
  @keyframes counter-pop {
    0%   { transform: scale(1);    }
    40%  { transform: scale(1.35); }
    100% { transform: scale(1);    }
  }
`

export default function PassDisplay({ pass: initialPass }: { pass: Pass }) {
  const [pass, setPass]               = useState(initialPass)
  const [time, setTime]               = useState('')
  const [newStampIdx, setNewStampIdx] = useState<number | null>(null)
  const [justStamped, setJustStamped] = useState(false)

  // Clock
  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Keep a ref to latest pass state so the interval closure doesn't go stale
  const passRef = useRef(pass)
  useEffect(() => { passRef.current = pass }, [pass])

  // Poll every 4 seconds for stamp updates
  useEffect(() => {
    const id = setInterval(async () => {
      const res = await fetch(`/api/pass/${passRef.current.id}`)
      if (!res.ok) return
      const data = await res.json()
      const updated = data.pass
      if (
        updated.current_stamps !== passRef.current.current_stamps ||
        updated.reward_available !== passRef.current.reward_available
      ) {
        // Animate the newly filled stamp slot
        if (updated.current_stamps > passRef.current.current_stamps) {
          setNewStampIdx(updated.current_stamps - 1)
          setTimeout(() => setNewStampIdx(null), 700)
        }
        setPass((prev) => ({
          ...prev,
          current_stamps: updated.current_stamps,
          reward_available: updated.reward_available,
        }))
        setJustStamped(true)
        setTimeout(() => setJustStamped(false), 2000)
      }
    }, 4000)

    return () => clearInterval(id)
  }, [])

  const stamps   = pass.current_stamps
  const required = pass.promotions.stamps_required
  const cols     = Math.min(required, 5)

  return (
    <>
      <style>{KEYFRAMES}</style>
      <main
        className="min-h-screen flex flex-col"
        style={{ background: 'linear-gradient(160deg, #1c0a00 0%, #3d1505 50%, #7c2d12 100%)' }}
      >
        {/* Header */}
        <div className="flex justify-between items-start px-6 pt-10 pb-4">
          <div>
            <p className="text-orange-300 text-xs font-bold uppercase tracking-widest">
              {pass.promotions.businesses.name}
            </p>
            <p className="text-white text-xl font-black mt-1">{pass.promotions.title}</p>
          </div>
          <div className="text-right">
            <p className="text-orange-300 text-sm font-bold tabular-nums">{time}</p>
            <p className="text-orange-500 text-lg mt-0.5">☕</p>
          </div>
        </div>

        {/* Customer name */}
        <div className="px-6 pb-6">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-1">
            Loyalty Member
          </p>
          <p className="text-white text-3xl font-black">{pass.customers.name}</p>
        </div>

        {/* Divider */}
        <div className="mx-6 border-t border-white/10 mb-6" />

        {/* Stamps or reward */}
        <div className="px-6 flex-1">
          {pass.reward_available ? (
            <div
              className="rounded-3xl p-6 text-center"
              style={{
                background: 'linear-gradient(135deg, #f97316, #fbbf24)',
                animation: 'reward-enter 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
              }}
            >
              <p className="text-5xl mb-2">🎉</p>
              <p className="text-white text-2xl font-black">Reward Ready!</p>
              <p className="text-white/80 font-semibold mt-1">{pass.promotions.reward_name}</p>
              <p className="text-white/60 text-sm mt-2">Show this to your barista</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <p
                  className="text-sm font-bold"
                  style={{
                    color: justStamped ? '#fb923c' : '#fed7aa',
                    animation: justStamped ? 'counter-pop 0.4s ease-out' : undefined,
                  }}
                >
                  {stamps} of {required} stamps
                </p>
                <p className="text-orange-300 text-sm font-medium">
                  {required - stamps} more to go
                </p>
              </div>

              {/* Stamp grid */}
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
              >
                {Array.from({ length: required }, (_, i) => {
                  const filled    = i < stamps
                  const isNew     = i === newStampIdx
                  const isLatest  = filled && i === stamps - 1 && !isNew

                  return (
                    <div
                      key={i}
                      className="aspect-square rounded-2xl flex items-center justify-center text-2xl"
                      style={
                        filled
                          ? {
                              background: 'linear-gradient(135deg, #f97316, #fbbf24)',
                              boxShadow: '0 4px 12px rgba(249,115,22,0.4)',
                              animation: isNew
                                ? 'stamp-pop 0.6s cubic-bezier(0.34,1.56,0.64,1) both'
                                : isLatest
                                ? 'stamp-pulse 2s ease-in-out infinite'
                                : undefined,
                            }
                          : {
                              background: 'rgba(255,255,255,0.08)',
                              border: '2px solid rgba(255,255,255,0.12)',
                            }
                      }
                    >
                      <span style={{ opacity: filled ? 1 : 0.25 }}>☕</span>
                    </div>
                  )
                })}
              </div>

              <p className="text-orange-300/60 text-xs text-center mt-5 font-medium">
                Earn {pass.promotions.reward_name} after {required} stamps
              </p>
            </>
          )}
        </div>

        {/* QR barcode */}
        <div className="flex flex-col items-center px-6 pt-8 pb-4">
          <div className="bg-white p-4 rounded-3xl shadow-2xl">
            <QRCodeSVG value={pass.barcode_value} size={190} fgColor="#1c0a00" />
          </div>
          <p className="text-orange-300/50 text-xs mt-4 text-center font-medium">
            Show this QR code to your barista
          </p>
        </div>

        {/* Save hint */}
        <div className="px-6 pb-10 text-center">
          <p className="text-white/20 text-xs font-medium">
            Tap Share → Add to Home Screen to save this pass
          </p>
        </div>
      </main>
    </>
  )
}
