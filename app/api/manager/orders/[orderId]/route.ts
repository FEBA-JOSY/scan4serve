import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// PATCH /api/manager/orders/[orderId]
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ orderId: string }> }
) {
    const { orderId } = await params
    const body = await req.json()
    const { status } = body

    if (!orderId) {
        return NextResponse.json({ success: false, message: 'orderId required' }, { status: 400 })
    }

    if (!status) {
        return NextResponse.json({ success: false, message: 'status required' }, { status: 400 })
    }

    const validStatuses = ['placed', 'preparing', 'ready', 'served', 'completed']
    if (!validStatuses.includes(status)) {
        return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 })
    }

    try {
        const order = await prisma.order.update({
            where: { id: orderId },
            data: { status, updatedAt: new Date() },
            select: {
                id: true,
                tableId: true,
                items: true,
                totalAmount: true,
                status: true,
                paymentStatus: true,
                createdAt: true,
                table: {
                    select: {
                        tableNumber: true
                    }
                }
            }
        })

        return NextResponse.json({
            success: true,
            data: {
                id: order.id,
                tableNumber: order.table?.tableNumber || 0,
                items: Array.isArray(order.items) ? order.items : [],
                totalAmount: order.totalAmount,
                status: order.status,
                paymentStatus: order.paymentStatus,
                createdAt: order.createdAt
            }
        })
    } catch (error) {
        console.error('Error updating order:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to update order' },
            { status: 500 }
        )
    }
}
