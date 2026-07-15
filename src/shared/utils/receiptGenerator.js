import jsPDF from 'jspdf';

/**
 * Helper function to load image as base64
 */
const loadImageAsBase64 = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imgData = canvas.toDataURL('image/png');
        resolve(imgData);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
};

/**
 * Generates a professional PDF receipt (Swiss-minimal, navy professional palette).
 * Content is unchanged — only the layout/visual design is refined.
 * Uses only fields from the API receipt response.
 *
 * @param {Object} booking - Booking object (kept for backward compatibility, but not used)
 * @param {Object} receiptData - Receipt data from API response
 */
export const generateBookingReceipt = async (booking, receiptData = {}) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentRight = pageWidth - margin;

  // Determine receipt type
  const receiptType = receiptData.receiptType || 'BOOKING';
  const isBooking = receiptType === 'BOOKING';
  const isSubscription = receiptType === 'SUBSCRIPTION';

  // ── Palette: Swiss minimalism / navy professional ──────────────────────────
  const NAVY = [30, 58, 95];      // #1E3A5F  primary
  const GREEN = [5, 150, 105];    // #059669  paid
  const INK = [15, 23, 42];       // #0F172A  foreground
  const MUTED = [100, 116, 139];  // #64748B  labels / secondary
  const SURFACE = [248, 250, 252];// #F8FAFC  light surface
  const BORDER = [226, 232, 240]; // #E2E8F0  hairlines
  const WHITE = [255, 255, 255];

  const ink = (c) => doc.setTextColor(c[0], c[1], c[2]);
  const fill = (c) => doc.setFillColor(c[0], c[1], c[2]);
  const stroke = (c) => doc.setDrawColor(c[0], c[1], c[2]);

  // Helper: format currency
  const formatCurrency = (amount) => {
    const currency = receiptData.currency || 'BTN';
    const symbol = currency === 'BTN' ? 'Nu.' : currency;
    const value = parseFloat(amount || 0);
    const sign = value < 0 ? '-' : '';
    return `${sign}${symbol} ${Math.abs(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Helper: format date (e.g., "19th Jul, 2022")
  const formatDateLong = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = date.getDate();
    const daySuffix = day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th';
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${day}${daySuffix} ${month}, ${year}`;
  };

  // ── Top accent bar ──────────────────────────────────────────────────────────
  fill(NAVY);
  doc.rect(0, 0, pageWidth, 4, 'F');

  // ── Header: logo (left) + title (right) ──────────────────────────────────────
  const logoW = 46;
  const logoH = 15;
  try {
    const logoImageData = await loadImageAsBase64('/images/receiptLogo.png');
    doc.addImage(logoImageData, 'PNG', margin, 14, logoW, logoH);
  } catch {
    ink(NAVY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('EzeeRoom', margin, 24);
  }

  ink(NAVY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  const title = isBooking ? 'BOOKING RECEIPT' : 'SUBSCRIPTION RECEIPT';
  doc.text(title, contentRight, 22, { align: 'right' });

  ink(MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Official Payment Receipt', contentRight, 28, { align: 'right' });

  // Header divider
  stroke(BORDER);
  doc.setLineWidth(0.4);
  doc.line(margin, 38, contentRight, 38);

  // ── Parties: BILLED TO (left) / FROM (right) ─────────────────────────────────
  const partiesY = 48;

  // FROM (hotel / business) — always shown
  ink(MUTED);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('FROM', contentRight, partiesY, { align: 'right' });
  ink(INK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(receiptData.hotelName || 'Name of business', contentRight, partiesY + 6, { align: 'right' });
  ink(MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  let fromY = partiesY + 12;
  if (receiptData.hotelPhone) {
    doc.text(receiptData.hotelPhone, contentRight, fromY, { align: 'right' });
    fromY += 5;
  }
  if (receiptData.hotelEmail) {
    doc.text(receiptData.hotelEmail, contentRight, fromY, { align: 'right' });
    fromY += 5;
  }

  // BILLED TO (customer) — booking receipts only
  let billedY = partiesY;
  if (!isSubscription) {
    ink(MUTED);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('BILLED TO', margin, partiesY);
    ink(INK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(receiptData.customerName || 'Name of customer', margin, partiesY + 6);
    ink(MUTED);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    billedY = partiesY + 12;
    if (receiptData.customerPhone) {
      doc.text(receiptData.customerPhone, margin, billedY);
      billedY += 5;
    }
    if (receiptData.customerEmail) {
      doc.text(receiptData.customerEmail, margin, billedY);
      billedY += 5;
    }
  }

  let yPosition = Math.max(billedY, fromY) + 6;

  // ── Meta strip: Receipt No / Receipt Date / Payment Date ─────────────────────
  const stripH = 20;
  fill(SURFACE);
  stroke(BORDER);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, yPosition, contentRight - margin, stripH, 2, 2, 'FD');

  const metaColW = (contentRight - margin) / 3;
  const metaCols = [
    { label: 'RECEIPT NO', value: receiptData.receiptNumber || 'N/A' },
    { label: 'RECEIPT DATE', value: formatDateLong(new Date()) },
    { label: 'PAYMENT DATE', value: formatDateLong(receiptData.updatedAt || receiptData.issueDate || new Date()) },
  ];
  metaCols.forEach((col, i) => {
    const cx = margin + metaColW * i + 6;
    ink(MUTED);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(col.label, cx, yPosition + 7);
    ink(INK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    const valueLines = doc.splitTextToSize(String(col.value), metaColW - 12);
    doc.text(valueLines, cx, yPosition + 13);
  });

  yPosition += stripH + 12;

  // ── Items table ──────────────────────────────────────────────────────────────
  // Column anchors: item is left-aligned; numeric columns are right-aligned.
  const itemX = margin + 4;
  const qtyR = margin + 112;
  const unitR = margin + 142;
  const amtR = contentRight - 4;

  // Header row
  fill(NAVY);
  doc.rect(margin, yPosition, contentRight - margin, 10, 'F');
  ink(WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  const headerTextY = yPosition + 6.5;
  doc.text('ITEM', itemX, headerTextY);
  doc.text('QTY', qtyR, headerTextY, { align: 'right' });
  doc.text('UNIT PRICE', unitR, headerTextY, { align: 'right' });
  doc.text('AMOUNT', amtR, headerTextY, { align: 'right' });
  yPosition += 10;

  // Data rows — for a GST-enabled hotel's booking, break the total into
  // room charges / GST / service tax line items instead of a single flat line.
  const totalPaidAmount = receiptData.amount || 0;
  const itemDescription = receiptData.description || (isBooking ? 'Booking Payment' : 'Subscription Payment');
  const gstAmount = parseFloat(receiptData.gstAmount || 0);
  const serviceTaxAmount = parseFloat(receiptData.serviceTaxAmount || 0);
  const walkInServiceChargeAmount = Math.abs(parseFloat(receiptData.walkInServiceChargeAmount || 0));
  const discountAmount = parseFloat(receiptData.discountAmount || 0);
  const hasTaxBreakdown = isBooking && receiptData.baseAmount != null &&
    (gstAmount > 0 || serviceTaxAmount > 0 || walkInServiceChargeAmount > 0 || discountAmount > 0);

  const lineItems = hasTaxBreakdown
    ? [
        { label: itemDescription, amount: receiptData.baseAmount },
        // gstRate/serviceTaxRate/walkInServiceChargeRate are stored as fractions (e.g. 0.05),
        // so convert to a whole percentage for display (Math.round avoids float artifacts
        // like 0.03 * 100 = 3.0000000000000004).
        ...(walkInServiceChargeAmount > 0
          ? [{ label: `Service Charge${receiptData.walkInServiceChargeRate ? ` (${Math.round(parseFloat(receiptData.walkInServiceChargeRate) * 100)}%)` : ''}${receiptData.walkInServiceChargeInclusive ? ' (incl. in room price)' : ''}`, amount: walkInServiceChargeAmount }]
          : []),
        ...(gstAmount > 0
          ? [{ label: `GST${receiptData.gstRate ? ` (${Math.round(parseFloat(receiptData.gstRate) * 100)}%)` : ''}`, amount: gstAmount }]
          : []),
        ...(serviceTaxAmount > 0
          ? [{ label: `Service Tax${receiptData.serviceTaxRate ? ` (${Math.round(parseFloat(receiptData.serviceTaxRate) * 100)}%)` : ''}`, amount: serviceTaxAmount }]
          : []),
        ...(discountAmount > 0
          ? [{ label: 'Discount', amount: -discountAmount }]
          : []),
      ]
    : [{ label: itemDescription, amount: totalPaidAmount }];

  const rowH = 12;
  lineItems.forEach((item) => {
    const rowTextY = yPosition + 7.5;
    ink(INK);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    const itemLines = doc.splitTextToSize(item.label, qtyR - itemX - 8);
    doc.text(itemLines, itemX, rowTextY);
    doc.text('1', qtyR, rowTextY, { align: 'right' });
    doc.text(formatCurrency(item.amount), unitR, rowTextY, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(item.amount), amtR, rowTextY, { align: 'right' });
    yPosition += rowH;
  });

  stroke(BORDER);
  doc.setLineWidth(0.4);
  doc.line(margin, yPosition, contentRight, yPosition);
  yPosition += 12;

  // ── Total band (right-aligned, navy) ─────────────────────────────────────────
  const totalBoxW = 86;
  const totalBoxX = contentRight - totalBoxW;
  const totalBoxH = 14;
  fill(NAVY);
  doc.roundedRect(totalBoxX, yPosition, totalBoxW, totalBoxH, 2, 2, 'F');
  ink(WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TOTAL', totalBoxX + 6, yPosition + 9);
  doc.setFontSize(12);
  doc.text(formatCurrency(totalPaidAmount), contentRight - 6, yPosition + 9.5, { align: 'right' });
  yPosition += totalBoxH + 14;

  // ── Payment status: PAID pill + amount ───────────────────────────────────────
  const pillW = 42;
  const pillH = 16;
  fill(GREEN);
  doc.roundedRect(margin, yPosition, pillW, pillH, 2, 2, 'F');
  ink(WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('PAID', margin + pillW / 2, yPosition + pillH / 2 + 4, { align: 'center' });

  const payX = margin + pillW + 6;
  const payW = contentRight - payX;
  fill(SURFACE);
  stroke(BORDER);
  doc.setLineWidth(0.4);
  doc.roundedRect(payX, yPosition, payW, pillH, 2, 2, 'FD');
  ink(MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Amount Paid', payX + 6, yPosition + pillH / 2 + 3.5);
  ink(INK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(formatCurrency(totalPaidAmount), contentRight - 6, yPosition + pillH / 2 + 4, { align: 'right' });
  yPosition += pillH + 18;

  // ── Footer ───────────────────────────────────────────────────────────────────
  stroke(BORDER);
  doc.setLineWidth(0.4);
  doc.line(margin, yPosition, contentRight, yPosition);
  yPosition += 10;

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
  companyY += 5;

  // Seal + authorized seal (right) — Dragon Coders logo is 800×211 (3.79:1 landscape)
  const sealW = 62;
  const sealH = 16;
  const sealX = contentRight - sealW;
  const sealY = yPosition + 2;
  try {
    const sealImageData = await loadImageAsBase64('/images/dragon-coders-logo.png');
    doc.addImage(sealImageData, 'PNG', sealX, sealY, sealW, sealH);
  } catch {
    fill(SURFACE);
    doc.rect(sealX, sealY, sealW, sealH, 'F');
    ink(MUTED);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Seal', sealX + sealW / 2, sealY + sealH / 2, { align: 'center' });
  }

  // Bottom accent bar
  fill(NAVY);
  doc.rect(0, pageHeight - 4, pageWidth, 4, 'F');

  // ── Save ───────────────────────────────────────────────────────────────────
  ink(INK);
  const fileReceiptNumber = receiptData.receiptNumber || 'N/A';
  const fileDate = formatDateLong(new Date()).replace(/[,\s]/g, '-').replace(/(st|nd|rd|th)/g, '');
  const fileName = `${isBooking ? 'booking' : 'subscription'}-receipt-${fileReceiptNumber}-${fileDate}.pdf`;
  doc.save(fileName);
};
