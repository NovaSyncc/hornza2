'use client';

import React from 'react';
import { motion } from 'framer-motion';

const GeometricElements = ({ variant = 'hero' }) => {
  const heroElements = [
    {
      size: 'w-32 h-32',
      position: 'top-20 right-20',
      shape: 'rounded-full',
      gradient: 'bg-gradient-to-br from-gold-400/20 to-gold-600/10',
      animation: { rotate: 360, scale: [1, 1.2, 1] },
      duration: 20
    },
    {
      size: 'w-24 h-24',
      position: 'top-1/3 left-16',
      shape: 'rounded-2xl rotate-45',
      gradient: 'bg-gradient-to-br from-white/10 to-white/5',
      animation: { y: [-20, 20, -20], rotate: [45, 90, 45] },
      duration: 15
    },
    {
      size: 'w-40 h-40',
      position: 'bottom-32 right-1/4',
      shape: 'rounded-3xl',
      gradient: 'bg-gradient-to-br from-gold-500/15 to-transparent',
      animation: { x: [-30, 30, -30], rotate: [0, 180, 360] },
      duration: 25
    },
    {
      size: 'w-16 h-16',
      position: 'top-1/2 right-1/3',
      shape: 'rounded-full',
      gradient: 'bg-gradient-to-br from-white/20 to-white/5',
      animation: { scale: [1, 1.5, 1], opacity: [0.3, 0.8, 0.3] },
      duration: 12
    }
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {heroElements.map((element, index) => (
        <motion.div
          key={index}
          className={`absolute ${element.size} ${element.position} ${element.shape} ${element.gradient} backdrop-blur-sm`}
          animate={element.animation}
          transition={{
            duration: element.duration,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            filter: 'blur(0.5px)',
          }}
        />
      ))}

      {/* Floating Particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-2 h-2 bg-gold-400/40 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [-50, 50, -50],
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 8 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};

export default GeometricElements;
