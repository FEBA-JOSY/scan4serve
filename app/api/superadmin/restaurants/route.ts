import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/superadmin/restaurants — all restaurants with stats
export async function GET() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })

    return NextResponse.json({ success: true, data })
}

// POST /api/superadmin/restaurants — create a new restaurant
export async function POST(req: NextRequest) {
    const body = await req.json()
    const { name, email, phone, address, plan, adminEmail, adminPassword, adminName } = body

    const admin = createAdminClient()

    // Create restaurant
    const { data: restaurant, error: restError } = await admin
        .from('restaurants')
        .insert({ name, email, phone, address, plan, subscription_status: 'active', is_active: true })
        .select()
        .single()

    if (restError) return NextResponse.json({ success: false, message: restError.message }, { status: 500 })

    // Create admin auth user
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
    })

    if (authError || !authData.user) {
        await admin.from('restaurants').delete().eq('id', restaurant.id)
        return NextResponse.json({ success: false, message: authError?.message ?? 'Admin creation failed' }, { status: 500 })
    }

    // Insert admin user record
    const { error: userError } = await admin.from('users').insert({
        id: authData.user.id,
        email: adminEmail,
        name: adminName,
        role: 'admin',
        restaurant_id: restaurant.id,
        is_active: true,
    })

    if (userError) {
        await admin.auth.admin.deleteUser(authData.user.id)
        await admin.from('restaurants').delete().eq('id', restaurant.id)
        return NextResponse.json({ success: false, message: userError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: restaurant }, { status: 201 })
}

// PATCH /api/superadmin/restaurants — toggle active/subscription status
export async function PATCH(req: NextRequest) {
    const body = await req.json()
    const { id, is_active, subscription_status, subscription_expires_at, plan } = body

    const admin = createAdminClient()

    const updates: Record<string, unknown> = {}
    if (is_active !== undefined) updates.is_active = is_active
    if (subscription_status) updates.subscription_status = subscription_status
    if (subscription_expires_at) updates.subscription_expires_at = subscription_expires_at
    if (plan) updates.plan = plan

    const { data, error } = await admin
        .from('restaurants')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })

    // Log audit
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await admin.from('audit_logs').insert({
        user_id: user?.id,
        action: `restaurant_updated:${id}`,
        details: updates,
    })

    return NextResponse.json({ success: true, data })
}
