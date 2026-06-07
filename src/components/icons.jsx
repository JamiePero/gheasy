// Lightweight, dependency-free icon set (stroke-based, 24×24).
const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

const make = (paths) =>
  function Icon({ className = '', size, strokeWidth, ...rest }) {
    return (
      <svg
        {...base}
        width={size || base.width}
        height={size || base.height}
        strokeWidth={strokeWidth || base.strokeWidth}
        className={className}
        aria-hidden="true"
        {...rest}
      >
        {paths}
      </svg>
    )
  }

export const HomeIcon = make(
  <>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
    <path d="M9.5 21v-6h5v6" />
  </>,
)

export const DataIcon = make(
  <>
    <path d="M2 16c3-6 7-9 10-9s7 3 10 9" />
    <path d="M5.5 16c2-3.5 4.2-5.5 6.5-5.5s4.5 2 6.5 5.5" />
    <circle cx="12" cy="16.5" r="1.6" fill="currentColor" stroke="none" />
  </>,
)

export const ReceiptIcon = make(
  <>
    <path d="M6 2.5h12a1 1 0 0 1 1 1V21l-2.2-1.4L14.6 21l-2.6-1.6L9.4 21l-2.2-1.4L5 21V3.5a1 1 0 0 1 1-1Z" />
    <path d="M9 7.5h6M9 11h6M9 14.5h3.5" />
  </>,
)

export const InfoIcon = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5" />
    <path d="M12 7.75h.01" />
  </>,
)

export const SunIcon = make(
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8" />
  </>,
)

export const MoonIcon = make(<path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.8 6.8 0 0 0 9.8 9.8Z" />)

export const CheckIcon = make(<path d="m4.5 12.5 5 5 10-11" />)

export const ChevronRightIcon = make(<path d="m9 5 7 7-7 7" />)

export const ArrowRightIcon = make(
  <>
    <path d="M4 12h15" />
    <path d="m13 5 7 7-7 7" />
  </>,
)

export const ArrowLeftIcon = make(
  <>
    <path d="M20 12H5" />
    <path d="m11 5-7 7 7 7" />
  </>,
)

export const PhoneIcon = make(
  <>
    <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
    <path d="M10.5 18.5h3" />
  </>,
)

export const SearchIcon = make(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </>,
)

export const ShieldIcon = make(
  <>
    <path d="M12 2.5 5 5.2v5.6c0 4.4 2.9 8.3 7 10.7 4.1-2.4 7-6.3 7-10.7V5.2L12 2.5Z" />
    <path d="m9 11.5 2 2 4-4.2" />
  </>,
)

export const BoltIcon = make(<path d="M13 2 4 13.5h6L9 22l10-12.5h-6L13 2Z" />)

export const ClockIcon = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5V12l3 2" />
  </>,
)

export const XIcon = make(<path d="M6 6l12 12M18 6 6 18" />)

export const AlertIcon = make(
  <>
    <path d="M12 3 2.5 19.5h19L12 3Z" />
    <path d="M12 10v4" />
    <path d="M12 17.5h.01" />
  </>,
)

export const StarIcon = make(
  <path d="M12 3.2 14.5 9l6.3.5-4.8 4.1 1.5 6.2L12 16.6 6.5 19.8 8 13.6 3.2 9.5 9.5 9 12 3.2Z" />,
)

export const SparkleIcon = make(
  <>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
    <path d="M12 8.5c.6 2 1.5 2.9 3.5 3.5-2 .6-2.9 1.5-3.5 3.5-.6-2-1.5-2.9-3.5-3.5 2-.6 2.9-1.5 3.5-3.5Z" />
  </>,
)

export const MenuIcon = make(<path d="M4 7h16M4 12h16M4 17h16" />)

export const RefreshIcon = make(
  <>
    <path d="M3.5 12a8.5 8.5 0 0 1 14.5-6l2 2" />
    <path d="M20.5 12A8.5 8.5 0 0 1 6 18l-2-2" />
    <path d="M20 4v4h-4M4 20v-4h4" />
  </>,
)

export const WalletIcon = make(
  <>
    <rect x="3" y="6" width="18" height="13" rx="2.5" />
    <path d="M3 9.5h14a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3" />
    <path d="M16.5 12h.01" />
  </>,
)

export const GlobeIcon = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M3.5 9h17M3.5 15h17" />
    <path d="M12 3c2.5 2.4 2.5 15.6 0 18M12 3c-2.5 2.4-2.5 15.6 0 18" />
  </>,
)

export const HeartIcon = make(
  <path d="M12 20s-7-4.4-9.2-9C1.3 8 3 4.8 6.2 4.8c2 0 3.2 1.2 3.8 2.3.6-1.1 1.8-2.3 3.8-2.3 3.2 0 4.9 3.2 3.4 6.2C19 15.6 12 20 12 20Z" />,
)

export const GiftIcon = make(
  <>
    <path d="M4 11.5V20a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8.5" />
    <rect x="3" y="7.5" width="18" height="4" rx="1" />
    <path d="M12 7.5V21" />
    <path d="M12 7.5C9.5 7.5 7.5 6.4 7.5 5A2 2 0 0 1 12 4.2 2 2 0 0 1 16.5 5c0 1.4-2 2.5-4.5 2.5Z" />
  </>,
)

export const CopyIcon = make(
  <>
    <rect x="9" y="9" width="11" height="11" rx="2.5" />
    <path d="M5 15h-.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5" />
  </>,
)

export const ShareIcon = make(
  <>
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="6" r="2.5" />
    <circle cx="18" cy="18" r="2.5" />
    <path d="m8.2 10.8 7.6-3.7M8.2 13.2l7.6 3.7" />
  </>,
)

export const UsersIcon = make(
  <>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
    <path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M17.8 19a5.5 5.5 0 0 0-2.3-4.4" />
  </>,
)

export const BriefcaseIcon = make(
  <>
    <rect x="3" y="7.5" width="18" height="12.5" rx="2.5" />
    <path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5" />
    <path d="M3 12.5h18" />
  </>,
)

export const GridIcon = make(
  <>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.8" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.8" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.8" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.8" />
  </>,
)

export const ChartIcon = make(
  <>
    <path d="M4 5v14h16" />
    <path d="m7.5 14.5 3-3.5 3 2.5 4-5.5" />
  </>,
)

export const ChevronDownIcon = make(<path d="m6 9 6 6 6-6" />)

export const SettingsIcon = make(
  <>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M18.4 18.4l-2.1-2.1M7.7 7.7 5.6 5.6" />
  </>,
)

export const HeadsetIcon = make(
  <>
    <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
    <rect x="2.5" y="13" width="4" height="6.5" rx="1.6" />
    <rect x="17.5" y="13" width="4" height="6.5" rx="1.6" />
    <path d="M20 19.5a3 3 0 0 1-3 3h-2.5" />
  </>,
)
