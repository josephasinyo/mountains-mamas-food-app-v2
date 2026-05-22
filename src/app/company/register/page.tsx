'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Mountain, User, Lock, Mail, Phone, Building2, CreditCard, 
    FileText, Check, CheckCircle2, ArrowLeft, ArrowRight, 
    Trash2, PenTool, Type, HelpCircle, ShieldAlert, Sparkles, Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { checkSlugAvailability, registerCompany } from './actions';

export default function RegisterCompanyPage() {
    const router = useRouter();

    // Steps state: 1 = Details, 2 = Billing, 3 = Contract, 4 = Success
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState('');

    // --- Form States ---
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'direct_pay' | 'monthly_invoice'>('direct_pay');
    
    // Contract details
    const [signerName, setSignerName] = useState('');
    const [signerEmail, setSignerEmail] = useState('');
    const [signerTitle, setSignerTitle] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [signatureMethod, setSignatureMethod] = useState<'draw' | 'type'>('draw');
    const [typedSignature, setTypedSignature] = useState('');
    
    // --- Validation and UX helper states ---
    const [slug, setSlug] = useState('');
    const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
    const [slugLoading, setSlugLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [showPassword, setShowPassword] = useState(false);

    // Canvas drawing pad refs & variables
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [canvasHasDrawing, setCanvasHasDrawing] = useState(false);

    // Dynamic Google Cursive Font Injection
    useEffect(() => {
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
        return () => {
            document.head.removeChild(link);
        };
    }, []);

    // Slug check effect
    useEffect(() => {
        if (!name.trim()) {
            setSlug('');
            setSlugAvailable(null);
            return;
        }

        const timer = setTimeout(async () => {
            setSlugLoading(true);
            try {
                const res = await checkSlugAvailability(name);
                setSlug(res.slug);
                setSlugAvailable(res.available);
            } catch (err) {
                console.error(err);
            } finally {
                setSlugLoading(false);
            }
        }, 600);

        return () => clearTimeout(timer);
    }, [name]);

    // Password strength check
    useEffect(() => {
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        setPasswordStrength(score);
    }, [password]);

    // Setup signature canvas drawing dimensions and DPI handling
    useEffect(() => {
        if (signatureMethod === 'draw' && canvasRef.current && step === 3) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Clear state
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                setCanvasHasDrawing(false);
                
                // Get pixel density
                const dpr = window.devicePixelRatio || 1;
                const rect = canvas.getBoundingClientRect();
                
                // Match display size with internal buffer resolution
                canvas.width = rect.width * dpr;
                canvas.height = rect.height * dpr;
                ctx.scale(dpr, dpr);
                
                // Styling defaults
                ctx.lineWidth = 2.5;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.strokeStyle = '#4f46e5'; // indigo-600
            }
        }
    }, [signatureMethod, step]);

    // --- HTML5 Signature Pad Functions ---
    const getCoordinates = (e: any) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        
        // Touch events supporting tablets and mobile
        if (e.touches && e.touches.length > 0) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
        } else {
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        }
    };

    const startDrawing = (e: any) => {
        e.preventDefault();
        const coords = getCoordinates(e);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
        setIsDrawing(true);
    };

    const draw = (e: any) => {
        if (!isDrawing) return;
        e.preventDefault();
        const coords = getCoordinates(e);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
        setCanvasHasDrawing(true);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setCanvasHasDrawing(false);
    };

    // --- Navigation Flow ---
    const nextStep = () => {
        setFormError('');
        if (step === 1) {
            if (!name.trim()) return setFormError('Company Name is required.');
            if (!slugAvailable) return setFormError('A company with this slug already exists.');
            if (!email.trim() || !email.includes('@')) return setFormError('A valid email address is required.');
            if (!signerName.trim()) return setFormError('Legal Representative Name is required.');
            if (!signerTitle.trim()) return setFormError('Representative Title is required.');
            if (password.length < 8) return setFormError('Password must be at least 8 characters.');
            if (!/[A-Z]/.test(password)) return setFormError('Password must contain at least one uppercase letter.');
            if (!/[0-9]/.test(password)) return setFormError('Password must contain at least one number.');
            if (password !== confirmPassword) return setFormError('Passwords do not match.');
            
            // Populate signer defaults based on profile values
            setSignerEmail(email);
            if (!typedSignature) {
                setTypedSignature(signerName);
            }
            
            setStep(2);
        } else if (step === 2) {
            if (paymentMethod === 'direct_pay') {
                // Direct Pay bypasses contract step and submits immediately
                submitRegistration();
            } else {
                setStep(3);
            }
        }
    };

    const prevStep = () => {
        setFormError('');
        setStep(prev => prev - 1);
    };

    const submitRegistration = async () => {
        setFormError('');
        setLoading(true);

        let finalSignature = '';
        if (paymentMethod === 'monthly_invoice') {
            if (!signerName.trim()) {
                setLoading(false);
                return setFormError('Representative name is required.');
            }
            if (!signerEmail.trim() || !signerEmail.includes('@')) {
                setLoading(false);
                return setFormError('Representative email is required.');
            }
            if (!agreed) {
                setLoading(false);
                return setFormError('You must agree to the contract terms.');
            }

            if (signatureMethod === 'draw') {
                if (!canvasHasDrawing || !canvasRef.current) {
                    setLoading(false);
                    return setFormError('Please draw your signature in the signature area.');
                }
                finalSignature = canvasRef.current.toDataURL('image/png');
            } else {
                if (!typedSignature.trim()) {
                    setLoading(false);
                    return setFormError('Please type your legal cursive signature.');
                }
                finalSignature = `typed:${typedSignature}`;
            }
        }

        try {
            const res = await registerCompany({
                name,
                email,
                phone,
                paymentMethod,
                password,
                signatureData: finalSignature,
                signerName,
                signerEmail,
                signerTitle
            });

            if (res.success) {
                setStep(4);
                toast.success('Your tour company registered successfully!');
            } else {
                setFormError(res.error || 'Failed to complete registration.');
            }
        } catch (err: any) {
            setFormError(err.message || 'An error occurred during onboarding.');
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient gradients */}
            <div className="absolute inset-0 overflow-hidden -z-10">
                <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] rounded-full bg-violet-100/50 blur-[140px]" />
                <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] rounded-full bg-indigo-100/50 blur-[140px]" />
            </div>

            <div className="w-full max-w-2xl py-8">
                {/* Header branding */}
                {step !== 4 && (
                    <div className="flex flex-col items-center mb-8">
                        <div className="flex items-center gap-2 mb-3 bg-white/80 backdrop-blur-md p-3 px-6 rounded-2xl border border-white/80 shadow-lg shadow-violet-100/30 transition-transform hover:scale-105 duration-300 select-none">
                            <span className="font-bebas text-2xl tracking-[3px] uppercase bg-gray-900 text-white px-3 py-1 rounded skew-x-[-6deg] leading-none" style={{ fontFamily: 'var(--font-bebas), sans-serif' }}>MOUNTAIN</span>
                            <span className="font-pacifico text-3xl text-violet-600 leading-none -ml-1" style={{ fontFamily: 'var(--font-pacifico), cursive', textShadow: '2px 2px 0 rgba(255, 255, 255, 1), 3px 3px 0 rgba(0, 0, 0, 0.15)' }}>Mama&apos;s</span>
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Partner Self-Onboarding</h1>
                        <p className="text-gray-500 text-sm font-medium mt-1">Start accepting gourmet box lunches for your tours</p>
                    </div>
                )}

                {/* Progress Stepper */}
                {step !== 4 && (
                    <div className="flex items-center justify-between max-w-sm mx-auto mb-8 relative">
                        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-100 -z-10" />
                        <div className="absolute left-0 top-1/2 h-0.5 bg-violet-600 transition-all duration-300 -z-10" 
                            style={{ width: `${((step - 1) / (paymentMethod === 'monthly_invoice' ? 2 : 1)) * 100}%` }} 
                        />
                        
                        <div className="flex flex-col items-center">
                            <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2 ${
                                step >= 1 ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-200' : 'bg-white border-gray-200 text-gray-400'
                            }`}>
                                1
                            </div>
                            <span className="text-[10px] font-black uppercase text-gray-400 mt-1.5 tracking-wider">Profile</span>
                        </div>
                        
                        <div className="flex flex-col items-center">
                            <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2 ${
                                step >= 2 ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-200' : 'bg-white border-gray-200 text-gray-400'
                            }`}>
                                2
                            </div>
                            <span className="text-[10px] font-black uppercase text-gray-400 mt-1.5 tracking-wider">Billing</span>
                        </div>

                        {paymentMethod === 'monthly_invoice' && (
                            <div className="flex flex-col items-center">
                                <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2 ${
                                    step >= 3 ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-200' : 'bg-white border-gray-200 text-gray-400'
                                }`}>
                                    3
                                </div>
                                <span className="text-[10px] font-black uppercase text-gray-400 mt-1.5 tracking-wider">Contract</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Form Card */}
                <Card className="rounded-[32px] border-none shadow-2xl shadow-gray-200/50 bg-white overflow-hidden">
                    <CardContent className="p-8 md:p-10">
                        {formError && (
                            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-3 text-rose-700 text-xs font-bold leading-relaxed">
                                <ShieldAlert className="size-5 shrink-0 text-rose-500" />
                                <span>{formError}</span>
                            </div>
                        )}

                        <AnimatePresence mode="wait">
                            {/* STEP 1: Details */}
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Partner Details</h2>
                                        <p className="text-sm text-gray-500 mt-0.5">Let&apos;s set up your tour company listing and login credentials.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-wider text-gray-400 ml-1">Company Name *</Label>
                                            <div className="relative">
                                                <Building2 className="absolute left-4 top-3.5 size-4 text-gray-400" />
                                                <Input
                                                    placeholder="Grizzly Adventures"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="h-12 pl-11 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white font-medium transition-all text-sm"
                                                />
                                            </div>
                                            {slug && (
                                                <div className="flex items-center gap-2 mt-1.5 ml-1 text-xs">
                                                    {slugLoading ? (
                                                        <span className="text-gray-400 flex items-center gap-1"><Loader2 className="size-3 animate-spin" /> Verifying...</span>
                                                    ) : slugAvailable ? (
                                                        <span className="text-emerald-600 font-bold flex items-center gap-1">✓ Order Link: <code>/{slug}</code></span>
                                                    ) : (
                                                        <span className="text-rose-500 font-bold flex items-center gap-1">✗ Name already taken</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-wider text-gray-400 ml-1">Company Email *</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-3.5 size-4 text-gray-400" />
                                                <Input
                                                    type="email"
                                                    placeholder="company@grizzly.com"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="h-12 pl-11 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white font-medium transition-all text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-wider text-gray-400 ml-1">Legal Representative Name *</Label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-3.5 size-4 text-gray-400" />
                                                <Input
                                                    placeholder="John Doe"
                                                    value={signerName}
                                                    onChange={(e) => {
                                                        setSignerName(e.target.value);
                                                        if (signatureMethod === 'type') setTypedSignature(e.target.value);
                                                    }}
                                                    className="h-12 pl-11 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white font-medium transition-all text-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-wider text-gray-400 ml-1">Representative Title *</Label>
                                            <div className="relative">
                                                <Type className="absolute left-4 top-3.5 size-4 text-gray-400" />
                                                <Input
                                                    placeholder="CEO / Owner / Manager"
                                                    value={signerTitle}
                                                    onChange={(e) => setSignerTitle(e.target.value)}
                                                    className="h-12 pl-11 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white font-medium transition-all text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-wider text-gray-400 ml-1">Company Phone</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-3.5 size-4 text-gray-400" />
                                                <Input
                                                    placeholder="(406) 555-0199"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    className="h-12 pl-11 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white font-medium transition-all text-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-wider text-gray-400 ml-1">Choose Password *</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-3.5 size-4 text-gray-400" />
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="h-12 pl-11 pr-11 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white font-medium transition-all text-sm"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                                                >
                                                    {showPassword ? 'Hide' : 'Show'}
                                                </button>
                                            </div>
                                            <div className="space-y-2 mt-2 ml-1">
                                                
                                                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                                                    <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Password Requirements:</p>
                                                    <div className="grid grid-cols-1 gap-1.5 text-xs font-semibold">
                                                        <div className={`flex items-center gap-2 transition-colors ${password.length >= 8 ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                            <Check className={`size-3.5 transition-transform ${password.length >= 8 ? 'text-emerald-500 scale-110' : 'text-gray-300'}`} />
                                                            <span>At least 8 characters</span>
                                                        </div>
                                                        <div className={`flex items-center gap-2 transition-colors ${/[A-Z]/.test(password) ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                            <Check className={`size-3.5 transition-transform ${/[A-Z]/.test(password) ? 'text-emerald-500 scale-110' : 'text-gray-300'}`} />
                                                            <span>At least one uppercase letter</span>
                                                        </div>
                                                        <div className={`flex items-center gap-2 transition-colors ${/[0-9]/.test(password) ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                            <Check className={`size-3.5 transition-transform ${/[0-9]/.test(password) ? 'text-emerald-500 scale-110' : 'text-gray-300'}`} />
                                                            <span>At least one number</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-2 md:col-start-2">
                                            <Label className="text-[10px] font-black uppercase tracking-wider text-gray-400 ml-1">Confirm Password *</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-3.5 size-4 text-gray-400" />
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className={`h-12 pl-11 rounded-xl bg-gray-50/50 focus:bg-white font-medium transition-all text-sm ${
                                                        confirmPassword 
                                                            ? password === confirmPassword 
                                                                ? 'border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20' 
                                                                : 'border-rose-200 focus:border-rose-500 focus:ring-rose-500/20'
                                                            : 'border-gray-100'
                                                    }`}
                                                />
                                            </div>
                                            <AnimatePresence>
                                                {confirmPassword && password !== confirmPassword && (
                                                    <motion.p
                                                        initial={{ opacity: 0, y: -5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -5 }}
                                                        className="text-[10px] text-rose-500 font-bold uppercase tracking-wider mt-1.5 ml-1 flex items-center gap-1"
                                                    >
                                                        <ShieldAlert className="size-3 text-rose-500 animate-pulse" /> Passwords do not match
                                                    </motion.p>
                                                )}
                                                {confirmPassword && password === confirmPassword && (
                                                    <motion.p
                                                        initial={{ opacity: 0, y: -5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -5 }}
                                                        className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-1.5 ml-1 flex items-center gap-1"
                                                    >
                                                        <CheckCircle2 className="size-3 text-emerald-500" /> Passwords match
                                                    </motion.p>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                                        <Link href="/company/login" className="inline-flex items-center text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-wider">
                                            <ArrowLeft className="size-4 mr-2" /> Back to Sign In
                                        </Link>
                                        <Button 
                                            onClick={nextStep} 
                                            disabled={!name.trim() || !email.trim() || !signerName.trim() || !signerTitle.trim() || !slugAvailable || passwordStrength < 3 || password !== confirmPassword}
                                            className="h-11 rounded-xl bg-violet-600 hover:bg-violet-700 font-bold px-6 shadow-md transition-all gap-1.5"
                                        >
                                            Continue <ArrowRight className="size-4" />
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 2: Billing Options */}
                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Select Billing Preferences</h2>
                                        <p className="text-sm text-gray-500 mt-0.5">Determine how your tour group bookings will settle payments.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Card 1: Direct Pay */}
                                        <div 
                                            onClick={() => setPaymentMethod('direct_pay')}
                                            className={`rounded-3xl p-6 border-2 text-left cursor-pointer transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-56 ${
                                                paymentMethod === 'direct_pay' 
                                                    ? 'border-violet-600 bg-violet-50/20 shadow-xl shadow-violet-50' 
                                                    : 'border-gray-100 hover:border-violet-200 bg-white'
                                            }`}
                                        >
                                            {paymentMethod === 'direct_pay' && (
                                                <div className="absolute right-4 top-4 size-6 rounded-full bg-violet-600 flex items-center justify-center text-white">
                                                    <Check className="size-4" />
                                                </div>
                                            )}
                                            <div className="space-y-3">
                                                <div className="size-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                                    <CreditCard className="size-5" />
                                                </div>
                                                <div>
                                                    <p className="font-extrabold text-gray-900 text-[17px]">💳 Direct Pay</p>
                                                    <p className="text-xs text-gray-500 font-medium mt-1">Guests pay for their custom menus individually online via Stripe checkout.</p>
                                                </div>
                                            </div>
                                            <div className="pt-2 text-[10px] font-black uppercase tracking-wider text-emerald-600">
                                                No Contracts Required
                                            </div>
                                        </div>

                                        {/* Card 2: Monthly Invoice */}
                                        <div 
                                            onClick={() => setPaymentMethod('monthly_invoice')}
                                            className={`rounded-3xl p-6 border-2 text-left cursor-pointer transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-56 ${
                                                paymentMethod === 'monthly_invoice' 
                                                    ? 'border-violet-600 bg-violet-50/20 shadow-xl shadow-violet-50' 
                                                    : 'border-gray-100 hover:border-violet-200 bg-white'
                                            }`}
                                        >
                                            {paymentMethod === 'monthly_invoice' && (
                                                <div className="absolute right-4 top-4 size-6 rounded-full bg-violet-600 flex items-center justify-center text-white">
                                                    <Check className="size-4" />
                                                </div>
                                            )}
                                            <div className="space-y-3">
                                                <div className="size-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                                    <FileText className="size-5" />
                                                </div>
                                                <div>
                                                    <p className="font-extrabold text-gray-900 text-[17px]">📄 Monthly Invoice</p>
                                                    <p className="text-xs text-gray-500 font-medium mt-1">Café tracks orders and bills your company monthly. Prices are hidden from guests.</p>
                                                </div>
                                            </div>
                                            <div className="pt-2 text-[10px] font-black uppercase tracking-wider text-blue-600">
                                                Corporate E-Contract Required
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            onClick={prevStep}
                                            className="font-bold text-gray-400 hover:text-gray-600 uppercase tracking-wider text-xs"
                                        >
                                            Back
                                        </Button>
                                        <Button 
                                            onClick={nextStep}
                                            disabled={loading}
                                            className="h-11 rounded-xl bg-violet-600 hover:bg-violet-700 font-bold px-6 shadow-md transition-all gap-1.5"
                                        >
                                            {loading ? 'Submitting...' : paymentMethod === 'direct_pay' ? 'Submit Registration' : 'Review Contract'} 
                                            <ArrowRight className="size-4" />
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 3: Contract Agreement */}
                            {step === 3 && paymentMethod === 'monthly_invoice' && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Corporate Catering Contract</h2>
                                        <p className="text-sm text-gray-500 mt-0.5">Please review the corporate catering policy and sign below to finalize invoicing.</p>
                                    </div>

                                    {/* Scrollable Terms Contract Container */}
                                    <div className="h-60 rounded-2xl border border-gray-100 bg-gray-50/50 p-5 overflow-y-scroll text-xs text-gray-600 font-medium space-y-4 leading-relaxed scrollbar-thin">
                                        <p className="text-center font-extrabold uppercase tracking-widest text-gray-900 border-b border-gray-200 pb-3">Corporate Catering & Invoicing Agreement</p>
                                        
                                        <div>
                                            <p className="font-bold text-gray-800">1. Parties & Background</p>
                                            <p className="mt-1">This Catering Agreement (the &quot;Agreement&quot;) is executed between Mountain Mama&apos;s Café (the &quot;Provider&quot;) and the registering organization (the &quot;Company&quot;) in relation to ordering gourmet box lunches for scheduled tours and excursions.</p>
                                        </div>

                                        <div>
                                            <p className="font-bold text-gray-800">2. Scope of Service & Ordering Link</p>
                                            <p className="mt-1">The Provider will configure a dedicated menu ordering URL at <strong><code>{window.location.origin}/{slug}</code></strong>. The Company agrees to distribute this link to guests or utilize it for direct internal order placement.</p>
                                        </div>

                                        <div>
                                            <p className="font-bold text-gray-800">3. Final Order Finalization & Cutoff Time</p>
                                            <p className="mt-1">All orders must be submitted and locked at least <strong>24 hours prior</strong> to the scheduled pickup time. Any orders requested after this cutoff window must be approved directly by the café management via telephone and are subject to active kitchen ingredient availability.</p>
                                        </div>

                                        <div>
                                            <p className="font-bold text-gray-800">4. Monthly Invoicing & Payments</p>
                                            <p className="mt-1">By selecting Monthly Invoicing, the Company agrees that no individual prices will be shown to guests during order configuration. The Provider will aggregate all tour orders placed within a calendar month and deliver a consolidated corporate invoice at the end of the month. Payment is due upon receipt, according to the standard invoicing policies of Mountain Mama&apos;s Café.</p>
                                        </div>

                                        <div>
                                            <p className="font-bold text-gray-800">5. Cancellation & Adjustments</p>
                                            <p className="mt-1">Cancellations or changes in guest counts must be updated at least 24 hours prior to the tour. Failure to notify inside the 24-hour cutoff will result in the original scheduled counts being billed to the invoice.</p>
                                        </div>

                                        <div>
                                            <p className="font-bold text-gray-800">6. Electronic Signature Consent</p>
                                            <p className="mt-1">The representative signing below certifies that they have the legal authority to bind the registering Company to this financial contract. Hand-drawn canvas signatures or typed legal font configurations are legally binding instruments identical to physical ink signatures under federal ESIGN regulations.</p>
                                        </div>
                                    </div>

                                    {/* Signer Details Form */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black uppercase text-gray-400">Legal Representative Name *</Label>
                                            <Input 
                                                placeholder="John Doe"
                                                value={signerName}
                                                onChange={(e) => {
                                                    setSignerName(e.target.value);
                                                    if (signatureMethod === 'type') setTypedSignature(e.target.value);
                                                }}
                                                className="h-10 rounded-xl bg-white border-gray-100 text-xs font-semibold"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black uppercase text-gray-400">Company Email *</Label>
                                            <Input 
                                                type="email"
                                                placeholder="j.doe@grizzly.com"
                                                value={signerEmail}
                                                onChange={(e) => setSignerEmail(e.target.value)}
                                                className="h-10 rounded-xl bg-white border-gray-100 text-xs font-semibold"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black uppercase text-gray-400">Representative Title *</Label>
                                            <Input 
                                                placeholder="Director of Operations"
                                                value={signerTitle}
                                                onChange={(e) => setSignerTitle(e.target.value)}
                                                className="h-10 rounded-xl bg-white border-gray-100 text-xs font-semibold"
                                            />
                                        </div>
                                    </div>

                                    {/* E-Signature Pad Input Selector */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between ml-1">
                                            <Label className="text-[10px] font-black uppercase tracking-wider text-gray-400">E-Signature Drawing *</Label>
                                            <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg">
                                                <button
                                                    type="button"
                                                    onClick={() => setSignatureMethod('draw')}
                                                    className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${
                                                        signatureMethod === 'draw' ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-500'
                                                    }`}
                                                >
                                                    <PenTool className="size-3" /> Draw
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSignatureMethod('type')}
                                                    className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${
                                                        signatureMethod === 'type' ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-500'
                                                    }`}
                                                >
                                                    <Type className="size-3" /> Cursive Type
                                                </button>
                                            </div>
                                        </div>

                                        {signatureMethod === 'draw' ? (
                                            <div className="relative">
                                                <canvas
                                                    ref={canvasRef}
                                                    onMouseDown={startDrawing}
                                                    onMouseMove={draw}
                                                    onMouseUp={stopDrawing}
                                                    onMouseLeave={stopDrawing}
                                                    onTouchStart={startDrawing}
                                                    onTouchMove={draw}
                                                    onTouchEnd={stopDrawing}
                                                    style={{ touchAction: 'none' }}
                                                    className="w-full h-40 bg-gray-50/70 border border-dashed border-gray-200 rounded-2xl cursor-crosshair shadow-inner"
                                                />
                                                <div className="absolute bottom-3 right-3 flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={clearCanvas}
                                                        className="h-8 rounded-lg border border-gray-100 hover:border-rose-200 bg-white px-3 text-xs font-bold text-gray-400 hover:text-rose-500 transition-colors flex items-center gap-1.5 shadow-sm"
                                                    >
                                                        <Trash2 className="size-3" /> Clear Signature
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <Input 
                                                    placeholder="Type Representative Name"
                                                    value={typedSignature}
                                                    onChange={(e) => setTypedSignature(e.target.value)}
                                                    className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white font-medium text-sm transition-all"
                                                />
                                                {typedSignature && (
                                                    <div className="h-20 bg-gray-50/70 border border-dashed border-gray-200 rounded-2xl flex items-center justify-center shadow-inner relative overflow-hidden">
                                                        <div className="absolute left-4 top-2 text-[8px] font-black uppercase text-gray-400 tracking-widest">Cursive Signature Preview</div>
                                                        <span 
                                                            style={{ fontFamily: "'Dancing Script', cursive" }}
                                                            className="text-3xl text-violet-700 select-none py-2 px-6"
                                                        >
                                                            {typedSignature}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Consent Legal Checkbox */}
                                    <div className="flex items-start gap-3 bg-violet-50/30 p-4 rounded-2xl border border-violet-100/50">
                                        <input 
                                            type="checkbox" 
                                            id="agreed"
                                            checked={agreed}
                                            onChange={(e) => setAgreed(e.target.checked)}
                                            className="size-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500/20 mt-0.5 cursor-pointer"
                                        />
                                        <label htmlFor="agreed" className="text-xs text-gray-500 font-bold leading-normal select-none cursor-pointer">
                                            I agree that this drawn or typed signature serves as the legal digital authentication for this Corporate Catering Agreement, agreeing to all terms specified.
                                        </label>
                                    </div>

                                    <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            onClick={prevStep}
                                            className="font-bold text-gray-400 hover:text-gray-600 uppercase tracking-wider text-xs"
                                        >
                                            Back
                                        </Button>
                                        <Button 
                                            onClick={submitRegistration}
                                            disabled={loading || !agreed || !signerName.trim() || !signerEmail.trim() || (signatureMethod === 'draw' ? !canvasHasDrawing : !typedSignature.trim())}
                                            className="h-11 rounded-xl bg-violet-600 hover:bg-violet-700 font-bold px-6 shadow-md transition-all gap-1.5"
                                        >
                                            {loading ? 'Submitting Application...' : 'Sign & Submit Application'}
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 4: Success / Thank you */}
                            {step === 4 && (
                                <motion.div
                                    key="step4"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex flex-col items-center text-center py-8 space-y-6"
                                >
                                    <div className="size-20 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 relative">
                                        <CheckCircle2 className="size-12" />
                                        <motion.div 
                                            className="absolute -right-2 -top-2 text-violet-500"
                                            animate={{ scale: [1, 1.2, 1], rotate: [0, 15, 0] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                        >
                                            <Sparkles className="size-6 fill-violet-500" />
                                        </motion.div>
                                    </div>

                                    <div className="space-y-2 max-w-md">
                                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Onboarding Request Submitted!</h2>
                                        <p className="text-gray-500 text-sm font-medium leading-relaxed">
                                            Congratulations! <strong>{name}</strong> is now registered in our partner system.
                                        </p>
                                    </div>

                                    <div className="bg-gray-50/50 border border-gray-100 p-6 rounded-2xl text-left text-xs font-semibold text-gray-600 space-y-3 max-w-lg">
                                        <div className="flex items-start gap-2.5">
                                            <div className="size-5 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</div>
                                            <p className="leading-relaxed"><strong>Pending Approval:</strong> We&apos;ve sent a notification to café administration. You will receive an email once approved.</p>
                                        </div>
                                        <div className="flex items-start gap-2.5">
                                            <div className="size-5 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</div>
                                            <p className="leading-relaxed"><strong>Confirmation Emails:</strong> Check your inbox at <strong>{email}</strong> for our welcome letter detailing your application parameters.</p>
                                        </div>
                                        <div className="flex items-start gap-2.5">
                                            <div className="size-5 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</div>
                                            <p className="leading-relaxed"><strong>Dashboard Credentials:</strong> You can log into your portal using the credentials you defined once your approval completes.</p>
                                        </div>
                                    </div>

                                    <div className="pt-6 w-full max-w-sm flex flex-col gap-3">
                                        <Button 
                                            onClick={() => router.push('/company/login')}
                                            className="h-12 w-full rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-lg shadow-violet-200 transition-all"
                                        >
                                            Return to Sign In
                                        </Button>
                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                                            Mountain Mama&apos;s Café · Tour Onboarding Network
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>

                {/* Brand Footer */}
                <div className="mt-8 text-center text-xs text-gray-400 font-semibold tracking-wide">
                    © 2026 Mountain Mama&apos;s Café · Partner Network
                </div>
            </div>
        </div>
    );
}
