export function formatCurrency(amount: number): string {
  return `S/ ${new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMonthKey(dateStr: string): string {
  return dateStr.substring(0, 7); // YYYY-MM
}

export function getMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('es-PE', { month: 'short', year: '2-digit' });
}

export function getLast6Months(): string[] {
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - i);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    months.push(`${year}-${month}`);
  }
  return months;
}
