import React from 'react';

interface PagerProps {
  page: number;
  totalPages: number;
  total: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
}

export const Pager: React.FC<PagerProps> = ({ page, totalPages, total, loading = false, onPageChange }) => {
  const pages = Math.max(totalPages, 1);
  return (
    <div className="pager">
      <button type="button" className="pager-btn" disabled={loading || page <= 1} onClick={() => onPageChange(page - 1)}>
        Prev
      </button>
      <span className="pager-info" aria-live="polite">
        Page {page} of {pages} · {total.toLocaleString()} total
      </span>
      <button type="button" className="pager-btn" disabled={loading || page >= pages} onClick={() => onPageChange(page + 1)}>
        Next
      </button>
    </div>
  );
};
