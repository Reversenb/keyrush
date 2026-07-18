// =========================================================================
// 🪙 CoinIcon — ไอคอนเหรียญสไตล์ Material "paid" แบบ FILL (วงกลมทึบ + $ เจาะทะลุ)
// lucide เป็นไอคอนเส้นล้วน ใส่ fill ตรงๆ แล้ว $ จะจมหาย เลยวาดเองด้วย mask
// ใช้ currentColor → เปลี่ยนสีตามธีมได้เหมือนไอคอนตัวอื่น
// =========================================================================

export default function CoinIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      style={{ display: 'block' }}
    >
      <defs>
        {/* ส่วนสีดำใน mask = ถูกเจาะออกจากวงกลม → กลายเป็นรูป $ โปร่ง */}
        <mask id="keyrush-coin-mask">
          <rect width="24" height="24" fill="white" />
          <path
            d="M12 6.2 V 17.8"
            stroke="black"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M14.6 9.4c0-1.35-1.15-2.2-2.6-2.2s-2.6.85-2.6 2.2c0 1.35 1.1 1.9 2.6 2.3s2.6 1 2.6 2.4c0 1.35-1.15 2.3-2.6 2.3s-2.6-.8-2.6-2.05"
            stroke="black"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </mask>
      </defs>
      <circle cx="12" cy="12" r="10" fill="currentColor" mask="url(#keyrush-coin-mask)" />
    </svg>
  );
}
