import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/waiter/tables?restaurantId=xxx — table grid with active orders
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const restaurantId = searchParams.get('restaurantId')

    const supabase = await createClient()

    const { data: tables, error } = await supabase
        .from('tables')
        .select(`
      *,
      orders(id, status, total_amount, created_at)
    `)
        .eq('restaurant_id', restaurantId!)
        .eq('active', true)
        .order('table_number', { ascending: true })

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })

    // Annotate each table with its latest active order
    const enriched = tables.map(table => {
        const activeOrders = (table.orders as { status: string; id: string; total_amount: number; created_at: string }[])
            ?.filter(o => !['completed', 'cancelled'].includes(o.status)) ?? []
        return {
            ...table,
            hasActiveOrder: activeOrders.length > 0,
            hasReadyOrder: activeOrders.some(o => o.status === 'ready'),
            activeOrders,
        }
    })

    return NextResponse.json({ success: true, data: enriched })
}

// PATCH /api/waiter/tables — mark order as served or complete payment
export async function PATCH(req: NextRequest) {
    const body = await req.json()
    const { orderId, action } = body // action: 'serve' | 'complete'

    const supabase = await createClient()

    const statusMap: Record<string, string> = {
        serve: 'served',
        complete: 'completed',
    }

    const newStatus = statusMap[action]
    if (!newStatus) return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 })

    const updatePayload: Record<string, string> = { status: newStatus }
    if (action === 'complete') updatePayload.payment_status = 'paid'

    const { data, error } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', orderId)
        .select('*, tables(table_number)')
        .single()

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })

    return NextResponse.json({ success: true, data })
}
