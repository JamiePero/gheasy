import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Spinner from './Spinner.jsx'

const MotionLink = motion(Link)

const variants = {
  primary: 'bg-brand text-white shadow-glow hover:bg-brand-600',
  secondary: 'bg-surface text-fg border border-border hover:border-brand/50',
  outline: 'bg-transparent text-fg border border-border hover:border-brand/50 hover:bg-surface',
  dark: 'bg-fg text-bg hover:opacity-90',
  ghost: 'bg-transparent text-fg hover:bg-surface',
}

const sizes = {
  sm: 'h-10 px-4 text-sm rounded-xl gap-1.5',
  md: 'h-12 px-5 text-[15px] rounded-2xl gap-2',
  lg: 'h-[58px] px-7 text-base rounded-2xl gap-2.5',
}

const motionProps = {
  whileTap: { scale: 0.96 },
  whileHover: { scale: 1.015 },
  transition: { type: 'spring', stiffness: 420, damping: 26 },
}

export default function Button({
  to,
  href,
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  icon,
  iconRight,
  loading = false,
  disabled = false,
  ...props
}) {
  const cls = `relative inline-flex select-none items-center justify-center font-semibold tracking-tight transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none ${
    variants[variant] || variants.primary
  } ${sizes[size] || sizes.md} ${className}`

  const content = (
    <>
      {loading && <Spinner className="h-[1.1em] w-[1.1em]" />}
      {!loading && icon}
      <span>{children}</span>
      {!loading && iconRight}
    </>
  )

  if (to) {
    return (
      <MotionLink to={to} className={cls} {...motionProps} {...props}>
        {content}
      </MotionLink>
    )
  }
  if (href) {
    return (
      <motion.a href={href} className={cls} {...motionProps} {...props}>
        {content}
      </motion.a>
    )
  }
  return (
    <motion.button
      className={cls}
      disabled={disabled || loading}
      {...motionProps}
      {...props}
    >
      {content}
    </motion.button>
  )
}
