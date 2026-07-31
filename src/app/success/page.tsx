'use client';

import { useEffect, useRef, Suspense } from 'react';
import styles from './success.module.css';
import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import { useSearchParams } from 'next/navigation';

function SuccessPageContent() {
  const { clearCart } = useCart();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug');

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const colors = ['#FFC700', '#FF0000', '#2E7D32', '#007FFF', '#FF00FF', '#00FFFF'];

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      rotation: number;
      rotationSpeed: number;
      friction: number;
      gravity: number;

      constructor(x: number, y: number, isExplosion: boolean = false) {
        this.x = x;
        this.y = y;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.size = Math.random() * 10 + 5;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = (Math.random() - 0.5) * 10;
        this.friction = 0.99;
        this.gravity = 0.2;

        if (isExplosion) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 15 + 5; // Fast burst
            this.vx = Math.cos(angle) * velocity;
            this.vy = Math.sin(angle) * velocity;
        } else {
            // Rain drop properties
             this.x = Math.random() * canvas!.width;
             this.y = -20;
             this.vx = Math.random() * 4 - 2;
             this.vy = Math.random() * 5 + 2;
        }
      }

      update() {
        this.vx *= this.friction;
        this.vy += this.gravity;
        
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
      }
    }

    // 1. Initial Explosion
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    for (let i = 0; i < 150; i++) {
        particles.push(new Particle(centerX, centerY, true));
    }

    let rainTimer = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 2. Continuous Rain
      rainTimer++;
      if (rainTimer % 5 === 0) { // Add new particle every few frames
          particles.push(new Particle(0, 0, false));
      }

      // Update and Draw
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw(ctx);

        // Remove if off screen
        if (p.y > canvas.height + 100) {
            particles.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const isLastMinute = searchParams.get('last_minute') === 'true';

  return (
    <div className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} />
      
      <div className={styles.card}>
        <div className={styles.successIcon} style={isLastMinute ? { backgroundColor: '#f59e0b' } : undefined}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        
        <h1 className={styles.title}>
          {isLastMinute ? 'Order Request Submitted!' : 'Order Placed!'}
        </h1>

        {isLastMinute ? (
          <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '16px', margin: '16px 0 20px 0', textAlign: 'left' }}>
            <p style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 'bold', color: '#b45309' }}>
              ⚠️ Action Required: Last-Minute Request (&lt;14 Hours)
            </p>
            <p style={{ margin: 0, fontSize: '14px', color: '#92400e', lineHeight: 1.5 }}>
              Your order has been submitted as a pending request. Because your pickup time is less than 14 hours away, 
              <strong> please text or call Kim directly at (406) 461-1024</strong> to accept and confirm your request.
            </p>
          </div>
        ) : (
          <p className={styles.message}>
            Your order has been received successfully and is being processed by Mountain Mama&apos;s Café.
          </p>
        )}
        
        <Link href={slug ? `/${slug}` : '/'} className={styles.homeLink}>
          Order More Food
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Order Placed!</h1>
          <p className={styles.message}>Loading success details...</p>
        </div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}
