'use client';
import React from 'react';
type SortDir = 'asc' | 'desc' | null;

type ThProps = React.PropsWithChildren<React.ThHTMLAttributes<HTMLTableCellElement> & {
  className?: string; sortable?: boolean; sortDirection?: SortDir; onClick?: () => void;
}>;
export function Th({ children, className = '', sortable, sortDirection, onClick, ...rest }: ThProps) {
  const ariaSort: React.AriaAttributes['aria-sort'] =
    sortDirection === 'asc' ? 'ascending' : sortDirection === 'desc' ? 'descending' : 'none';
  const handleKeyDown: React.KeyboardEventHandler<HTMLTableCellElement> = (e) => {
    if (!sortable) return; if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); }
  };
  return (
    <th {...rest} aria-sort={ariaSort}
      onClick={sortable ? onClick : undefined}
      onKeyDown={sortable ? handleKeyDown : undefined}
      tabIndex={sortable ? 0 : undefined}
      className={[
        'px-4 py-3 text-left font-semibold text-orange-900 whitespace-nowrap',
        'bg-orange-100 border-b-2 border-orange-200',
        sortable ? 'cursor-pointer hover:bg-orange-200 transition-colors' : '',
        sortDirection ? 'bg-orange-200' : '', className,
      ].join(' ')}
    >
      <div className="flex items-center gap-2 select-none">
        {children}
        {sortable && <span aria-hidden="true" className="text-orange-600">
          {sortDirection === 'asc' ? '↑' : sortDirection === 'desc' ? '↓' : '↕'}
        </span>}
      </div>
    </th>
  );
}

type TdProps = React.PropsWithChildren<React.TdHTMLAttributes<HTMLTableCellElement> & { className?: string; highlight?: boolean; }>;
export function Td({ children, className = '', highlight, ...rest }: TdProps) {
  return (
    <td {...rest}
      className={[
        'px-4 py-3 align-middle border-b border-orange-100 transition-colors duration-150',
        highlight ? 'bg-orange-50 font-medium' : 'text-orange-800', className,
      ].join(' ')}
    >{children}</td>
  );
}
