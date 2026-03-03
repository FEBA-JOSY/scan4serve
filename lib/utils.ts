import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { OrderStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount)
}

export function formatDateTime(date: string): string {
    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    }).format(new Date(date))
}

export function formatTime(date: string): string {
    return new Intl.DateTimeFormat('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    }).format(new Date(date))
}

export function getOrderStatusColor(status: OrderStatus): string {
    const map: Record<OrderStatus, string> = {
        placed: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        accepted: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        preparing: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        ready: 'bg-green-500/20 text-green-400 border-green-500/30',
        served: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        completed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
        cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
    }
    return map[status]
}

export function getOrderStatusLabel(status: OrderStatus): string {
    const map: Record<OrderStatus, string> = {
        placed: 'Order Placed',
        accepted: 'Accepted',
        preparing: 'Preparing',
        ready: 'Ready',
        served: 'Served',
        completed: 'Completed',
        cancelled: 'Cancelled',
    }
    return map[status]
}

export function minutesAgo(date: string): number {
    return Math.floor((Date.now() - new Date(date).getTime()) / 60000)
}
