import * as React from 'react';

import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'padrao' | 'destrutivo' | 'contorno' | 'secundario' | 'fantasma' | 'link';
  tamanho?: 'padrao' | 'pequeno' | 'grande' | 'icone';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variante = 'padrao',
      tamanho = 'padrao',
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-green-600 text-white hover:bg-green-700': variante === 'padrao',
            'bg-red-500 text-white hover:bg-red-600': variante === 'destrutivo',
            'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100':
              variante === 'contorno',
            'bg-gray-100 text-gray-900 hover:bg-gray-200': variante === 'secundario',
            'hover:bg-gray-100 hover:text-gray-900': variante === 'fantasma',
            'text-green-600 underline-offset-4 hover:underline': variante === 'link',

            'h-10 px-4 py-2': tamanho === 'padrao',
            'h-9 rounded-md px-3': tamanho === 'pequeno',
            'h-11 rounded-md px-8': tamanho === 'grande',
            'h-10 w-10': tamanho === 'icone',
          },
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';

export { Button };