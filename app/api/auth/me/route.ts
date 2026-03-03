import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 })
    }

    const { data: userData } = await supabase
        .from('users')
        .select('*, restaurants(id, name, subscription_status, is_active)')
        .eq('id', user.id)
        .single()

    return NextResponse.json({ success: true, data: userData })
}
