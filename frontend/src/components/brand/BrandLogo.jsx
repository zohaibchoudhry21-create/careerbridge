import { useId } from 'react';
import { useTranslation } from 'react-i18next';

export default function BrandLogo({ className = 'h-10 w-auto sm:h-8', title, variant = 'default' }) {
  const { t } = useTranslation('marketing');
  const brandTitle = title ?? t('brand');
  const gradId = useId();
  const onDark = variant === 'onDark';
  const aiColor = onDark ? '#adc6ff' : '#0058be';
  const nameColor = onDark ? '#ffffff' : '#131b2e';
  const bridgeColor = onDark ? '#adc6ff' : '#0058be';

  return (
    <svg
      viewBox="0 0 200 44"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={brandTitle}
      role="img"
    >
      <title>{brandTitle}</title>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0058be" />
          <stop offset="100%" stopColor="#adc6ff" />
        </linearGradient>
      </defs>
      <rect x="8" y="18" width="7" height="20" rx="2" fill={bridgeColor} />
      <rect x="29" y="18" width="7" height="20" rx="2" fill={bridgeColor} />
      <path
        d="M8 22 Q22 6 36 22"
        stroke={`url(#${gradId})`}
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="22" cy="10" r="2.5" fill="#adc6ff" />
      <line x1="22" y1="6.5" x2="22" y2="4" stroke="#adc6ff" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="22" y1="13.5" x2="22" y2="16" stroke="#adc6ff" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="18.5" y1="10" x2="16" y2="10" stroke="#adc6ff" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="25.5" y1="10" x2="28" y2="10" stroke="#adc6ff" strokeWidth="1.5" strokeLinecap="round" />
      <text
        x="48"
        y="28"
        fontFamily="'Plus Jakarta Sans', sans-serif"
        fontWeight="800"
        fontSize="17"
        fill={aiColor}
      >
        AI{' '}
        <tspan fill={nameColor} fontWeight="700" fontSize="16">
          CareerBridge
        </tspan>
      </text>
    </svg>
  );
}
