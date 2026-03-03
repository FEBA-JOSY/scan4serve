'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { toast } from 'sonner'
import {
    ShieldAlert, Globe, Activity, Building2,
    Users, DollarSign, TrendingUp, Search,
    Plus, MoreVertical, CheckCircle2, XCircle,
    Loader2, BadgeCheck, AlertCircle, ArrowUpRight
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import type { Restaurant, User } from '@/types'

export default function SuperAdminDashboard() {
    const [profile, setProfile] = useState<User | null>(null)
    const [restaurants, setRestaurants] = useState<(Restaurant & { admin: User })[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        fetchProfile()
    }, [])

    async function fetchProfile() {
        try {
            const res = await fetch('/api/auth/me')
            const json = await res.json()
            if (json.success && json.data.role === 'superadmin') {
                setProfile(json.data)
                fetchRestaurants()
            } else {
                router.push('/login')
            }
        } catch (e) {
            toast.error('Auth failed')
        }
    }

    async function fetchRestaurants() {
        try {
            const res = await fetch('/api/superadmin/restaurants')
            const json = await res.json()
            if (json.success) {
                setRestaurants(json.data)
            }
        } finally {
            setLoading(false)
        }
    }

    async function toggleStatus(id: string, active: boolean) {
        try {
            const res = await fetch('/api/superadmin/restaurants', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ restaurantId: id, active: !active })
            })
            if (res.ok) {
                toast.success(active ? 'Restaurant deactivated' : 'Restaurant activated!')
                fetchRestaurants()
            }
        } catch (e) {
            toast.error('Status toggle failed')
        }
    }

    const filtered = restaurants.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.subdomain.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const stats = [
        { label: 'Total SaaS Revenue', value: formatCurrency(0), icon: DollarSign, color: 'text-green-500' },
        { label: 'Platform Restaurants', value: restaurants.length, icon: Building2, color: 'text-blue-500' },
        { label: 'Live Orders Now', value: 0, icon: Activity, color: 'text-orange-500' },
        { label: 'Total SaaS Users', value: 0, icon: Users, color: 'text-purple-500' },
    ]

    return (
        <div className="flex h-screen bg-gray-950 overflow-hidden">
            <Sidebar
                role="superadmin"
                userName={profile?.name || 'Super Admin'}
            />

            <main className="flex-1 flex flex-col min-w-0">
                <header className="h-16 flex items-center justify-between px-8 border-b border-gray-800/60 glass z-20">
                    <div className="flex items-center gap-3">
                        <ShieldAlert className="w-5 h-5 text-orange-500" />
                        <h2 className="text-xl font-bold text-white tracking-tight">Platform Command</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Platform Healthy</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {loading ? (
                        <div className="h-full flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-8 fade-in">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {stats.map(s => (
                                    <div key={s.label} className="glass-card p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-2 bg-gray-900 rounded-xl border border-gray-800">
                                                <s.icon className={cn("w-5 h-5", s.color)} />
                                            </div>
                                            <TrendingUp className="w-4 h-4 text-green-500" />
                                        </div>
                                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">{s.label}</p>
                                        <p className="text-2xl font-black text-white mt-1">{s.value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Management Area */}
                            <div className="glass-card p-8">
                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                                    <div>
                                        <h3 className="text-xl font-black text-white">Restaurant Directory</h3>
                                        <p className="text-xs text-gray-500 font-medium mt-1">Onboard and manage platform tenants</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                            <input
                                                placeholder="Find restaurant..."
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                className="bg-gray-950 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:border-orange-500/30 w-64"
                                            />
                                        </div>
                                        <button className="flex items-center gap-2 brand-gradient px-6 py-2.5 rounded-xl text-xs font-black text-white glow-orange-sm active:scale-95 transition-all">
                                            <Plus className="w-4 h-4" /> Onboard Restaurant
                                        </button>
                                    </div>
                                </div>

                                {/* Restaurants Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-gray-800">
                                                <th className="pb-4 text-[10px] font-black text-gray-500 uppercase tracking-widest px-4">Restaurant</th>
                                                <th className="pb-4 text-[10px] font-black text-gray-500 uppercase tracking-widest px-4">Admin</th>
                                                <th className="pb-4 text-[10px] font-black text-gray-500 uppercase tracking-widest px-4">Status</th>
                                                <th className="pb-4 text-[10px] font-black text-gray-500 uppercase tracking-widest px-4">Subscription</th>
                                                <th className="pb-4 text-[10px] font-black text-gray-500 uppercase tracking-widest px-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800/60">
                                            {filtered.map(res => (
                                                <tr key={res.id} className="group hover:bg-white/[0.02] transition-colors">
                                                    <td className="py-4 px-4 font-bold text-white">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center text-orange-500 border border-gray-800">
                                                                <Building2 className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm">{res.name}</p>
                                                                <p className="text-[10px] text-gray-600 font-medium">@{res.subdomain}.scan4serve.com</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-[8px] font-bold text-white uppercase italic">
                                                                {res.admin?.name?.slice(0, 2)}
                                                            </div>
                                                            <span className="text-xs text-gray-400 font-medium">{res.admin?.email}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <span className={cn(
                                                            "px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                                                            res.active ? "bg-green-600/10 text-green-500 border border-green-500/20" : "bg-red-600/10 text-red-500 border border-red-500/20"
                                                        )}>
                                                            {res.active ? 'Operational' : 'Deactivated'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[10px] font-black text-orange-400 uppercase tracking-tighter">Pro Monthly</span>
                                                            <span className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">Renewal: Sep 24</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => toggleStatus(res.id, res.active)}
                                                                className={cn(
                                                                    "p-2 rounded-lg transition-colors border",
                                                                    res.active ? "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white" : "bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500 hover:text-white"
                                                                )}
                                                            >
                                                                {res.active ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                                            </button>
                                                            <button className="p-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
                                                                <MoreVertical className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
