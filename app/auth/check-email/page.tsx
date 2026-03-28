import Link from 'next/link'

export default function CheckEmailPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="text-6xl">📬</div>

        <div>
          <h1 className="text-3xl font-black text-stone-900">Check your email</h1>
          <p className="text-stone-500 mt-2 font-medium leading-relaxed">
            We sent you a confirmation link. Click it to activate your account,
            then sign in below.
          </p>
        </div>

        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 text-left">
          <p className="text-sm text-stone-500 font-medium">
            Didn&apos;t receive it? Check your spam folder, or{' '}
            <Link href="/auth/signup" className="text-orange-500 font-bold hover:underline">
              try signing up again
            </Link>
            .
          </p>
        </div>

        <Link
          href="/auth/login"
          className="block w-full py-4 bg-orange-500 hover:bg-orange-600 text-white text-lg font-bold rounded-2xl transition-colors"
        >
          Go to Sign In
        </Link>
      </div>
    </main>
  )
}
