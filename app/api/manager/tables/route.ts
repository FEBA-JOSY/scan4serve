import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/manager/tables?restaurantId=xxx
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const restaurantId = searchParams.get('restaurantId')

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', restaurantId!)
        .order('table_number', { ascending: true })

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })

    return NextResponse.json({ success: true, data })
}

// POST /api/manager/tables — add a table and generate QR URL
export async function POST(req: NextRequest) {
    const body = await req.json()
    const { restaurant_id, table_number } = body

    const supabase = await createClient()

    // Build QR URL (points to the customer menu page)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const qr_code_url = `${baseUrl}/menu/${restaurant_id}/${table_number}`

    const { data, error } = await supabase
        .from('tables')
        .insert({ restaurant_id, table_number, qr_code_url, active: true })
        .select()
        .single()

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })

    return NextResponse.json({ success: true, data }, { status: 201 })
}

// DELETE /api/manager/tables?id=xxx
export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    const supabase = await createClient()

    const { error } = await supabase.from('tables').delete().eq('id', id!)

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })

    return NextResponse.json({ success: true, message: 'Table deleted' })
}
