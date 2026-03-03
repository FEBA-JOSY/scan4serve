export type UserRole = 'superadmin' | 'admin' | 'manager' | 'submanager' | 'kitchen' | 'waiter'

export type OrderStatus = 'placed' | 'accepted' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled'

export type PaymentStatus = 'pending' | 'paid' | 'failed'

export type SubscriptionStatus = 'active' | 'expired' | 'suspended'

export type SubscriptionPlan = 'basic' | 'pro' | 'enterprise'

export interface Restaurant {
    id: string
    name: string
    email: string
    phone: string
    address: string
    logo_url?: string
    subscription_status: SubscriptionStatus
    plan: SubscriptionPlan
    subscription_expires_at?: string
    is_active: boolean
    created_at: string
}

export interface User {
    id: string
    name: string
    email: string
    role: UserRole
    restaurant_id?: string
    is_active: boolean
    created_by?: string
    created_at: string
}

export interface Table {
    id: string
    restaurant_id: string
    table_number: number
    qr_code_url: string
    active: boolean
    created_at: string
}

export interface Category {
    id: string
    restaurant_id: string
    name: string
    display_order: number
    created_at: string
}

export interface MenuItem {
    id: string
    restaurant_id: string
    category_id: string
    name: string
    description?: string
    price: number
    image_url?: string
    available: boolean
    prep_time_minutes?: number
    is_veg: boolean
    created_at: string
    category?: Category
}

export interface OrderItem {
    menu_item_id: string
    name: string
    price: number
    quantity: number
    special_instructions?: string
}

export interface Order {
    id: string
    restaurant_id: string
    table_id: string
    items: OrderItem[]
    total_amount: number
    status: OrderStatus
    payment_status: PaymentStatus
    special_instructions?: string
    priority: number
    estimated_time_minutes?: number
    created_at: string
    updated_at: string
    table?: Table
}

export interface AuditLog {
    id: string
    user_id: string
    action: string
    details?: Record<string, unknown>
    timestamp: string
    user?: User
}
