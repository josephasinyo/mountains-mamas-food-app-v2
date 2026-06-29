import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Supabase middleware — refreshes auth session on every request.
 * Also handles route protection for /admin/* and /company/* routes.
 */
export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refresh session — important for Server Components
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    const pathname = request.nextUrl.pathname;
    console.log(`[Middleware] Path: ${pathname}, User: ${user?.email || 'none'}, Error: ${userError?.message || 'none'}`);

    // Protect admin routes
    if (pathname.startsWith('/admin')) {
        if (!user) {
            const url = request.nextUrl.clone();
            url.pathname = '/admin/login';
            if (pathname !== '/admin/login' && pathname !== '/admin/reset-password') {
                return NextResponse.redirect(url);
            }
        } else {
            const role = user.user_metadata?.role?.toLowerCase();
            const isAdmin = role === 'admin' || user.email?.toLowerCase() === 'mountainmamascafe@gmail.com';
            const isStaff = role === 'staff';

            // Check if staff is suspended
            if (isStaff && user.user_metadata?.suspended) {
                if (pathname !== '/admin/login') {
                    // Sign them out or redirect to a suspended page. Let's redirect to login.
                    // To actually sign out we'd need to clear cookies, but redirecting to login is a start.
                    // Actually, if we just redirect to login they might get stuck. Let's redirect to a specific login error or just /admin/login.
                    const url = request.nextUrl.clone();
                    url.pathname = '/admin/login';
                    url.searchParams.set('error', 'Account is suspended.');
                    return NextResponse.redirect(url);
                }
            }

            if (!isAdmin && !isStaff && pathname !== '/admin/login') {
                const url = request.nextUrl.clone();
                url.pathname = '/admin/login';
                return NextResponse.redirect(url);
            }

            // Staff specific checks
            if (isStaff && pathname !== '/admin/login') {
                // 1. Force password reset if needed
                if (user.user_metadata?.needs_password_change && pathname !== '/admin/reset-password') {
                    const url = request.nextUrl.clone();
                    url.pathname = '/admin/reset-password';
                    return NextResponse.redirect(url);
                }

                // 2. Enforce accessible pages (if not resetting password)
                if (!user.user_metadata?.needs_password_change && pathname !== '/admin/reset-password') {
                    const accessiblePages: string[] = user.user_metadata?.accessible_pages || [];
                    
                    // We check if the current pathname starts with any of the allowed base routes.
                    // E.g., if accessiblePages has '/admin/orders', we allow '/admin/orders' and '/admin/orders/123'
                    // But wait, if they have '/admin', they have access to the dashboard.
                    // If the pathname is EXACTLY '/admin', we check if '/admin' is in the list.
                    
                    const isAllowed = accessiblePages.some(page => 
                        page === pathname || (page !== '/admin' && pathname.startsWith(page))
                    );

                    if (!isAllowed) {
                        const url = request.nextUrl.clone();
                        // Redirect to the first accessible page, or fallback to login
                        url.pathname = accessiblePages[0] || '/admin/login';
                        return NextResponse.redirect(url);
                    }
                }
            }
        }
    }

    // Protect company routes (except login/register/forgot-password/reset-password/activate)
    if (pathname.startsWith('/company') && 
        !pathname.startsWith('/company/login') && 
        !pathname.startsWith('/company/register') &&
        !pathname.startsWith('/company/forgot-password') &&
        !pathname.startsWith('/company/reset-password') &&
        !pathname.startsWith('/company/activate')) {
        if (!user) {
            const url = request.nextUrl.clone();
            url.pathname = '/company/login';
            return NextResponse.redirect(url);
        }
    }

    return supabaseResponse;
}
