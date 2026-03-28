import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase-server'
import JoinForm from './JoinForm'

interface Props {
  params: Promise<{ businessSlug: string }>
}

export default async function JoinPage({ params }: Props) {
  const { businessSlug } = await params
  const db = createServiceClient()

  const { data: business } = await db
    .from('businesses')
    .select('*')
    .eq('slug', businessSlug)
    .single()

  if (!business) notFound()

  const { data: promotion } = await db
    .from('promotions')
    .select('*')
    .eq('business_id', business.id)
    .eq('is_active', true)
    .maybeSingle()

  if (!promotion) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{business.name}</h1>
          <p className="text-gray-500 mt-3">No active promotion at this time.</p>
        </div>
      </main>
    )
  }

  return <JoinForm business={business} promotion={promotion} />
}
