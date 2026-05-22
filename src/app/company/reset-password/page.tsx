'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mountain, Lock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { completeForcedPasswordChange } from '@/app/company/actions';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [exchanging, setExchanging] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const isForced = searchParams.get('force') === 'true';
    const code = searchParams.get('code');
    const supabase = createClient();

    useEffect(() => {
        if (code) {
            setExchanging(true);
            supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
                setExchanging(false);
                if (error) {
                    setError('Authentication link has expired or is invalid: ' + error.message);
                }
            });
        }
    }, [code, supabase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        const { error: updateError } = await supabase.auth.updateUser({
            password: password
        });

        if (updateError) {
            setError(updateError.message);
            setLoading(false);
            return;
        }

        // If it was a forced change, update the tour_companies table securely via Server Action
        if (isForced) {
            const res = await completeForcedPasswordChange();
            if (!res.success) {
                setError(res.error || 'Failed to finalize your password update. Please try again.');
                setLoading(false);
                return;
            }
        }

        setSuccess(true);
        setLoading(false);
        
        // Redirect to dashboard after a delay
        setTimeout(() => {
            router.push('/company');
        }, 2000);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#fafafa] p-4">
            <div className="absolute inset-0 overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-100/50 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-100/50 blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <div className="flex flex-col items-center mb-8">
                    <div className="size-16 rounded-[24px] bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 flex items-center justify-center text-white shadow-2xl shadow-violet-200 mb-6 ring-8 ring-white">
                        <Mountain className="size-8" />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                        {isForced ? 'Secure Your Account' : 'Reset Password'}
                    </h1>
                    <p className="text-gray-500 font-medium mt-2 text-center px-4">
                        {isForced 
                            ? 'Please set a new password for your partner portal account.' 
                            : 'Enter your new password below.'}
                    </p>
                </div>

                <Card className="rounded-[32px] border-none shadow-2xl shadow-gray-200/50 overflow-hidden bg-white">
                    <CardContent className="p-8">
                        {success ? (
                            <div className="text-center space-y-4 py-4">
                                <div className="size-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="size-10 text-emerald-500" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Password Updated</h2>
                                <p className="text-gray-500 font-medium">Your password has been changed successfully. Redirecting to dashboard...</p>
                            </div>
                        ) : exchanging ? (
                            <div className="text-center space-y-4 py-8">
                                <div className="size-12 rounded-full border-4 border-violet-600 border-t-transparent animate-spin mx-auto mb-4" />
                                <p className="text-gray-500 font-medium">Verifying reset password link...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-600 text-sm font-bold"
                                    >
                                        <AlertCircle className="size-5 shrink-0" />
                                        {error}
                                    </motion.div>
                                )}

                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400 ml-1">New Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-3.5 size-4 text-gray-400" />
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="h-12 pl-11 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-violet-500/20 font-medium transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400 ml-1">Confirm New Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-3.5 size-4 text-gray-400" />
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            className="h-12 pl-11 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-violet-500/20 font-medium transition-all"
                                        />
                                    </div>
                                </div>

                                <Button 
                                    type="submit" 
                                    disabled={loading}
                                    className="w-full h-12 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-lg shadow-violet-200 transition-all group mt-2"
                                >
                                    {loading ? 'Updating...' : (
                                        <>
                                            <span>Update Password</span>
                                            <ArrowRight className="size-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
