export const exportToCsv = (data: any[], filename: string) => {
  const headers = Object.keys(data[0] || {}).filter(key => key !== 'id');
  const csv = [
    headers.join(','),
    ...data.map(row =>
      headers.map(key => {
        const value = row[key] ?? '';
        return typeof value === 'string' && value.includes(',')
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};