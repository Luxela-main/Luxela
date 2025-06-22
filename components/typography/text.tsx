import React from 'react';

interface IProps {
  children: React.ReactNode;
  color?: 'default' | 'muted' | 'white' | 'gold' | 'primary';
  font?: 'normal' | 'semibold' | 'bold';
  size?:
    | 'xs'
    | 'sm'
    | 'md'
    | 'base'
    | 'lg'
    | 'xl2'
    | 'xl3'
    | 'xl4'
    | 'xl5'
    | 'xl6'
    | 'xl7'
    | 'xl8'
    | 'xl9';
  className?: string;
  onClick?: () => void;
}

export const ApText: React.FC<IProps> = ({
  children,
  color = 'default',
  size = 'base',
  font = 'light',
  className,
  onClick
}) => {
  return (
    <div
      className={`${FONT_SIZE[size]} ${TEXT_COLOR[color]} font-${font} !${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

const TEXT_COLOR = {
  default: 'text-neutral-900',
  muted: 'text-gray-400',
  white: 'text-white',
  gold: 'text-primary',
  primary: 'text-primary'
};

const FONT_SIZE = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-md',
  base: 'text-base',
  lg: 'text-lg',
  xl2: 'text-2xl',
  xl3: 'text-3xl',
  xl4: 'text-4xl',
  xl5: 'text-5xl',
  xl6: 'text-6xl',
  xl7: 'text-7xl',
  xl8: 'text-8xl',
  xl9: 'text-9xl'
};
