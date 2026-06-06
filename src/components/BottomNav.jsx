import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { DataIcon, HomeIcon, InfoIcon, ReceiptIcon } from './icons.jsx'

const tabs = [
  { to: '/', label: 'Home', Icon: HomeIcon, end: true },
  { to: '/buy-data', label: 'Buy', Icon: DataIcon },
  { to: '/order-status', label: 'Orders', Icon: ReceiptIcon },
  { to: '/about', label: 'About', Icon: InfoIcon },
]

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 glass safe-bottom md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4">
        {tabs.map(({ to, label, Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="relative flex flex-col items-center gap-1 py-2.5">
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="navIndicator"
                    className="absolute -top-px h-[3px] w-9 rounded-full bg-brand"
                    transition={{ type: 'spring', stiffness: 480, damping: 34 }}
                  />
                )}
                <motion.span whileTap={{ scale: 0.85 }} className="grid place-items-center">
                  <Icon
                    className={`h-[26px] w-[26px] transition-colors ${isActive ? 'text-brand' : 'text-muted'}`}
                    strokeWidth={isActive ? 2.1 : 1.75}
                  />
                </motion.span>
                <span
                  className={`text-[11px] font-medium leading-none transition-colors ${
                    isActive ? 'text-brand' : 'text-muted'
                  }`}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
