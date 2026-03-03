import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/customer/menu?restaurantId=xxx
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const restaurantId = searchParams.get('restaurantId')

    if (!restaurantId) {
        return NextResponse.json({ success: false, message: 'restaurantId required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify restaurant is active
    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id, name, logo_url, subscription_status, is_active')
        .eq('id', restaurantId)
        .eq('is_active', true)
        .single()

    if (!restaurant) {
        return NextResponse.json({ success: false, message: 'Restaurant not found or inactive' }, { status: 404 })
    }

    if (restaurant.subscription_status === 'expired') {
        return NextResponse.json({ success: false, message: 'Restaurant subscription expired' }, { status: 403 })
    }

    // Get categories + items
    const { data: categories } = await supabase
        .from('categories')
        .select('*, menu_items(*)')
        .eq('restaurant_id', restaurantId)
        .order('display_order', { ascending: true })

    return NextResponse.json({ success: true, data: { restaurant, categories } })
}
