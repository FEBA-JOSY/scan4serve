import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/manager/analytics?restaurantId=xxx&date=2025-03-01
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const restaurantId = searchParams.get('restaurantId')
    const date = searchParams.get('date') ?? new Date().toISOString().split('T')[0]

    const supabase = await createClient()

    const startOfDay = `${date}T00:00:00.000Z`
    const endOfDay = `${date}T23:59:59.999Z`

    // Today's orders
    const { data: todayOrders } = await supabase
        .from('orders')
        .select('id, total_amount, status, items, created_at')
        .eq('restaurant_id', restaurantId!)
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay)

    const orders = todayOrders ?? []
    const totalOrders = orders.length
    const revenueToday = orders
        .filter(o => ['served', 'completed'].includes(o.status))
        .reduce((sum, o) => sum + (o.total_amount ?? 0), 0)

    // Best selling items (from JSONB items array)
    const itemCountMap: Record<string, { name: string; count: number; revenue: number }> = {}
    orders.forEach(order => {
        const items = order.items as { name: string; quantity: number; price: number }[]
        items?.forEach(item => {
            if (!itemCountMap[item.name]) itemCountMap[item.name] = { name: item.name, count: 0, revenue: 0 }
            itemCountMap[item.name].count += item.quantity
            itemCountMap[item.name].revenue += item.price * item.quantity
        })
    })
    const bestSellers = Object.values(itemCountMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

    // Peak hours (group by hour)
    const hourMap: Record<number, number> = {}
    orders.forEach(order => {
        const hour = new Date(order.created_at).getHours()
        hourMap[hour] = (hourMap[hour] ?? 0) + 1
    })
    const peakHours = Object.entries(hourMap)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => b.count - a.count)

    // All-time revenue
    const { data: allOrders } = await supabase
        .from('orders')
        .select('total_amount, status')
        .eq('restaurant_id', restaurantId!)
        .in('status', ['served', 'completed'])

    const totalRevenue = (allOrders ?? []).reduce((sum, o) => sum + (o.total_amount ?? 0), 0)

    return NextResponse.json({
        success: true,
        data: { totalOrders, revenueToday, totalRevenue, bestSellers, peakHours },
    })
}
