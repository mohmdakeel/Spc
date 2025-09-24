'use client';
import React from 'react';

type SortDir = 'asc' | 'desc' | null;

type ThProps = React.PropsWithChildren<
  React.ThHTMLAttributes<HTMLTableCellElement> & {
    className?: string;
    sortable?: boolean;
    sortDirection?: SortDir;
    onClick?: () => void;
  }
>;

export function Th({ children, className = '', sortable, sortDirection, onClick, ...rest }: ThProps) {
  const ariaSort: React.AriaAttributes['aria-sort'] =
    sortDirection === 'asc' ? 'ascending' : sortDirection === 'desc' ? 'descending' : 'none';

  const handleKeyDown: React.KeyboardEventHandler<HTMLTableCellElement> = (e) => {
    if (!sortable) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); }
  };

  return (
    <th
      {...rest}
      aria-sort={ariaSort}
      onClick={sortable ? onClick : undefined}
      onKeyDown={sortable ? handleKeyDown : undefined}
      tabIndex={sortable ? 0 : undefined}
      className={[
        // compact on small screens
        'px-2 py-2 md:px-3 md:py-2.5 text-left font-semibold text-orange-900',
        // allow wrapping so table never forces horizontal scroll
        'whitespace-normal align-middle leading-snug',
        'bg-orange-100 border-b-2 border-orange-200',
        sortable ? 'cursor-pointer hover:bg-orange-200 transition-colors' : '',
        sortDirection ? 'bg-orange-200' : '',
        className,
      ].join(' ')}
    >
      <div className="flex items-center gap-2 select-none">
        {children}
        {sortable && (
          <span aria-hidden="true" className="text-orange-600">
            {sortDirection === 'asc' ? '↑' : sortDirection === 'desc' ? '↓' : '↕'}
          </span>
        )}
      </div>
    </th>
  );
}

type TdProps = React.PropsWithChildren<
  React.TdHTMLAttributes<HTMLTableCellElement> & {
    className?: string;
    highlight?: boolean;
  }
>;

export function Td({ children, className = '', highlight, ...rest }: TdProps) {
  return (
    <td
      {...rest}
      className={[
        'px-2 py-2 md:px-3 md:py-2.5 align-top border-b border-orange-100 transition-colors duration-150',
        // wrap by default (no truncation) so large text becomes 2+ lines instead of causing x-scroll
        'whitespace-normal break-words leading-snug text-orange-800',
        highlight ? 'bg-orange-50 font-medium' : '',
        className,
      ].join(' ')}
    >
      {children}
    </td>
  );
}
