'use client'

import { useState, useRef, useEffect } from 'react'

interface Pass {
  id: string
  current_stamps: number
  reward_available: boolean
  customers: { name: string; email: string }
  promotions: { title: string; stamps_required: number; reward_name: string }
}

export default function ScanPage() {
  const [scanning, setScanning] = useState(false)
  const [pass, setPass] = useState<Pass | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [actionMsg, setActionMsg] = useState('')
  const [manualCode, setManualCode] = useState('')
  const [confirmRedeem, setConfirmRedeem] = useState(false)
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null)
  // Prevents concurrent API calls from rapid taps
  const actionInFlight = useRef(false)

  useEffect(() => {
    return () => {
      scannerRef.current?.stop().catch(() => {})
    }
  }, [])

  const fetchPass = async (barcode: string) => {
    setLoading(true)
    setError('')
    setPass(null)
    setActionMsg('')
    const res = await fetch(`/api/wallet-passes/${encodeURIComponent(barcode)}`)
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Pass not found')
    } else {
      setPass(data)
    }
    setLoading(false)
  }

  const startScanner = async () => {
    setError('')
    setScanning(true)
    await new Promise((r) => requestAnimationFrame(r))

    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 15, qrbox: { width: 240, height: 240 }, aspectRatio: 1.0 },
        async (decoded: string) => {
          await scanner.stop().catch(() => {})
          setScanning(false)
          fetchPass(decoded)
        },
        undefined
      )
    } catch (err) {
      setScanning(false)
      const msg = err instanceof Error ? err.message : String(err)
      // Friendly message for the most common failure (camera permission denied)
      if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('notallowed')) {
        setError('Camera access was denied. Please allow camera access in your browser settings, or enter the barcode manually below.')
      } else {
        setError(`Camera error: ${msg}`)
      }
    }
  }

  const stopScanner = async () => {
    await scannerRef.current?.stop().catch(() => {})
    setScanning(false)
  }

  const addStamp = async () => {
    if (!pass || actionInFlight.current) return
    actionInFlight.current = true
    setLoading(true)
    setActionMsg('')
    setError('')
    try {
      const res = await fetch('/api/stamps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_pass_id: pass.id }),
      })
      const data = await res.json()
      if (res.ok) {
        setPass(data.pass)
        setActionMsg('Stamp added!')
      } else {
        setError(data.error || 'Failed to add stamp')
      }
    } finally {
      actionInFlight.current = false
      setLoading(false)
    }
  }

  const redeemReward = async () => {
    if (!pass || actionInFlight.current) return
    actionInFlight.current = true
    setConfirmRedeem(false)
    setLoading(true)
    setActionMsg('')
    setError('')
    try {
      const res = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_pass_id: pass.id }),
      })
      const data = await res.json()
      if (res.ok) {
        setPass(data.pass)
        setActionMsg('Reward redeemed!')
      } else {
        setError(data.error || 'Failed to redeem')
      }
    } finally {
      actionInFlight.current = false
      setLoading(false)
    }
  }

  const reset = () => {
    setPass(null)
    setError('')
    setActionMsg('')
    setManualCode('')
    setConfirmRedeem(false)
  }

  return (
    <>
      {/* ── Full-screen camera overlay ── */}
      {scanning && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex-1 relative">
            <div id="qr-reader" className="w-full h-full" />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-60 h-60">
                <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
              </div>
            </div>
          </div>
          <div className="px-6 py-8 text-center">
            <p className="text-white/60 text-sm mb-4">Point at a customer&apos;s pass QR code</p>
            <button
              onClick={stopScanner}
              className="w-full max-w-sm mx-auto py-4 bg-white/10 border border-white/20 text-white font-semibold rounded-2xl"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Redeem confirmation overlay ── */}
      {confirmRedeem && pass && (
        <div className="fixed inset-0 z-40 bg-black/60 flex items-end justify-center p-6">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-4">
            <div className="text-center">
              <p className="text-2xl mb-2">🎉</p>
              <h2 className="text-xl font-black text-stone-900">Confirm Redemption</h2>
              <p className="text-stone-500 text-sm font-medium mt-1">
                Redeem{' '}
                <span className="font-bold text-stone-800">{pass.promotions.reward_name}</span>
                {' '}for{' '}
                <span className="font-bold text-stone-800">{pass.customers.name}</span>?
              </p>
              <p className="text-xs text-stone-400 mt-2 font-medium">
                This will reset their stamp count to zero.
              </p>
            </div>
            <button
              onClick={redeemReward}
              className="w-full py-4 bg-green-500 hover:bg-green-600 text-white text-lg font-black rounded-2xl transition-colors"
            >
              Yes, Redeem Reward
            </button>
            <button
              onClick={() => setConfirmRedeem(false)}
              className="w-full py-3 text-stone-400 font-semibold rounded-2xl hover:text-stone-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Main page ── */}
      <main className="min-h-screen p-6 max-w-md mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <span className="text-2xl">☕</span>
            <h1 className="text-2xl font-black text-stone-900">Staff Scanner</h1>
          </div>
          <a href="/dashboard" className="text-sm text-orange-500 font-bold hover:underline">
            Dashboard
          </a>
        </div>

        {/* ── Lookup UI ── */}
        {!pass && !loading && !scanning && (
          <div className="space-y-4">
            <button
              onClick={startScanner}
              className="w-full py-5 bg-orange-500 hover:bg-orange-600 text-white text-xl font-black rounded-2xl flex items-center justify-center gap-3 transition-colors"
            >
              <span className="text-2xl">📷</span> Start Camera
            </button>

            <div className="bg-white rounded-3xl p-5 shadow-sm border border-orange-100">
              <p className="text-sm font-semibold text-stone-500 mb-3">Or enter barcode manually</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && manualCode && fetchPass(manualCode)}
                  placeholder="Paste barcode value"
                  className="flex-1 px-4 py-3 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-orange-400 transition-colors"
                />
                <button
                  onClick={() => manualCode && fetchPass(manualCode)}
                  disabled={!manualCode}
                  className="px-5 py-3 bg-orange-500 text-white font-bold rounded-xl disabled:opacity-40"
                >
                  Find
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="text-red-600 font-medium text-sm">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="text-center py-16">
            <p className="text-stone-400 text-lg font-medium">Loading…</p>
          </div>
        )}

        {/* ── Pass found ── */}
        {pass && !loading && (
          <div className="space-y-4">
            {actionMsg && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                <p className="text-green-700 font-black text-xl">{actionMsg}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-orange-100">
              <h2 className="text-2xl font-black text-stone-900">{pass.customers.name}</h2>
              <p className="text-stone-400 text-sm font-medium mb-5">{pass.customers.email}</p>

              <div
                className="rounded-2xl p-5 text-center mb-4"
                style={{ background: 'linear-gradient(135deg, #fff7ed, #ffedd5)' }}
              >
                <p className="text-7xl font-black text-orange-500">{pass.current_stamps}</p>
                <p className="text-stone-500 text-lg font-semibold">
                  / {pass.promotions.stamps_required} stamps
                </p>
                <p className="text-xs text-stone-400 font-medium mt-1">{pass.promotions.title}</p>
              </div>

              {pass.reward_available && (
                <div
                  className="rounded-2xl p-4 text-center"
                  style={{ background: 'linear-gradient(135deg, #f97316, #fbbf24)' }}
                >
                  <p className="text-white font-black text-lg">🎉 Reward available!</p>
                  <p className="text-white/80 text-sm font-medium">{pass.promotions.reward_name}</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {!pass.reward_available && (
                <button
                  onClick={addStamp}
                  disabled={loading}
                  className="w-full py-5 bg-orange-500 hover:bg-orange-600 text-white text-2xl font-black rounded-2xl disabled:opacity-50 transition-colors"
                >
                  + Add Stamp ☕
                </button>
              )}

              {pass.reward_available && (
                <button
                  onClick={() => setConfirmRedeem(true)}
                  disabled={loading}
                  className="w-full py-5 bg-green-500 hover:bg-green-600 text-white text-2xl font-black rounded-2xl disabled:opacity-50 transition-colors"
                >
                  Redeem Reward 🎉
                </button>
              )}

              <a
                href={`/pass/${pass.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-4 border-2 border-orange-200 text-orange-500 font-bold rounded-2xl text-center hover:bg-orange-50 transition-colors"
              >
                Show Pass to Customer
              </a>

              <button
                onClick={reset}
                className="w-full py-4 text-stone-400 font-semibold rounded-2xl hover:text-stone-600"
              >
                Scan Another
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
