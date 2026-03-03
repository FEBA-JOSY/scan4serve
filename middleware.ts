import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { UserRole } from '@/types'

const ROLE_ROUTES: Record<string, UserRole[]> = {
    '/superadmin': ['superadmin'],
    '/admin': ['admin', 'superadmin'],
    '/manager': ['manager', 'admin', 'superadmin'],
    '/kitchen': ['kitchen', 'manager', 'admin', 'superadmin'],
    '/waiter': ['waiter', 'manager', 'admin', 'superadmin'],
}

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    const pathname = request.nextUrl.pathname

    // Public routes — always accessible
    if (pathname.startsWith('/menu') || pathname === '/login') {
        return supabaseResponse
    }

    // Not logged in → redirect to login
    if (!user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check role access
    const { data: dbUser } = await supabase
        .from('users')
        .select('role, is_active')
        .eq('id', user.id)
        .single()

    if (!dbUser || !dbUser.is_active) {
        return NextResponse.redirect(new URL('/login?error=account_disabled', request.url))
    }

    const routeEntry = Object.entries(ROLE_ROUTES).find(([route]) =>
        pathname.startsWith(route)
    )

    if (routeEntry) {
        const [, allowedRoles] = routeEntry
        if (!allowedRoles.includes(dbUser.role as UserRole)) {
            return NextResponse.redirect(new URL('/login?error=unauthorized', request.url))
        }
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
