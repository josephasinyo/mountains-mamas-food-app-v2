'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mountain, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function CompanyLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { data, error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (loginError) {
            setError(loginError.message);
            setLoading(false);
            return;
        }

        // Check if user is a company user
        const { data: userData } = await supabase.auth.getUser();
        const role = userData?.user?.user_metadata?.role;

        if (role === 'admin') {
            router.push('/company');
        } else if (role === 'company') {
            // Check if user needs to change password
            const { data: company } = await supabase
                .from('tour_companies')
                .select('needs_password_change')
                .eq('email', email)
                .single();

            if (company?.needs_password_change) {
                router.push('/company/reset-password?force=true');
            } else {
                router.push('/company');
            }
        } else {
            // Not a company user
            await supabase.auth.signOut();
            setError('Access denied. This portal is for Tour Partners only.');
            setLoading(false);
        }
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
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Partner Portal</h1>
                    <p className="text-gray-500 font-medium mt-2">Manage your tour group menu and orders</p>
                </div>

                <Card className="rounded-[32px] border-none shadow-2xl shadow-gray-200/50 overflow-hidden bg-white">
                    <CardHeader className="pt-8 px-8 pb-0">
                        <CardTitle className="text-xl font-bold text-gray-900">Sign In</CardTitle>
                        <CardDescription className="text-gray-500">Enter your partner credentials to continue</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                        <form onSubmit={handleLogin} className="space-y-5">
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

                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400 ml-1">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-3.5 size-4 text-gray-400" />
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="h-12 pl-11 pr-11 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-violet-500/20 font-medium transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword ? (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                                <line x1="1" y1="1" x2="23" y2="23" />
                                            </svg>
                                        ) : (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                <div className="flex justify-end pt-1">
                                    <Link 
                                        href="/company/forgot-password" 
                                        className="text-[11px] font-bold text-gray-400 hover:text-violet-600 transition-colors uppercase tracking-wider"
                                    >
                                        Forgot Password?
                                    </Link>
                                </div>
                            </div>

                            <Button 
                                type="submit" 
                                disabled={loading}
                                className="w-full h-12 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-lg shadow-violet-200 transition-all group mt-2"
                            >
                                {loading ? 'Signing in...' : (
                                    <>
                                        <span>Sign In to Portal</span>
                                        <ArrowRight className="size-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-gray-50 text-center text-xs font-bold uppercase tracking-wider text-gray-400">
                            New Partner?{' '}
                            <Link 
                                href="/company/register" 
                                className="text-violet-600 hover:text-violet-700 hover:underline transition-all"
                            >
                                Register your Tour Company
                            </Link>
                        </div>
                    </CardContent>
                </Card>
                
                <p className="text-center text-gray-400 text-xs mt-8 font-bold uppercase tracking-widest">
                    &copy; 2026 Mountain Mama&apos;s Café · Partner Network
                </p>
            </motion.div>
        </div>
    );
}
