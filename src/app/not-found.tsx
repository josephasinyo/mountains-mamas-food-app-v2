'use client';

import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center w-screen h-screen px-6 py-12 text-center">
      <div className="max-w-md mx-auto flex flex-col items-center">
        <div className="flex items-center justify-center size-20 rounded-3xl bg-violet-50 text-violet-600 mb-6 shadow-lg shadow-violet-100/60 animate-pulse">
          <Compass className="size-10" />
        </div>
        
        <p className="text-lg font-semibold text-gray-600 leading-relaxed max-w-sm">
          The link you followed is incorrect. Please double-check the URL.
        </p>
      </div>
    </div>
  );
}
