import { DateFormat } from '../types';

export function formatDate(date: Date | string, format: DateFormat): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();

  switch (format) {
    case 'dd/MM/yyyy':
      return `${day}/${month}/${year}`;
    case 'MM/dd/yyyy':
      return `${month}/${day}/${year}`;
    case 'yyyy-MM-dd':
      return `${year}-${month}-${day}`;
    default:
      return `${day}/${month}/${year}`;
  }
}

export const dateInputStyle = {
  width: '100%',
  height: '40px',
  padding: '0.5rem 0.75rem',
  border: '1px solid #D1D5DB',
  borderRadius: '0.375rem',
  backgroundColor: 'white',
  cursor: 'pointer',
  color: 'transparent',
} as const;

export const dateDisplayStyle = {
  position: 'absolute',
  top: '50%',
  left: '12px',
  transform: 'translateY(-50%)',
  pointerEvents: 'none',
  userSelect: 'none',
  color: '#374151',
  backgroundColor: 'transparent',
} as const;