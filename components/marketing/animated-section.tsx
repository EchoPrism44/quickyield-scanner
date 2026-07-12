'use client'

import { motion, useReducedMotion, type Variants } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'

const EASE = [0.16, 1, 0.3, 1] as const

export const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE, staggerChildren: 0.08 },
  },
}

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
}

/**
 * Standard scroll-reveal wrapper for marketing sections. Children rendered
 * through <AnimatedItem> stagger in as the section enters the viewport.
 * Falls back to a static render under prefers-reduced-motion.
 */
export function AnimatedSection({
  children,
  className,
  id,
  as = 'section',
  amount = 0.25,
  style,
}: {
  children: ReactNode
  className?: string
  id?: string
  as?: 'section' | 'div' | 'header' | 'footer'
  amount?: number
  style?: CSSProperties
}) {
  const reduce = useReducedMotion()
  const Tag = motion[as]
  return (
    <Tag
      id={id}
      className={className}
      style={style}
      variants={sectionVariants}
      initial={reduce ? 'visible' : 'hidden'}
      whileInView="visible"
      viewport={{ once: true, amount }}
    >
      {children}
    </Tag>
  )
}
