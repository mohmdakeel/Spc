export type PrintDocumentOptions = {
  title: string;
  subtitle?: string;
  contentHtml: string;
  printedBy?: string;
  pageOrientation?: 'portrait' | 'landscape';
  extraCss?: string;
};

const COMPANY = {
  name: 'State Printing Corporation',
  tagline: 'Official ERP Workspace',
  address: 'Panaluwa, Watareka, Padukka, Sri Lanka',
  contact: 'Phone: 0112757505 / 0112859308 • Fax: 011-2757506 • Email: chairmanspc2022@gmail.com • www.spclanka.gov.lk',
};

export const escapeHtml = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return char;
    }
  });
};

const buildHtml = ({
  title,
  subtitle,
  contentHtml,
  printedBy,
  pageOrientation,
  extraCss,
}: PrintDocumentOptions) => {
  const now = new Date();
  const printedOn = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
  const orientation =
    pageOrientation === 'landscape' ? 'landscape' : 'portrait';
  const logoUrl =
    typeof window !== 'undefined'
      ? new URL('/spclogopic.png', window.location.origin).toString()
      : '/spclogopic.png';

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      @page {
        margin: 15mm;
        size: A4 ${orientation};
      }
      body {
        margin: 0;
        font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
        color: #1f2937;
        background: #ffffff;
      }
      .spc-print {
        max-width: 960px;
        margin: 0 auto;
        padding: 32px 36px;
      }
      .spc-print__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 2px solid #ea580c;
        padding-bottom: 16px;
        margin-bottom: 24px;
        gap: 24px;
      }
      .spc-brand {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .spc-brand__logo {
        width: 64px;
        height: 64px;
        border-radius: 18px;
        border: 1px solid rgba(249, 115, 22, 0.35);
        background: rgba(249, 115, 22, 0.08);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px;
      }
      .spc-brand__logo img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      .spc-brand__text {
        line-height: 1.3;
      }
      .spc-brand__name {
        font-size: 1.25rem;
        font-weight: 700;
        margin: 0;
        color: #7c2d12;
      }
      .spc-brand__tagline {
        font-size: 0.9rem;
        margin: 0;
        color: #9a3412;
      }
      .spc-brand__meta {
        font-size: 0.8rem;
        margin: 4px 0 0;
        color: #6b7280;
      }
      .spc-document-meta {
        text-align: right;
        font-size: 0.85rem;
        color: #4b5563;
      }
      .spc-document-meta strong {
        display: block;
        color: #111827;
      }
      .spc-print__body h1 {
        font-size: 1.4rem;
        margin: 0 0 6px;
        color: #111827;
      }
      .spc-print__body h2 {
        font-size: 1rem;
        margin: 0 0 18px;
        color: #6b7280;
        font-weight: 500;
      }
      .spc-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        margin-top: 12px;
        font-size: 0.88rem;
        border: 1px solid #f0d5bf;
        border-radius: 12px;
        overflow: hidden;
      }
      .spc-table thead th {
        text-align: left;
        padding: 8px 10px;
        background: #fff1e6;
        color: #7c2d12;
        border: 1px solid #f9d6b4;
        font-size: 0.82rem;
      }
      .spc-table tbody td {
        padding: 8px 10px;
        border-bottom: 1px solid #f0d5bf;
        border-right: 1px solid #f0d5bf;
        color: #374151;
      }
      .spc-table tr:last-child td {
        border-bottom: none;
      }
      .spc-empty {
        padding: 16px;
        border: 1px dashed #f8c4a0;
        background: #fff8f0;
        text-align: center;
        font-size: 0.9rem;
        color: #92400e;
        border-radius: 8px;
        margin-top: 16px;
      }
      .spc-section {
        border: 1px solid #f4d6be;
        border-radius: 14px;
        padding: 16px 20px;
        margin-top: 16px;
        background: #fffdfb;
      }
      .spc-section + .spc-section {
        margin-top: 20px;
      }
      .spc-section__title {
        font-size: 1rem;
        font-weight: 600;
        margin: 0 0 12px;
        color: #1f2937;
      }
      .spc-definition {
        width: 100%;
        border-collapse: collapse;
      }
      .spc-definition td {
        padding: 6px 0;
        font-size: 0.9rem;
        vertical-align: top;
      }
      .spc-definition td:first-child {
        width: 35%;
        font-weight: 600;
        color: #4b5563;
      }
      .spc-definition td:last-child {
        color: #111827;
      }
      .spc-chip {
        display: inline-flex;
        align-items: center;
        padding: 2px 10px;
        border-radius: 999px;
        font-size: 0.78rem;
        font-weight: 600;
        margin: 2px 6px 0 0;
      }
      .spc-chip--role {
        background: #fff3e0;
        border: 1px solid #fdba74;
        color: #9a3412;
      }
      .spc-chip--perm {
        background: #e0f2fe;
        border: 1px solid #93c5fd;
        color: #1e3a8a;
      }
      .spc-print__footer {
        margin-top: 32px;
        display: flex;
        flex-wrap: wrap;
        gap: 32px;
        font-size: 0.85rem;
        color: #374151;
      }
      .spc-signature__field {
        min-width: 220px;
      }
      .spc-signature__value {
        display: block;
        min-height: 24px;
        border-bottom: 1px solid #d1d5db;
        margin-top: 6px;
      }
      @media print {
        body {
          background: #fff;
        }
        .spc-print {
          padding: 0;
        }
      }
      ${extraCss || ''}
    </style>
  </head>
  <body>
    <main class="spc-print">
      <header class="spc-print__header">
        <div class="spc-brand">
          <div class="spc-brand__logo">
            <img src="${logoUrl}" alt="${escapeHtml(COMPANY.name)} logo" />
          </div>
          <div class="spc-brand__text">
            <p class="spc-brand__name">${escapeHtml(COMPANY.name)}</p>
            <p class="spc-brand__tagline">${escapeHtml(COMPANY.tagline)}</p>
            <p class="spc-brand__meta">${escapeHtml(COMPANY.address)} • ${escapeHtml(
    COMPANY.contact,
  )}</p>
          </div>
        </div>
        <div class="spc-document-meta">
          <strong>${escapeHtml(title)}</strong>
          ${subtitle ? `<span>${escapeHtml(subtitle)}</span>` : ''}
          <span>Printed on: ${escapeHtml(printedOn)}</span>
        </div>
      </header>
      <section class="spc-print__body">
        ${contentHtml}
      </section>
      <section class="spc-print__footer">
        <div class="spc-signature__field">
          Printed by
          <span class="spc-signature__value">${
            printedBy ? escapeHtml(printedBy) : '&nbsp;'
          }</span>
        </div>
        <div class="spc-signature__field">
          Authorised Signature
          <span class="spc-signature__value"></span>
        </div>
      </section>
    </main>
    <script>
      window.addEventListener('load', () => {
        setTimeout(() => {
          window.focus();
          window.print();
          setTimeout(() => window.close(), 400);
        }, 200);
      });
    </script>
  </body>
</html>`;
};

export const printDocument = (options: PrintDocumentOptions) => {
  if (typeof window === 'undefined') return;
  const html = buildHtml(options);
  const printWindow = window.open('', '_blank', 'width=1024,height=768');
  if (!printWindow) return;
  try {
    printWindow.opener = null;
  } catch {
    /* ignore */
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

export const guessPrintedBy = () => {
  if (typeof window === 'undefined') return undefined;
  const candidates = [
    'fullName',
    'username',
    'actor',
    'applicantName',
    'employeeName',
  ];
  for (const key of candidates) {
    const value = window.localStorage?.getItem(key);
    if (value && value.trim().length) return value;
  }
  return undefined;
};
