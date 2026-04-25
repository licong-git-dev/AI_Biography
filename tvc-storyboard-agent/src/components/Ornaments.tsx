import React from 'react';

/**
 * 古籍风格装饰元素库。所有路径均为细线条 SVG，受 currentColor 控制颜色，
 * 可以自由叠在卡片角落、标题前后、modal 边角等位置。
 *
 * 设计参考：明清木刻书叶花纹、卷草纹、回纹边花。线条粗细 1-1.5px，留白居多。
 */

interface OrnProps {
  size?: number;
  className?: string;
}

/** 卷草角花：左上 / 右上 / 左下 / 右下 都用同一个，靠 transform 翻转 */
export const CornerFlourish: React.FC<OrnProps> = ({
  size = 24,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
  >
    {/* 主弧 — 角部抛物线 */}
    <path d="M2 22 Q 2 12 12 12 Q 22 12 22 2" opacity={0.6} />
    {/* 内层呼应 */}
    <path d="M5 22 Q 5 15 12 15 Q 19 15 19 5" opacity={0.35} />
    {/* 卷草小钩 */}
    <path d="M22 2 Q 19 3 19 6" opacity={0.5} />
    <path d="M2 22 Q 3 19 6 19" opacity={0.5} />
    {/* 中央点饰 */}
    <circle cx={12} cy={12} r={1} fill="currentColor" opacity={0.4} stroke="none" />
  </svg>
);

/** 居中花瓣分隔：用作章节 / 段落之间的标志 */
export const DividerOrnament: React.FC<{
  width?: number;
  className?: string;
}> = ({ width = 120, className = '' }) => (
  <svg
    width={width}
    height={20}
    viewBox="0 0 120 20"
    fill="none"
    className={className}
    aria-hidden
  >
    <defs>
      <linearGradient id="orn-fade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="currentColor" stopOpacity={0} />
        <stop offset="50%" stopColor="currentColor" stopOpacity={0.5} />
        <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
      </linearGradient>
    </defs>
    {/* 左右长线 */}
    <line
      x1={0}
      y1={10}
      x2={48}
      y2={10}
      stroke="url(#orn-fade)"
      strokeWidth={1}
    />
    <line
      x1={72}
      y1={10}
      x2={120}
      y2={10}
      stroke="url(#orn-fade)"
      strokeWidth={1}
    />
    {/* 中央花瓣 */}
    <g
      transform="translate(60 10)"
      stroke="currentColor"
      strokeWidth={1}
      fill="none"
      opacity={0.7}
    >
      <path d="M-6 0 Q -3 -3 0 0 Q 3 -3 6 0 Q 3 3 0 0 Q -3 3 -6 0" />
      <circle cx={0} cy={0} r={1} fill="currentColor" stroke="none" />
    </g>
  </svg>
);

/** 卷草边章封首符号：用作 modal 标题、章节标题前的小印记 */
export const SealMark: React.FC<OrnProps> = ({ size = 14, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth={0.8}
    className={className}
    aria-hidden
  >
    <rect
      x={1.5}
      y={1.5}
      width={11}
      height={11}
      rx={1}
      strokeOpacity={0.7}
    />
    <rect
      x={3.5}
      y={3.5}
      width={7}
      height={7}
      rx={0.5}
      strokeOpacity={0.4}
    />
    <circle cx={7} cy={7} r={1} fill="currentColor" stroke="none" opacity={0.6} />
  </svg>
);

/** 章首装饰：完整的章节起始横饰，含两侧角花 + 中央花瓣 */
export const ChapterHeadingOrnament: React.FC<{ className?: string }> = ({
  className = '',
}) => (
  <div className={`flex items-center justify-center gap-3 ${className}`}>
    <CornerFlourish size={20} className="rotate-180" />
    <DividerOrnament width={140} />
    <CornerFlourish size={20} />
  </div>
);

/** 卡片角装饰套装：四个角的 corner ornament 包裹层 */
export const CardCornersWrap: React.FC<{
  children: React.ReactNode;
  className?: string;
  cornerSize?: number;
  cornerColor?: string;
}> = ({ children, className = '', cornerSize = 16, cornerColor = 'text-sepia-700/40' }) => (
  <div className={`relative ${className}`}>
    <CornerFlourish
      size={cornerSize}
      className={`absolute left-1 top-1 ${cornerColor}`}
    />
    <CornerFlourish
      size={cornerSize}
      className={`absolute right-1 top-1 -scale-x-100 ${cornerColor}`}
    />
    <CornerFlourish
      size={cornerSize}
      className={`absolute left-1 bottom-1 -scale-y-100 ${cornerColor}`}
    />
    <CornerFlourish
      size={cornerSize}
      className={`absolute right-1 bottom-1 -scale-100 ${cornerColor}`}
    />
    {children}
  </div>
);
