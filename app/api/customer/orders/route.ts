import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/customer/orders — place a new order
export async function POST(req: NextRequest) {
    const body = await req.json()
    const { restaurant_id, table_id, items, special_instructions } = body

    if (!restaurant_id || !table_id || !items?.length) {
        return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify restaurant subscription
    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('subscription_status, is_active')
        .eq('id', restaurant_id)
        .single()

    if (!restaurant?.is_active || restaurant.subscription_status === 'expired') {
        return NextResponse.json({ success: false, message: 'Restaurant cannot accept orders' }, { status: 403 })
    }

    // Calculate total
    const total_amount = (items as { price: number; quantity: number }[])
        .reduce((sum, item) => sum + item.price * item.quantity, 0)

    const { data: order, error } = await supabase
        .from('orders')
        .insert({
            restaurant_id,
            table_id,
            items,
            total_amount,
            special_instructions,
            status: 'placed',
            payment_status: 'pending',
            priority: 0,
        })
        .select('*, tables(table_number)')
        .single()

    if (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: order }, { status: 201 })
}

// GET /api/customer/orders?orderId=xxx — track order status
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
        return NextResponse.json({ success: false, message: 'orderId required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: order } = await supabase
        .from('orders')
        .select('id, status, payment_status, items, total_amount, estimated_time_minutes, created_at, updated_at')
        .eq('id', orderId)
        .single()

    if (!order) {
        return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: order })
}
