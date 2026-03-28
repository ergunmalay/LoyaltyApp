import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-10">
        <div>
          <div className="text-7xl mb-4">☕</div>
          <h1 className="text-5xl font-black tracking-tight text-stone-900">
            LoyaltyPass
          </h1>
          <p className="mt-4 text-lg text-stone-500 font-medium">
            Digital stamp cards for your coffee shop.
            <br />
            No paper. No app. Just love.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/auth/signup"
            className="block w-full py-4 px-6 bg-orange-500 hover:bg-orange-600 text-white text-lg font-bold rounded-2xl transition-colors"
          >
            Get Started Free
          </Link>
          <Link
            href="/auth/login"
            className="block w-full py-4 px-6 bg-white border-2 border-orange-200 text-orange-600 text-lg font-bold rounded-2xl hover:bg-orange-50 transition-colors"
          >
            Sign In
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-orange-100">
            <div className="text-3xl mb-2">🎯</div>
            <p className="text-sm font-semibold text-stone-600">Create promotions</p>
          </div>
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-orange-100">
            <div className="text-3xl mb-2">📱</div>
            <p className="text-sm font-semibold text-stone-600">Digital passes</p>
          </div>
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-orange-100">
            <div className="text-3xl mb-2">⭐</div>
            <p className="text-sm font-semibold text-stone-600">Reward loyalty</p>
          </div>
        </div>
      </div>
    </main>
  )
}
