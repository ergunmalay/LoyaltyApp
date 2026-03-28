import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase-server'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const db = createServiceClient()

  const { data: staffUser } = await db
    .from('staff_users')
    .select('*, businesses(*)')
    .eq('id', user.id)
    .single()

  if (!staffUser || !staffUser.businesses) redirect('/auth/login')

  const { data: promotion } = await db
    .from('promotions')
    .select('*')
    .eq('business_id', staffUser.business_id)
    .eq('is_active', true)
    .maybeSingle()

  return (
    <SettingsClient
      business={staffUser.businesses}
      staffUser={{ id: staffUser.id, name: staffUser.name, email: staffUser.email, role: staffUser.role }}
      promotion={promotion}
    />
  )
}
