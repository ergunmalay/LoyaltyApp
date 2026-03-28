import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase-server'
import PassDisplay from './PassDisplay'

interface Props {
  params: Promise<{ passId: string }>
}

export default async function PassPage({ params }: Props) {
  const { passId } = await params
  const db = createServiceClient()

  const { data: pass } = await db
    .from('wallet_passes')
    .select('*, customers(*), promotions(*, businesses(*))')
    .eq('id', passId)
    .single()

  if (!pass) notFound()

  return <PassDisplay pass={pass} />
}
