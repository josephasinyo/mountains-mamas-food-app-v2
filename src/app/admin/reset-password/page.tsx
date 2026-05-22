'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mountain, Loader2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    useEffect(() => {
        async function checkSession() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/admin/login');
                return;
            }
            if (!session.user.user_metadata?.needs_password_change) {
                router.push('/admin');
                return;
            }
            setVerifying(false);
        }
        checkSession();
    }, [supabase, router]);

    async function handleReset(e: React.FormEvent) {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);
        setError('');

        const { error: updateError } = await supabase.auth.updateUser({
            password: password,
            data: { needs_password_change: false }
        });

        if (updateError) {
            setError(updateError.message);
            setLoading(false);
            return;
        }

        toast.success('Password updated successfully! Welcome to the dashboard.');
        router.push('/admin');
        router.refresh();
    }

    if (verifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-purple-50">
                <Loader2 className="size-8 animate-spin text-violet-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-purple-50 px-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-200/30 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl" />
            </div>

            <Card className="w-full max-w-sm relative z-10 shadow-xl shadow-violet-100/50 border-violet-100/50">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-3 flex items-center justify-center size-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-200">
                        <KeyRound className="size-7" />
                    </div>
                    <CardTitle className="text-xl font-bold">Welcome to the Team</CardTitle>
                    <CardDescription>Please set a new password to continue</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleReset} className="space-y-4">
                        {error && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                                {error}
                            </div>
                        )}
                        <div className="space-y-1.5">
                            <Label htmlFor="password">New Password</Label>
                            <Input 
                                id="password" 
                                type="password" 
                                required 
                                placeholder="••••••••"
                                value={password} 
                                onChange={e => setPassword(e.target.value)}
                                className="h-10" 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input 
                                id="confirm-password" 
                                type="password" 
                                required 
                                placeholder="••••••••"
                                value={confirmPassword} 
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="h-10" 
                            />
                        </div>
                        <Button type="submit" className="w-full h-10 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-md shadow-violet-200 transition-all" disabled={loading}>
                            {loading ? <><Loader2 className="size-4 mr-2 animate-spin" /> Updating...</> : 'Update Password & Log In'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
