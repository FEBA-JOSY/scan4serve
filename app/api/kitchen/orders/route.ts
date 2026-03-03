import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/kitchen/orders?restaurantId=xxx — live order queue
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const restaurantId = searchParams.get('restaurantId')

    const supabase = await createClient()

    const { data: orders, error } = await supabase
        .from('orders')
        .select('*, tables(table_number)')
        .eq('restaurant_id', restaurantId!)
        .in('status', ['placed', 'accepted', 'preparing'])
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })

    return NextResponse.json({ success: true, data: orders })
}

// PATCH /api/kitchen/orders — update order status
export async function PATCH(req: NextRequest) {
    const body = await req.json()
    const { orderId, status, estimated_time_minutes } = body

    const supabase = await createClient()

    const updatePayload: Record<string, unknown> = { status }
    if (estimated_time_minutes !== undefined) updatePayload.estimated_time_minutes = estimated_time_minutes

    const { data, error } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', orderId)
        .select()
        .single()

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })

    return NextResponse.json({ success: true, data })
}
