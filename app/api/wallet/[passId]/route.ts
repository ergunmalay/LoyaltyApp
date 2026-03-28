import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

/**
 * Mock Apple Wallet pass endpoint.
 *
 * For a real implementation you need:
 *  1. An Apple Developer account with a "Pass Type ID" certificate
 *  2. A .pkpass bundle (ZIP) containing:
 *     - pass.json      (the pass data)
 *     - manifest.json  (SHA1 hashes of all files)
 *     - signature      (DER-encoded PKCS#7 signature of manifest)
 *     - icon.png / logo.png
 *  3. A library like `passkit-generator` (npm) to build and sign the bundle
 *
 * This route returns a JSON representation of what the pass.json would contain,
 * served with the correct MIME type so the structure is clear for future integration.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ passId: string }> }
) {
  const { passId } = await params
  const db = createServiceClient()

  const { data: pass } = await db
    .from('wallet_passes')
    .select('*, customers(*), promotions(*, businesses(*))')
    .eq('id', passId)
    .single()

  if (!pass) {
    return NextResponse.json({ error: 'Pass not found' }, { status: 404 })
  }

  const businessName = (pass.promotions as { businesses: { name: string } }).businesses.name

  const passJson = {
    _mock: true,
    _note:
      'Real Apple Wallet requires a signed .pkpass bundle. See /app/api/wallet/[passId]/route.ts for instructions.',
    formatVersion: 1,
    passTypeIdentifier: 'pass.com.yourapp.loyalty',
    serialNumber: pass.serial_number,
    teamIdentifier: 'YOUR_APPLE_TEAM_ID',
    organizationName: businessName,
    description: pass.promotions.title,
    barcode: {
      message: pass.barcode_value,
      format: 'PKBarcodeFormatQR',
      messageEncoding: 'iso-8859-1',
    },
    storeCard: {
      headerFields: [
        {
          key: 'stamps',
          label: 'Stamps',
          value: `${pass.current_stamps} / ${pass.promotions.stamps_required}`,
        },
      ],
      primaryFields: [
        {
          key: 'reward',
          label: 'Reward',
          value: pass.promotions.reward_name,
        },
      ],
      secondaryFields: [
        {
          key: 'customer',
          label: 'Name',
          value: pass.customers.name,
        },
      ],
    },
    backgroundColor: 'rgb(0, 0, 0)',
    foregroundColor: 'rgb(255, 255, 255)',
    labelColor: 'rgb(180, 180, 180)',
  }

  return new NextResponse(JSON.stringify(passJson, null, 2), {
    headers: {
      // Use the real MIME type so iOS/macOS handle it (though unsigned, it won't install)
      'Content-Type': 'application/vnd.apple.pkpass',
      'Content-Disposition': `attachment; filename="loyaltypass-${pass.serial_number}.pkpass"`,
    },
  })
}
