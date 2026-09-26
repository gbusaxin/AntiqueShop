'use client'

import {motion, type HTMLMotionProps} from 'framer-motion'

export function AnimatedSection({children, className, ...props}: HTMLMotionProps<'section'>) {
  return <motion.section className={className} initial={{opacity: 0, y: 18}} whileInView={{opacity: 1, y: 0}} viewport={{once: true, amount: 0.2}} transition={{duration: 0.55, ease: 'easeOut'}} {...props}>{children}</motion.section>
}
