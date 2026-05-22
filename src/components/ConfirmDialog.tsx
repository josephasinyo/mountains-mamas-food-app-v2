'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info, CheckCircle2, HelpCircle, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info' | 'success';
    isLoading?: boolean;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'info',
    isLoading = false
}: ConfirmDialogProps) {
    
    const getIcon = () => {
        switch (variant) {
            case 'danger': return <AlertTriangle className="h-6 w-6 text-red-500" />;
            case 'warning': return <AlertTriangle className="h-6 w-6 text-amber-500" />;
            case 'success': return <CheckCircle2 className="h-6 w-6 text-emerald-500" />;
            default: return <Info className="h-6 w-6 text-blue-500" />;
        }
    };

    const getButtonStyles = () => {
        switch (variant) {
            case 'danger': return 'bg-red-600 hover:bg-red-700 text-white shadow-red-200/50';
            case 'warning': return 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200/50';
            case 'success': return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200/50';
            default: return 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200/50';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
            <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
                <div className="p-8">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-2xl bg-opacity-10 ${
                            variant === 'danger' ? 'bg-red-100' : 
                            variant === 'warning' ? 'bg-amber-100' : 
                            variant === 'success' ? 'bg-emerald-100' : 'bg-blue-100'
                        }`}>
                            {getIcon()}
                        </div>
                        <div className="flex-1">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-black text-gray-900 leading-tight mb-2">
                                    {title}
                                </DialogTitle>
                                <DialogDescription className="text-[15px] leading-relaxed text-gray-500 font-medium">
                                    {description}
                                </DialogDescription>
                            </DialogHeader>
                        </div>
                    </div>
                </div>

                <DialogFooter className="bg-gray-50/50 p-6 flex flex-row items-center justify-end gap-3 border-t border-gray-100">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isLoading}
                        className="rounded-xl font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-6 h-11"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        onClick={() => {
                            if (!isLoading) {
                                onConfirm();
                            }
                        }}
                        disabled={isLoading}
                        className={`rounded-xl font-black px-8 h-11 shadow-lg transition-all active:scale-95 ${getButtonStyles()}`}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
