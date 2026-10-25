/**
 * HabitX Logo SVG component
 */
const Logo = ({ size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="logoGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38bdf8" />
        <stop offset="1" stopColor="#818cf8" />
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="8" fill="url(#logoGrad)" opacity="0.15" />
    <path
      d="M9 16.5L13.5 21L23 11"
      stroke="url(#logoGrad)"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7 8h18a3 3 0 013 3v10a3 3 0 01-3 3H7a3 3 0 01-3-3V11a3 3 0 013-3z"
      stroke="url(#logoGrad)"
      strokeWidth="1.5"
      opacity="0.4"
    />
  </svg>
);

export default Logo;
