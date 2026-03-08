import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/customer/orders/[orderId] — get specific order details
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        const { orderId } = await params
        
        if (!orderId || orderId === 'undefined' || orderId === 'null') {
            return NextResponse.json({ 
                success: false, 
                message: 'orderId is required',
                received: orderId
            }, { status: 400 })
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                status: true,
                paymentStatus: true,
                items: true,
                totalAmount: true,
                estimatedTimeMinutes: true,
                createdAt: true,
                updatedAt: true,
                table: {
                    select: {
                        tableNumber: true
                    }
                }
            }
        })

        if (!order) {
            return NextResponse.json({ 
                success: false, 
                message: `Order ${orderId} not found` 
            }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            data: {
                id: order.id,
                status: order.status,
                paymentStatus: order.paymentStatus,
                items: Array.isArray(order.items) ? order.items : [],
                totalAmount: order.totalAmount,
                estimatedTimeMinutes: order.estimatedTimeMinutes,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
                tableNumber: order.table?.tableNumber
            }
        })
    } catch (error: any) {
        return NextResponse.json({ 
            success: false, 
            message: error.message || 'Failed to fetch order' 
        }, { status: 500 })
    }
}
