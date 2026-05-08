import React, { useEffect, useState } from 'react';

/**
 * 红色篆刻方印浮层。常见用法：
 *   const [stamping, setStamping] = useState(false);
 *   onClick={() => { setStamping(true); /* 业务 */ }}
 *   <SealStamp text="采" show={stamping} onDone={() => setStamping(false)} />
 *
 * 动画：旋转 -8° 起，scale 1.4 → 1.0，opacity 0 → 1 → 1 → 0.85 → 0
 * 总时长 ~900ms。借鉴书法落款盖印的"重重一按再缓缓抬起"。
 */

interface Props {
  text: string;
  show: boolean;
  onDone?: () => void;
  size?: number;
  /** 相对父容器定位；默认右上角 */
  placement?: 'top-right' | 'center' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const PLACEMENT: Record<NonNullable<Props['placement']>, string> = {
  'top-right': 'top-1 right-1',
  'top-left': 'top-1 left-1',
  'bottom-right': 'bottom-1 right-1',
  'bottom-left': 'bottom-1 left-1',
  center: 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
};

const SealStamp: React.FC<Props> = ({
  text,
  show,
  onDone,
  size = 44,
  placement = 'top-right',
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (show) {
      setMounted(true);
      const t = window.setTimeout(() => {
        setMounted(false);
        onDone?.();
      }, 900);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [show, onDone]);

  if (!mounted) return null;

  return (
    <div
      className={`pointer-events-none absolute z-20 animate-seal-stamp ${PLACEMENT[placement]}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        viewBox="0 0 44 44"
        width={size}
        height={size}
        style={{ display: 'block' }}
      >
        {/* 印泥红 */}
        <defs>
          <radialGradient id="seal-ink" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#e94545" />
            <stop offset="60%" stopColor="#c8221c" />
            <stop offset="100%" stopColor="#8a1410" />
          </radialGradient>
        </defs>
        {/* 印章方框 */}
        <rect
          x={3}
          y={3}
          width={38}
          height={38}
          rx={2}
          fill="url(#seal-ink)"
          stroke="#5a0a08"
          strokeWidth={0.8}
          opacity={0.95}
        />
        {/* 内框（印章边框惯例） */}
        <rect
          x={6}
          y={6}
          width={32}
          height={32}
          rx={1}
          fill="none"
          stroke="#fff8f0"
          strokeWidth={0.6}
          opacity={0.7}
        />
        {/* 印文 */}
        <text
          x={22}
          y={22}
          dominantBaseline="central"
          textAnchor="middle"
          fontFamily='"Noto Serif SC","Songti SC",serif'
          fontWeight={700}
          fontSize={text.length === 1 ? 20 : text.length === 2 ? 14 : 10}
          letterSpacing={text.length > 2 ? '-0.05em' : 0}
          fill="#fff8f0"
          opacity={0.95}
        >
          {text}
        </text>
        {/* 偶尔用印的瑕疵小白点（增加真实感） */}
        <circle cx={11} cy={9} r={0.6} fill="#fff8f0" opacity={0.4} />
        <circle cx={33} cy={36} r={0.5} fill="#fff8f0" opacity={0.3} />
      </svg>
    </div>
  );
};

export default SealStamp;
