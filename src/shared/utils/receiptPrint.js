/**
 * Builds a hotel-folio-styled booking receipt and sends it straight to the
 * browser's print dialog (no file download) — for walk-in bookings printed
 * at the front desk on an attached printer.
 */

const formatCurrency = (amount, currency = 'BTN') => {
  const symbol = currency === 'BTN' ? 'Nu.' : currency;
  const value = parseFloat(amount || 0);
  const sign = value < 0 ? '-' : '';
  return `${sign}${symbol} ${Math.abs(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDateLong = (dateInput) => {
  if (!dateInput) return 'N/A';
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return String(dateInput);
  const day = date.getDate();
  const daySuffix = day === 1 || day === 21 || day === 31 ? 'st'
    : day === 2 || day === 22 ? 'nd'
    : day === 3 || day === 23 ? 'rd' : 'th';
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  return `${day}${daySuffix} ${month}, ${date.getFullYear()}`;
};

const formatTime = (timeString) => {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
};

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

const nightsOrHours = (booking) => {
  if (booking.timeBased && booking.bookHour) {
    return `${booking.bookHour} hour${booking.bookHour !== 1 ? 's' : ''}`;
  }
  if (booking.checkInDate && booking.checkOutDate) {
    const nights = Math.ceil(
      Math.abs(new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / 86400000
    );
    return `${nights} night${nights !== 1 ? 's' : ''}`;
  }
  return 'N/A';
};

const buildLineItems = (receiptData) => {
  const currency = receiptData.currency || 'BTN';
  const baseAmount = receiptData.baseAmount;
  const gstAmount = parseFloat(receiptData.gstAmount || 0);
  const serviceTaxAmount = parseFloat(receiptData.serviceTaxAmount || 0);
  const walkInServiceChargeAmount = parseFloat(receiptData.walkInServiceChargeAmount || 0);
  const discountAmount = parseFloat(receiptData.discountAmount || 0);
  const hasBreakdown = baseAmount != null &&
    (gstAmount > 0 || serviceTaxAmount > 0 || walkInServiceChargeAmount > 0 || discountAmount > 0);

  if (!hasBreakdown) {
    return [{ label: receiptData.description || 'Booking Payment', amount: receiptData.amount, currency }];
  }

  const items = [{ label: 'Room Charges', amount: baseAmount, currency }];
  if (walkInServiceChargeAmount > 0) {
    const rate = receiptData.walkInServiceChargeRate;
    items.push({
      label: `Service Charge${rate ? ` (${Math.round(parseFloat(rate) * 100)}%)` : ''}`,
      amount: walkInServiceChargeAmount, currency,
    });
  }
  if (gstAmount > 0) {
    const rate = receiptData.gstRate;
    items.push({
      label: `GST${rate ? ` (${Math.round(parseFloat(rate) * 100)}%)` : ''}`,
      amount: gstAmount, currency,
    });
  }
  if (serviceTaxAmount > 0) {
    const rate = receiptData.serviceTaxRate;
    items.push({
      label: `Service Tax${rate ? ` (${Math.round(parseFloat(rate) * 100)}%)` : ''}`,
      amount: serviceTaxAmount, currency,
    });
  }
  if (discountAmount > 0) {
    items.push({ label: 'Discount', amount: -discountAmount, currency });
  }
  return items;
};

const buildReceiptHtml = (booking, receiptData) => {
  const currency = receiptData.currency || 'BTN';
  const guestName = booking.guestName || booking.name || receiptData.customerName || 'Guest';
  const guestPhone = receiptData.customerPhone || booking.phone || '';
  const guestEmail = receiptData.customerEmail || booking.email || '';
  const roomNumber = booking.roomNumber || 'N/A';
  const guests = booking.guests ?? 'N/A';
  const isPaid = ['COMPLETED', 'PAID', 'SUCCESS'].includes(String(receiptData.status || '').toUpperCase());

  const checkInLine = booking.checkInDate
    ? `${escapeHtml(booking.checkInDate)}${booking.timeBased && booking.checkInTime ? ` · ${formatTime(booking.checkInTime)}` : ''}`
    : 'N/A';
  const checkOutLine = booking.checkOutDate
    ? `${escapeHtml(booking.checkOutDate)}${booking.timeBased && booking.checkOutTime ? ` · ${formatTime(booking.checkOutTime)}` : ''}`
    : 'N/A';

  const paymentMethodLabel = booking.paymentMethod === 'BANK_TRANSFER' ? 'Bank Transfer' : 'Cash';
  const journalLine = booking.paymentMethod === 'BANK_TRANSFER' && booking.journalNumber
    ? `Jr no: ${escapeHtml(booking.journalNumber)}` : '';

  const lineItems = buildLineItems(receiptData);
  const ledgerRows = lineItems.map((item) => `
    <tr>
      <td>${escapeHtml(item.label)}</td>
      <td class="num">${formatCurrency(item.amount, item.currency)}</td>
    </tr>
  `).join('');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Receipt ${escapeHtml(receiptData.receiptNumber || '')}</title>
<style>
  @page { size: A4; margin: 14mm 12mm; }
  *{ box-sizing:border-box; }
  body{
    margin:0;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;
    color:#221f1a;
    background:#fffdf7;
    font-size:13px;
  }
  .ink{ color:#221f1a; }
  .head{
    display:flex; align-items:center; justify-content:space-between;
    gap:20px; padding-bottom:14px; border-bottom:2.5px solid #7c2e2b;
  }
  .brand{ display:flex; align-items:center; gap:14px; }
  .mark{
    width:42px; height:42px; border-radius:50%; border:1.5px solid #7c2e2b;
    display:flex; align-items:center; justify-content:center;
    font-family:Georgia,"Times New Roman",serif; font-size:17px; color:#7c2e2b; flex:none;
  }
  .brand h1{ margin:0; font-family:Georgia,"Times New Roman",serif; font-size:20px; letter-spacing:.01em; }
  .brand p{ margin:2px 0 0; font-size:11px; color:#7d7566; letter-spacing:.02em; }
  .head-meta{ text-align:right; font-size:11.5px; color:#7d7566; line-height:1.6; }
  .head-meta b{ color:#221f1a; font-weight:600; }
  .doc-title{
    text-align:center; font-size:10.5px; letter-spacing:.16em; text-transform:uppercase;
    color:#7d7566; padding:12px 0 4px;
  }
  table.block{ width:100%; border-collapse:collapse; font-size:12.5px; margin:0 0 14px; }
  table.block td{ border:1px solid #ccc3ae; padding:7px 10px; vertical-align:top; }
  .lbl{ display:block; font-size:9.5px; letter-spacing:.05em; text-transform:uppercase; color:#7d7566; margin-bottom:3px; }
  .val{ font-weight:600; }
  .val.mono{ font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace; font-variant-numeric:tabular-nums; font-weight:600; }
  table.ledger{ width:100%; border-collapse:collapse; font-size:12.5px; margin:4px 0 0; }
  table.ledger th{
    background:#f4e9e2; color:#7c2e2b; font-size:10px; letter-spacing:.05em; text-transform:uppercase;
    text-align:left; padding:8px 10px; border:1px solid #ccc3ae;
  }
  table.ledger td{ border:1px solid #ccc3ae; padding:7px 10px; }
  table.ledger td.num, table.ledger th.num{
    text-align:right; font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace; font-variant-numeric:tabular-nums;
  }
  table.ledger tr.grand td{
    background:#f4e9e2; font-weight:700; font-size:13.5px; border-top:1.5px solid #7c2e2b; color:#7c2e2b;
  }
  .status-row{ display:flex; align-items:center; justify-content:space-between; margin-top:16px; gap:14px; }
  .pill{
    display:inline-block; padding:7px 20px; border-radius:3px; font-weight:700; font-size:12.5px;
    letter-spacing:.04em; color:#fff;
    background:${isPaid ? '#3f7a52' : '#7c2e2b'};
  }
  .paid-amount{ text-align:right; font-size:12.5px; color:#7d7566; }
  .paid-amount b{
    display:block; font-size:15px; color:#221f1a;
    font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace; font-variant-numeric:tabular-nums;
  }
  .foot{
    display:grid; grid-template-columns:1.3fr 1fr; gap:20px; margin-top:26px; font-size:12px; color:#7d7566;
  }
  .foot b{ color:#221f1a; }
  .sign-box{ display:flex; align-items:flex-end; justify-content:flex-end; }
  .sign-line{ text-align:center; font-size:11px; color:#7d7566; border-top:1px solid #a89c81; padding-top:6px; width:170px; }
  .sign-off{
    display:flex; justify-content:space-between; align-items:flex-end; margin-top:30px; font-size:12.5px;
  }
  .sign-off .for-line{ color:#7d7566; }
  .sign-off .for-line b{ color:#221f1a; font-family:Georgia,"Times New Roman",serif; font-style:italic; }
</style>
</head>
<body>

  <div class="head">
    <div class="brand">
      <div class="mark">${escapeHtml((receiptData.hotelName || 'H').charAt(0).toUpperCase())}</div>
      <div>
        <h1>${escapeHtml(receiptData.hotelName || 'Hotel')}</h1>
        <p>${[receiptData.hotelAddress, receiptData.hotelPhone, receiptData.hotelEmail].filter(Boolean).map(escapeHtml).join(' &middot; ')}</p>
      </div>
    </div>
    <div class="head-meta">
      <div>Booking Receipt</div>
      <div><b>${escapeHtml(receiptData.receiptNumber || 'N/A')}</b></div>
      <div>${formatDateLong(receiptData.issueDate || receiptData.createdAt || new Date())}</div>
    </div>
  </div>

  <div class="doc-title">Walk-in Guest Receipt</div>

  <table class="block">
    <tr>
      <td style="width:25%"><span class="lbl">Guest Name</span><span class="val">${escapeHtml(guestName)}</span></td>
      <td style="width:25%"><span class="lbl">Room No</span><span class="val">${escapeHtml(roomNumber)}</span></td>
      <td style="width:25%"><span class="lbl">Guests</span><span class="val">${escapeHtml(guests)}</span></td>
      <td style="width:25%"><span class="lbl">Payment Method</span><span class="val">${paymentMethodLabel}${journalLine ? ` <span style="font-weight:400;color:#7d7566">(${journalLine})</span>` : ''}</span></td>
    </tr>
    <tr>
      <td><span class="lbl">Phone</span><span class="val">${escapeHtml(guestPhone || 'N/A')}</span></td>
      <td><span class="lbl">Email</span><span class="val">${escapeHtml(guestEmail || 'N/A')}</span></td>
      <td colspan="2"><span class="lbl">Duration</span><span class="val">${nightsOrHours(booking)}</span></td>
    </tr>
  </table>

  <table class="block">
    <tr>
      <td style="width:50%"><span class="lbl">Check-in</span><span class="val mono">${checkInLine}</span></td>
      <td style="width:50%"><span class="lbl">Check-out</span><span class="val mono">${checkOutLine}</span></td>
    </tr>
  </table>

  <table class="ledger">
    <tr>
      <th>Particular</th>
      <th class="num" style="width:35%">Amount (${escapeHtml(currency)})</th>
    </tr>
    ${ledgerRows}
    <tr class="grand">
      <td style="text-align:right">Grand Total</td>
      <td class="num">${formatCurrency(receiptData.amount, currency)}</td>
    </tr>
  </table>

  <div class="status-row">
    <span class="pill">${isPaid ? 'PAID' : (receiptData.statusMessage || receiptData.status || 'PENDING')}</span>
    <div class="paid-amount">Amount Paid<b>${formatCurrency(receiptData.amount, currency)}</b></div>
  </div>

  <div class="foot">
    <div>
      <div>Issued by <b>${escapeHtml(receiptData.hotelName || 'Hotel')}</b> via EzeeRoom</div>
    </div>
    <div class="sign-box">
      <div class="sign-line">Guest Signature</div>
    </div>
  </div>

  <div class="sign-off">
    <div class="for-line">For <b>M/S ${escapeHtml(receiptData.hotelName || 'Hotel')}</b></div>
    <div class="sign-line">Authorised Signatory</div>
  </div>

</body>
</html>`;
};

/**
 * Renders the receipt into a hidden iframe and opens the browser print
 * dialog directly — no PDF file is generated or downloaded.
 */
export const printBookingReceipt = (booking, receiptData = {}) => new Promise((resolve, reject) => {
  const html = buildReceiptHtml(booking, receiptData);

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const cleanup = () => {
    if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
  };

  iframe.onload = () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      iframe.contentWindow.onafterprint = () => {
        cleanup();
        resolve();
      };
      setTimeout(cleanup, 8000);
    } catch (err) {
      cleanup();
      reject(err);
    }
  };

  iframe.srcdoc = html;
});
