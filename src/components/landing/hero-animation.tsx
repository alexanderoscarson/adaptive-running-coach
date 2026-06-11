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

  // "arro" fades out and collapses: 0% → 35% scroll
  const arroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const arroWidth = useTransform(scrollYProgress, [0, 0.45], ['100%', '0%']);
  const arroScale = useTransform(scrollYProgress, [0, 0.35], [1, 0.3]);

  // "P" and "t" fade out BEFORE "PT" fades in: 25% → 45%
  const letterOpacity = useTransform(scrollYProgress, [0.25, 0.45], [1, 0]);
  const letterScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.75]);

  // "PT" scales in AFTER P and t are gone: 50% → 75% scroll
  const ptOpacity = useTransform(scrollYProgress, [0.5, 0.75], [0, 1]);
  const ptScale = useTransform(scrollYProgress, [0.5, 0.75], [0.5, 1]);

  // Slogan fades out
  const sloganOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);
  const sloganY = useTransform(scrollYProgress, [0, 0.25], [0, 30]);

  // Scroll indicator fades out
  const chevronOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);

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
                fontSize: 'clamp(72px, 14vw, 128px)',
                scale: letterScale,
                opacity: letterOpacity,
                lineHeight: 1,
              }}
            >
              P
            </motion.span>

            {/* "arro" — fades and collapses */}
            <motion.span
              className="font-display text-primary inline-block overflow-hidden origin-left"
              style={{
                fontSize: 'clamp(72px, 14vw, 128px)',
                opacity: arroOpacity,
                width: arroWidth,
                scale: arroScale,
                lineHeight: 1,
              }}
            >
              <span className="inline-block whitespace-nowrap">arro</span>
            </motion.span>

            {/* t */}
            <motion.span
              className="font-display text-white inline-block origin-bottom-left"
              style={{
                fontSize: 'clamp(72px, 14vw, 128px)',
                scale: letterScale,
                opacity: letterOpacity,
                lineHeight: 1,
              }}
            >
              t
            </motion.span>
          </div>

          {/* "PT" — fades in only after P and t are fully gone */}
          <motion.span
            className="font-display text-primary inline-block origin-center absolute"
            style={{
              fontSize: 'clamp(72px, 14vw, 128px)',
              opacity: ptOpacity,
              scale: ptScale,
              lineHeight: 1,
            }}
          >
            PT
          </motion.span>

          {/* Slogan */}
          <motion.p
            className="mt-6 text-center px-6 max-w-md"
            style={{
              opacity: sloganOpacity,
              y: sloganY,
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '20px',
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
