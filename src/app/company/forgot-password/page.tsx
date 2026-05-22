'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mountain, Mail, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/company/reset-password`,
        });

        if (resetError) {
            setError(resetError.message);
            setLoading(false);
            return;
        }

        setSuccess(true);
        setLoading(false);
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
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Forgot Password</h1>
                    <p className="text-gray-500 font-medium mt-2 text-center px-4">We'll send you a link to reset your account password</p>
                </div>

                <Card className="rounded-[32px] border-none shadow-2xl shadow-gray-200/50 overflow-hidden bg-white">
                    <CardContent className="p-8">
                        {success ? (
                            <div className="text-center space-y-6 py-4">
                                <div className="size-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="size-10 text-emerald-500" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
                                    <p className="text-gray-500 font-medium px-4">
                                        We've sent a password reset link to <span className="text-violet-600 font-bold">{email}</span>.
                                    </p>
                                </div>
                                <Link 
                                    href="/company/login" 
                                    className="h-12 w-full rounded-xl border border-gray-100 hover:bg-gray-50 flex items-center justify-center text-sm font-bold text-gray-700 bg-white transition-all"
                                >
                                    <ArrowLeft className="size-4 mr-2" />
                                    Back to login
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
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
                                    <Label className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400 ml-1">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-3.5 size-4 text-gray-400" />
                                        <Input
                                            type="email"
                                            placeholder="name@company.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
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
                                    {loading ? 'Sending link...' : 'Send Reset Link'}
                                </Button>

                                <div className="text-center">
                                    <Link 
                                        href="/company/login" 
                                        className="text-[13px] font-bold text-gray-400 hover:text-violet-600 transition-colors inline-flex items-center gap-1"
                                    >
                                        <ArrowLeft className="size-3" />
                                        Back to login
                                    </Link>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
