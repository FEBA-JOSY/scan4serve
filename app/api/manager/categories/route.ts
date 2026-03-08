import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// Single-source route handlers for manager categories
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const restaurantId = searchParams.get('restaurantId')

    if (!restaurantId) {
        return NextResponse.json({ success: false, message: 'Missing restaurantId' }, { status: 400 })
    }

    try {
        const categories = await prisma.category.findMany({ where: { restaurantId }, orderBy: { displayOrder: 'asc' } })

        // Automatic cleanup of duplicates if they exist (prevents repeat UI issue)
        const seen = new Map<string, string>()
        const cleanCategories: typeof categories = []
        let hasDuplicates = false

        for (const cat of categories) {
            const key = cat.name.trim().toLowerCase()
            if (seen.has(key)) {
                const originalId = seen.get(key)!
                hasDuplicates = true
                // Update items in background or synchronously? 
                // Let's do it synchronously here to ensure consistency
                await prisma.menuItem.updateMany({
                    where: { categoryId: cat.id },
                    data: { categoryId: originalId }
                })
                await prisma.category.delete({ where: { id: cat.id } })
            } else {
                seen.set(key, cat.id)
                cleanCategories.push(cat)
            }
        }

        return NextResponse.json({ success: true, data: hasDuplicates ? cleanCategories : categories })
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err?.message ?? 'Unknown error' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    const body = await req.json()
    const { restaurantId, name, action, categories } = body ?? {}

    try {
        if (action === 'seed') {
            if (!restaurantId || !Array.isArray(categories)) {
                return NextResponse.json({ success: false, message: 'Invalid seed payload' }, { status: 400 })
            }

            // Check if any categories already exist for this restaurant
            const existingCount = await prisma.category.count({ where: { restaurantId } })
            if (existingCount > 0) {
                return NextResponse.json({ success: true, message: 'Categories already exist, skipping seed' })
            }

            const created = await Promise.all(
                categories.map((n: string, idx: number) =>
                    prisma.category.create({ data: { restaurantId, name: n, displayOrder: idx } })
                )
            )
            return NextResponse.json({ success: true, data: created })
        }

        if (!restaurantId || !name) {
            return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 })
        }

        const category = await prisma.category.create({ data: { restaurantId, name } })
        return NextResponse.json({ success: true, data: category }, { status: 201 })
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err?.message ?? 'Unknown error' }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, message: 'Missing id' }, { status: 400 })

    try {
        await prisma.category.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err?.message ?? 'Unknown error' }, { status: 500 })
    }
}
