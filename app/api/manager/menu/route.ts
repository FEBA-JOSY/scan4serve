import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/manager/menu?restaurantId=xxx
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const restaurantId = searchParams.get('restaurantId')

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('menu_items')
        .select('*, categories(name)')
        .eq('restaurant_id', restaurantId!)
        .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })

    return NextResponse.json({ success: true, data })
}

// POST /api/manager/menu — create menu item
export async function POST(req: NextRequest) {
    const body = await req.json()
    const { restaurant_id, category_id, name, description, price, image_url, is_veg, prep_time_minutes } = body

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('menu_items')
        .insert({ restaurant_id, category_id, name, description, price, image_url, is_veg, prep_time_minutes, available: true })
        .select()
        .single()

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })

    return NextResponse.json({ success: true, data }, { status: 201 })
}

// PATCH /api/manager/menu — update menu item
export async function PATCH(req: NextRequest) {
    const body = await req.json()
    const { id, ...updates } = body

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('menu_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })

    return NextResponse.json({ success: true, data })
}

// DELETE /api/manager/menu?id=xxx
export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    const supabase = await createClient()

    const { error } = await supabase.from('menu_items').delete().eq('id', id!)

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })

    return NextResponse.json({ success: true, message: 'Item deleted' })
}
