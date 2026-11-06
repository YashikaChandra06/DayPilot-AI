import { Note, Task, Transaction } from '../types';

export const exportTransactionsToCSV = (transactions: Transaction[], currency: string = 'INR') => {
  const headers = ['Date', 'Type', 'Category', 'Merchant', 'Amount', 'Currency', 'Status', 'Notes'];
  const rows = transactions.map((t) => [
    new Date(t.transactionDate || t.createdAt).toLocaleDateString(),
    t.type,
    `"${(t.category || '').replace(/"/g, '""')}"`,
    `"${(t.merchant || '').replace(/"/g, '""')}"`,
    t.amount,
    t.currency || currency,
    t.confirmationStatus,
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadBlob(csvContent, `daypilot-expenses-${getTimestamp()}.csv`, 'text/csv;charset=utf-8;');
};

export const exportTasksToCSV = (tasks: Task[]) => {
  const headers = ['Title', 'Priority', 'Status', 'Due Date', 'Due Time', 'Description', 'Created At'];
  const rows = tasks.map((t) => [
    `"${(t.title || '').replace(/"/g, '""')}"`,
    t.priority,
    t.status,
    t.dueDate || '',
    t.dueTime || '',
    `"${(t.description || '').replace(/"/g, '""')}"`,
    new Date(t.createdAt).toLocaleDateString(),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadBlob(csvContent, `daypilot-tasks-${getTimestamp()}.csv`, 'text/csv;charset=utf-8;');
};

export const exportNotesToMarkdown = (notes: Note[]) => {
  let md = `# DayPilot AI — Personal Notes Export\nExported on: ${new Date().toLocaleString()}\n\n---\n\n`;

  notes.forEach((n, idx) => {
    md += `## ${idx + 1}. ${n.title}\n`;
    md += `*Category: ${n.category || 'General'} | Created: ${new Date(n.createdAt).toLocaleDateString()}*\n\n`;
    if (n.tags && n.tags.length > 0) {
      md += `**Tags:** ${n.tags.map((tag) => `#${tag}`).join(' ')}\n\n`;
    }
    if (n.summary?.standard) {
      md += `> **Summary:** ${n.summary.standard}\n\n`;
    }
    md += `${n.originalContent}\n\n`;
    if (n.keyPoints && n.keyPoints.length > 0) {
      md += `**Key Points:**\n${n.keyPoints.map((p) => `- ${p}`).join('\n')}\n\n`;
    }
    if (n.actionItems && n.actionItems.length > 0) {
      md += `**Action Items:**\n${n.actionItems.map((a) => `- [ ] ${a}`).join('\n')}\n\n`;
    }
    md += `---\n\n`;
  });

  downloadBlob(md, `daypilot-notes-${getTimestamp()}.md`, 'text/markdown;charset=utf-8;');
};

export const exportNotesToJSON = (notes: Note[]) => {
  const jsonContent = JSON.stringify(notes, null, 2);
  downloadBlob(jsonContent, `daypilot-notes-${getTimestamp()}.json`, 'application/json');
};

const getTimestamp = () => {
  return new Date().toISOString().slice(0, 10);
};

const downloadBlob = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

