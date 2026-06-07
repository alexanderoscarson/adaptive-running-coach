'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export function HeroAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  // "arro" fades out and collapses: 0% → 50% scroll
  const arroOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0]);
  const arroWidth = useTransform(scrollYProgress, [0, 0.5], ['100%', '0%']);
  const arroScale = useTransform(scrollYProgress, [0, 0.4], [1, 0.3]);

  // "PT" scales in and fades in: 40% → 80% scroll
  const ptOpacity = useTransform(scrollYProgress, [0.35, 0.7], [0, 1]);
  const ptScale = useTransform(scrollYProgress, [0.35, 0.7], [0.5, 1]);

  // P and t scale down to give PT room: 0% → 60%
  const letterScale = useTransform(scrollYProgress, [0, 0.6], [1, 0.75]);

  // Slogan fades out
  const sloganOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const sloganY = useTransform(scrollYProgress, [0, 0.3], [0, 30]);

  // Scroll indicator fades out
  const chevronOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  return (
    <div ref={containerRef} className="relative h-[200vh]">
      {/* Sticky container */}
      <div className="sticky top-0 h-screen overflow-hidden" style={{ background: '#0A0A14' }}>
        {/* Radial glow behind logo */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 40% at 50% 45%, rgba(168, 85, 247, 0.12) 0%, transparent 70%)',
          }}
        />

        {/* Centered logo */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Logo row */}
          <div className="flex items-baseline justify-center overflow-hidden">
            {/* P */}
            <motion.span
              className="font-display text-white inline-block origin-bottom-right"
              style={{
                fontSize: 'clamp(64px, 12vw, 96px)',
                scale: letterScale,
                lineHeight: 1,
              }}
            >
              P
            </motion.span>

            {/* "arro" — fades and collapses */}
            <motion.span
              className="font-display text-primary inline-block overflow-hidden origin-left"
              style={{
                fontSize: 'clamp(64px, 12vw, 96px)',
                opacity: arroOpacity,
                width: arroWidth,
                scale: arroScale,
                lineHeight: 1,
              }}
            >
              <span className="inline-block whitespace-nowrap">arro</span>
            </motion.span>

            {/* "PT" — scales in (positioned over the collapsed space) */}
            <motion.span
              className="font-display text-primary inline-block origin-center absolute"
              style={{
                fontSize: 'clamp(64px, 12vw, 96px)',
                opacity: ptOpacity,
                scale: ptScale,
                lineHeight: 1,
                // Prevent layout shift — this overlays
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            >
              PT
            </motion.span>

            {/* t */}
            <motion.span
              className="font-display text-white inline-block origin-bottom-left"
              style={{
                fontSize: 'clamp(64px, 12vw, 96px)',
                scale: letterScale,
                opacity: arroOpacity,
                lineHeight: 1,
              }}
            >
              t
            </motion.span>
          </div>

          {/* Slogan */}
          <motion.p
            className="mt-6 text-center px-6 max-w-md"
            style={{
              opacity: sloganOpacity,
              y: sloganY,
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '17px',
              fontWeight: 500,
            }}
          >
            Your Personal Trainer for your actual life
          </motion.p>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          style={{ opacity: chevronOpacity }}
        >
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Scroll
          </span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown className="h-5 w-5" style={{ color: 'rgba(255,255,255,0.3)' }} />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
