// Decorative background for the login/unlock screens: a soft gradient mesh glow
// layered with a faint currency (₹) coin motif. Purely decorative, aria-hidden.
export default function LoginBackground() {
  return (
    <svg className="login-bg-coins" viewBox="0 0 400 480" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g fill="none" stroke="#38bdf8" strokeWidth="1.2">
        <circle cx="60" cy="70" r="34" opacity="0.5" />
        <circle cx="340" cy="60" r="24" opacity="0.4" stroke="#22c55e" />
        <circle cx="70" cy="410" r="46" opacity="0.35" stroke="#22c55e" />
        <circle cx="330" cy="420" r="30" opacity="0.45" />
        <circle cx="200" cy="40" r="16" opacity="0.3" stroke="#a855f7" />
        <circle cx="360" cy="240" r="20" opacity="0.35" stroke="#a855f7" />
        <circle cx="30" cy="240" r="18" opacity="0.3" />
      </g>
      <g fill="#94a3b8" fontFamily="sans-serif" fontSize="26" opacity="0.28" textAnchor="middle">
        <text x="60" y="80">₹</text>
        <text x="340" y="68">₹</text>
        <text x="70" y="420">₹</text>
        <text x="330" y="428">₹</text>
      </g>
    </svg>
  );
}
