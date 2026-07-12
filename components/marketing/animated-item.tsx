'use client'

import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { itemVariants } from './animated-section'

/** Staggered child for <AnimatedSection>. Inherits the parent's timeline. */
export function AnimatedItem({
  children,
  className,
  as = 'div',
  style,
  hoverLift = false,
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'li' | 'article' | 'span'
  style?: CSSProperties
  hoverLift?: boolean
}) {
  const Tag = motion[as]
  return (
    <Tag
      className={className}
      style={style}
      variants={itemVariants}
      whileHover={hoverLift ? { y: -3 } : undefined}
    >
      {children}
    </Tag>
  )
}
