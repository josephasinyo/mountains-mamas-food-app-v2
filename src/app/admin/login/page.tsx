'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mountain, Loader2, Eye, EyeOff } from 'lucide-react';
import { sendAdminPasswordReset } from './actions';

export default function AdminLoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-purple-50"><Loader2 className="size-8 animate-spin text-violet-600" /></div>}>
            <AdminLoginForm />
        </Suspense>
    );
}

function AdminLoginForm() {
    const [mode, setMode] = useState<'login' | 'forgot'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const router = useRouter();
    const searchParams = useSearchParams();

    // Check if there's an error passed from middleware (e.g. suspended account)
    useEffect(() => {
        const err = searchParams.get('error');
        if (err) {
            setError(err);
        }
    }, [searchParams]);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { data, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
            return;
        }

        const role = data.user?.user_metadata?.role;
        const suspended = data.user?.user_metadata?.suspended;

        if (role !== 'admin' && role !== 'staff') {
            setError('Access denied. Admin privileges required.');
            await supabase.auth.signOut();
            setLoading(false);
            return;
        }

        if (suspended) {
            setError('Your account has been suspended. Please contact the administrator.');
            await supabase.auth.signOut();
            setLoading(false);
            return;
        }

        // Middleware handles the redirects for password change and accessible pages
        router.push('/admin');
        router.refresh();
    }

    async function handleForgotPassword(e: React.FormEvent) {
        e.preventDefault();
        if (!email) {
            setError('Please enter your email address.');
            return;
        }
        setLoading(true);
        setError('');
        setSuccessMessage('');

        const result = await sendAdminPasswordReset(email, window.location.origin);

        if (!result.success) {
            setError(result.error || 'Failed to send password reset email.');
        } else {
            setSuccessMessage('A password reset link has been sent to your email.');
        }
        setLoading(false);
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-purple-50 px-4">
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-200/30 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl" />
            </div>

            <Card className="w-full max-w-sm relative z-10 shadow-xl shadow-violet-100/50 border-violet-100/50">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-3 flex items-center justify-center size-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-200">
                        <Mountain className="size-7" />
                    </div>
                    <CardTitle className="text-xl font-bold">Mountain Mama&apos;s Café</CardTitle>
                    <CardDescription>
                        {mode === 'login' ? 'Sign in to the admin dashboard' : 'Reset your password'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {mode === 'login' ? (
                        <form onSubmit={handleLogin} className="space-y-4">
                            {error && (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                                    {error}
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" required placeholder="admin@example.com"
                                    value={email} onChange={e => setEmail(e.target.value)}
                                    className="h-10" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input id="password" type={showPassword ? 'text' : 'password'} required placeholder="••••••••"
                                        value={password} onChange={e => setPassword(e.target.value)}
                                        className="h-10 pr-10" />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                    >
                                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                </div>
                            </div>
                            <Button type="submit" className="w-full h-10 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-md shadow-violet-200 transition-all" disabled={loading}>
                                {loading ? <><Loader2 className="size-4 mr-2 animate-spin" /> Signing in...</> : 'Sign In'}
                            </Button>
                            <div className="text-center pt-2">
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setMode('forgot');
                                        setError('');
                                        setSuccessMessage('');
                                    }}
                                    className="text-xs text-violet-600 hover:text-violet-700 font-semibold hover:underline transition-all"
                                >
                                    Forgot password?
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleForgotPassword} className="space-y-4">
                            {error && (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                                    {error}
                                </div>
                            )}
                            {successMessage && (
                                <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-700">
                                    {successMessage}
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <Label htmlFor="reset-email">Email Address</Label>
                                <Input id="reset-email" type="email" required placeholder="admin@example.com"
                                    value={email} onChange={e => setEmail(e.target.value)}
                                    className="h-10" />
                            </div>
                            <Button type="submit" className="w-full h-10 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-md shadow-violet-200 transition-all" disabled={loading}>
                                {loading ? <><Loader2 className="size-4 mr-2 animate-spin" /> Sending...</> : 'Send Reset Link'}
                            </Button>
                            <div className="text-center pt-2">
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setMode('login');
                                        setError('');
                                        setSuccessMessage('');
                                    }}
                                    className="text-xs text-gray-500 hover:text-gray-700 font-semibold"
                                >
                                    Back to login
                                </button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
