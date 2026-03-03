import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/auth/register — create staff user (admin/manager/kitchen/waiter)
export async function POST(req: NextRequest) {
    const body = await req.json()
    const { email, password, name, role, restaurant_id, created_by } = body

    if (!email || !password || !name || !role) {
        return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Create auth user
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
    })

    if (authError || !authData.user) {
        return NextResponse.json({ success: false, message: authError?.message ?? 'Auth user creation failed' }, { status: 400 })
    }

    // Insert into users table
    const { data: user, error: dbError } = await admin
        .from('users')
        .insert({
            id: authData.user.id,
            email,
            name,
            role,
            restaurant_id: restaurant_id ?? null,
            created_by: created_by ?? null,
            is_active: true,
        })
        .select()
        .single()

    if (dbError) {
        // Rollback auth user on DB failure
        await admin.auth.admin.deleteUser(authData.user.id)
        return NextResponse.json({ success: false, message: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: user }, { status: 201 })
}
