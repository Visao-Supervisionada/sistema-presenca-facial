import * as React from 'react';

import { cn } from '@/lib/utils';

export interface BadgeProps extends React.ComponentProps<'div'> {
  variante?: 'padrao' | 'secundario' | 'destrutivo' | 'contorno' | 'sucesso';
}

function Badge({ className, variante = 'padrao', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        {
          'border-transparent bg-green-600 text-white': variante === 'padrao',
          'border-transparent bg-gray-100 text-gray-900': variante === 'secundario',
          'border-transparent bg-red-500 text-white': variante === 'destrutivo',
          'border-gray-300 text-gray-900': variante === 'contorno',
          'border-transparent bg-green-500 text-white': variante === 'sucesso',
        },
        className,
      )}
      {...props}
    />
  );
}

export { Badge };