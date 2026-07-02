import jsPDF from 'jspdf';

/**
 * Generates a professional PDF invoice for EzeeRoom subscription charges.
 *
 * Issuer: EzeeRoom (DCPL)
 * Billed to: Hotel
 *
 * @param {Object} invoiceData - Invoice data from GET /api/invoices/{id}
 */
const loadImageAsBase64 = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });

export const generateSubscriptionInvoice = async (invoiceData = {}) => {
  const doc = new jsPDF();
  const pageWidth  = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentRight = pageWidth - margin;

  // ── Palette (same family as receiptGenerator) ──────────────────────────────
  const NAVY   = [30, 58, 95];
  const GREEN  = [5, 150, 105];
  const AMBER  = [180, 83, 9];
  const RED    = [185, 28, 28];
  const INK    = [15, 23, 42];
  const MUTED  = [100, 116, 139];
  const SURFACE= [248, 250, 252];
  const BORDER = [226, 232, 240];
  const WHITE  = [255, 255, 255];

  const ink    = (c) => doc.setTextColor(c[0], c[1], c[2]);
  const fill   = (c) => doc.setFillColor(c[0], c[1], c[2]);
  const stroke = (c) => doc.setDrawColor(c[0], c[1], c[2]);

  const currency = invoiceData.currency || 'BTN';
  const symbol = currency === 'BTN' ? 'Nu.' : currency;
  const fmtAmt = (v) =>
    `${symbol} ${parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const fmtDate = (val) => {
    if (!val) return 'N/A';
    const d = new Date(val);
    const day = d.getDate();
    const suffix = [, 'st', 'nd', 'rd'][day] || 'th';
    const mon = d.toLocaleDateString('en-US', { month: 'short' });
    return `${day}${suffix} ${mon}, ${d.getFullYear()}`;
  };

  const status = invoiceData.status || 'ISSUED';
  const isPaid = status === 'PAID';
  const isOverdue = status === 'OVERDUE';

  // ── Top accent bar ──────────────────────────────────────────────────────────
  fill(NAVY);
  doc.rect(0, 0, pageWidth, 4, 'F');

  // ── Header: logo + "INVOICE" title ─────────────────────────────────────────
  const [logoData, sealData] = await Promise.all([
    loadImageAsBase64('/images/receiptLogo.png'),
    loadImageAsBase64('/images/dragon-coders-logo.png'),
  ]);
  if (logoData) {
    doc.addImage(logoData, 'PNG', margin, 14, 46, 15);
  } else {
    ink(NAVY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('EzeeRoom', margin, 24);
  }

  ink(NAVY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('INVOICE', contentRight, 22, { align: 'right' });
  ink(MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Subscription Tax Invoice', contentRight, 28, { align: 'right' });

  stroke(BORDER);
  doc.setLineWidth(0.4);
  doc.line(margin, 38, contentRight, 38);

  // ── Parties ─────────────────────────────────────────────────────────────────
  const partiesY = 48;

  // FROM – EzeeRoom (left)
  ink(MUTED);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('FROM', margin, partiesY);
  ink(INK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('EzeeRoom', margin, partiesY + 6);
  ink(MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  let fromY = partiesY + 12;
  ['DCPL, Thimphu, Bhutan', 'support@ezeeroom.bt'].forEach((line) => {
    doc.text(line, margin, fromY);
    fromY += 5;
  });

  // BILLED TO – Hotel (right)
  ink(MUTED);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('BILLED TO', contentRight, partiesY, { align: 'right' });
  ink(INK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(invoiceData.hotelName || 'Hotel', contentRight, partiesY + 6, { align: 'right' });
  ink(MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  let toY = partiesY + 12;
  [invoiceData.hotelAddress, invoiceData.hotelDistrict, invoiceData.hotelEmail, invoiceData.hotelPhone]
    .filter(Boolean)
    .forEach((line) => {
      doc.text(line, contentRight, toY, { align: 'right' });
      toY += 5;
    });

  let yPosition = Math.max(fromY, toY) + 8;

  // ── Meta strip: Invoice No / Issue Date / Due Date ──────────────────────────
  const stripH = 20;
  fill(SURFACE);
  stroke(BORDER);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, yPosition, contentRight - margin, stripH, 2, 2, 'FD');

  const colW = (contentRight - margin) / 3;
  [
    { label: 'INVOICE NO',  value: invoiceData.invoiceNumber || 'N/A' },
    { label: 'ISSUE DATE',  value: fmtDate(invoiceData.issueDate) },
    { label: 'DUE DATE',    value: fmtDate(invoiceData.dueDate) },
  ].forEach(({ label, value }, i) => {
    const cx = margin + colW * i + 6;
    ink(MUTED);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(label, cx, yPosition + 7);
    ink(INK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(String(value), cx, yPosition + 13);
  });

  yPosition += stripH + 10;

  // ── Billing period note ─────────────────────────────────────────────────────
  if (invoiceData.periodDescription) {
    ink(MUTED);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Billing period: ${invoiceData.periodDescription}`, margin, yPosition);
    yPosition += 10;
  }

  // ── Line items table ────────────────────────────────────────────────────────
  const itemX  = margin + 4;
  const qtyR   = margin + 96;
  const unitR  = margin + 140;
  const amtR   = contentRight - 4;

  // Header
  fill(NAVY);
  doc.rect(margin, yPosition, contentRight - margin, 10, 'F');
  ink(WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  const headerY = yPosition + 6.5;
  doc.text('DESCRIPTION', itemX, headerY);
  doc.text('QTY', qtyR, headerY, { align: 'right' });
  doc.text('UNIT PRICE', unitR, headerY, { align: 'right' });
  doc.text('AMOUNT', amtR, headerY, { align: 'right' });
  yPosition += 10;

  const lineItems = invoiceData.lineItems && invoiceData.lineItems.length > 0
    ? invoiceData.lineItems
    : [{ description: 'EzeeRoom Subscription', quantity: 1, unitPrice: invoiceData.totalAmount, amount: invoiceData.totalAmount }];

  lineItems.forEach((item, idx) => {
    const rowBg = idx % 2 === 0 ? null : SURFACE;
    if (rowBg) { fill(rowBg); doc.rect(margin, yPosition, contentRight - margin, 12, 'F'); }
    ink(INK);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    const descLines = doc.splitTextToSize(item.description || '', qtyR - itemX - 8);
    doc.text(descLines, itemX, yPosition + 7.5);
    doc.text(String(item.quantity || 1), qtyR, yPosition + 7.5, { align: 'right' });
    doc.text(fmtAmt(item.unitPrice), unitR, yPosition + 7.5, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(fmtAmt(item.amount), amtR, yPosition + 7.5, { align: 'right' });
    yPosition += 12;
  });

  stroke(BORDER);
  doc.setLineWidth(0.4);
  doc.line(margin, yPosition, contentRight, yPosition);
  yPosition += 12;

  // ── Total band ──────────────────────────────────────────────────────────────
  const totalBoxW = 86;
  const totalBoxX = contentRight - totalBoxW;
  fill(NAVY);
  doc.roundedRect(totalBoxX, yPosition, totalBoxW, 14, 2, 2, 'F');
  ink(WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TOTAL', totalBoxX + 6, yPosition + 9);
  doc.setFontSize(12);
  doc.text(fmtAmt(invoiceData.totalAmount), contentRight - 6, yPosition + 9.5, { align: 'right' });
  yPosition += 14 + 14;

  // ── Status pill ─────────────────────────────────────────────────────────────
  const pillColor = isPaid ? GREEN : isOverdue ? RED : AMBER;
  const pillLabel = isPaid ? 'PAID' : isOverdue ? 'OVERDUE' : 'ISSUED';
  const pillW = 52;
  const pillH = 16;
  fill(pillColor);
  doc.roundedRect(margin, yPosition, pillW, pillH, 2, 2, 'F');
  ink(WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(pillLabel, margin + pillW / 2, yPosition + pillH / 2 + 4, { align: 'center' });

  if (!isPaid) {
    const noteX = margin + pillW + 6;
    const noteW = contentRight - noteX;
    fill(SURFACE);
    stroke(BORDER);
    doc.setLineWidth(0.4);
    doc.roundedRect(noteX, yPosition, noteW, pillH, 2, 2, 'FD');
    ink(MUTED);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('Payment due by', noteX + 6, yPosition + pillH / 2 + 0);
    ink(INK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(fmtDate(invoiceData.dueDate), contentRight - 6, yPosition + pillH / 2 + 3.5, { align: 'right' });
  } else {
    const paidX = margin + pillW + 6;
    const paidW = contentRight - paidX;
    fill(SURFACE);
    stroke(BORDER);
    doc.setLineWidth(0.4);
    doc.roundedRect(paidX, yPosition, paidW, pillH, 2, 2, 'FD');
    ink(MUTED);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('Amount paid', paidX + 6, yPosition + pillH / 2 + 3.5);
    ink(INK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(fmtAmt(invoiceData.totalAmount), contentRight - 6, yPosition + pillH / 2 + 4, { align: 'right' });
  }

  yPosition += pillH + 18;

  // ── Footer ───────────────────────────────────────────────────────────────────
  stroke(BORDER);
  doc.setLineWidth(0.4);
  doc.line(margin, yPosition, contentRight, yPosition);
  yPosition += 8;

  // Company details (left)
  let companyY = yPosition;
  ink(NAVY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('EzeeRoom', margin, companyY);
  companyY += 6;
  ink(MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('192 Dondrup Zur Lam 12 Se, Thimphu 11001 Bhutan', margin, companyY);
  companyY += 5;
  doc.text('Email: choegyell@gmail.com', margin, companyY);
  companyY += 5;
  doc.text('Phone: +975 17124535', margin, companyY);
  companyY += 5;
  doc.text('Website: www.ezeeroom.bt', margin, companyY);
  companyY += 9;

  ink(INK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Business Registration', margin, companyY);
  companyY += 5;
  ink(MUTED);
  doc.setFont('helvetica', 'normal');
  doc.text('Dragon Coders Private Limited', margin, companyY);
  companyY += 5;
  doc.text('Registered in Bhutan', margin, companyY);
  companyY += 5;
  doc.text('Tax ID: As per Bhutan Revenue & Customs', margin, companyY);

  // Dragon Coders seal (right)
  const sealW = 62;
  const sealH = 16;
  const sealX = contentRight - sealW;
  const sealY = yPosition + 2;
  if (sealData) {
    doc.addImage(sealData, 'PNG', sealX, sealY, sealW, sealH);
  }
  ink(MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Issued by', sealX + sealW / 2, sealY + sealH + 5, { align: 'center' });

  // Bottom navy accent bar (mirrors top)
  fill(NAVY);
  doc.rect(0, pageHeight - 4, pageWidth, 4, 'F');

  // ── Save ─────────────────────────────────────────────────────────────────────
  const filename = `EzeeRoom-Invoice-${invoiceData.invoiceNumber || 'invoice'}.pdf`;
  doc.save(filename);
};
