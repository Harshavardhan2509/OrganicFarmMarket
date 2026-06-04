/**
 * Utility helper to compile a gorgeous, high-fidelity printable HTML invoice
 * for an order in INR (₹) and trigger the browser's native print dialog.
 */
export function downloadInvoice(order: {
  id: string
  createdAt: string | Date
  totalAmount: number
  shippingAddress: string
  items: Array<{
    id: string
    quantity: number
    price: number
    product: {
      name: string
      category: string
    }
  }>
  user?: {
    name: string
    email: string
    phone?: string
  }
}) {
  const dateStr = new Date(order.createdAt).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  // Compute values
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shippingFee = subtotal > 0 ? 5.0 : 0.0
  const estimatedTax = subtotal * 0.08
  const grandTotal = subtotal + shippingFee + estimatedTax

  // Customer Contact Info
  const customerName = order.user?.name || 'Valued Customer'
  const customerEmail = order.user?.email || 'N/A'
  const customerPhone = order.user?.phone || 'Provided during Checkout'

  const itemsHtml = order.items.map((item, index) => {
    const itemTotal = item.price * item.quantity
    return `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 16px 24px; font-weight: 600; color: #1e293b; font-size: 13px;">${index + 1}</td>
        <td style="padding: 16px 24px; font-size: 13px;">
          <span style="font-weight: 700; color: #0f172a; display: block;">${item.product.name}</span>
          <span style="font-size: 10px; text-transform: uppercase; font-weight: 800; color: #94a3b8; display: block; margin-top: 2px;">${item.product.category}</span>
        </td>
        <td style="padding: 16px 24px; font-size: 13px; color: #334155; font-weight: 600; text-align: center;">${item.quantity}</td>
        <td style="padding: 16px 24px; font-size: 13px; color: #334155; font-weight: 750; text-align: right;">₹${item.price.toFixed(2)}</td>
        <td style="padding: 16px 24px; font-size: 13px; color: #0f172a; font-weight: 900; text-align: right;">₹${itemTotal.toFixed(2)}</td>
      </tr>
    `
  }).join('')

  const invoiceHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pre-Order Invoice #${order.id.substring(0, 8).toUpperCase()}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        
        * {
          box-sizing: border-box;
        }

        body {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          background-color: #f8fafc;
          color: #0f172a;
          margin: 0;
          padding: 40px 20px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .container {
          max-width: 850px;
          margin: 0 auto;
          background: #ffffff;
          border: 1px solid #f1f5f9;
          border-radius: 24px;
          padding: 48px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.02), 0 2px 4px -2px rgb(0 0 0 / 0.02);
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          border-bottom: 2px dashed #e2e8f0;
          padding-bottom: 32px;
          margin-bottom: 32px;
        }

        .brand {
          color: #065f46;
          font-size: 28px;
          font-weight: 900;
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          letter-spacing: -0.03em;
        }

        .meta {
          text-align: right;
        }

        .meta h1 {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 900;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .meta p {
          margin: 4px 0;
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
        }

        .meta span {
          color: #0f172a;
          font-weight: bold;
        }

        .grid {
          display: grid;
          grid-template-cols: 1fr 1fr;
          gap: 32px;
          margin-bottom: 40px;
        }

        .section-title {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #94a3b8;
          margin-bottom: 12px;
          display: block;
        }

        .billing-card {
          background: #f8fafc;
          border: 1px solid #f1f5f9;
          border-radius: 16px;
          padding: 24px;
          height: calc(100% - 28px);
        }

        .billing-card h3 {
          margin: 0 0 10px 0;
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
        }

        .billing-card p {
          margin: 6px 0;
          font-size: 13px;
          font-weight: 500;
          color: #475569;
          line-height: 1.5;
        }

        .billing-card strong {
          color: #0f172a;
        }

        .table-container {
          width: 100%;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          margin-bottom: 32px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        th {
          background: #f8fafc;
          padding: 16px 24px;
          font-size: 11px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #e2e8f0;
        }

        .summary-container {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 40px;
        }

        .summary-table {
          width: 340px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
        }

        .summary-row.total {
          border-top: 2px solid #0f172a;
          padding-top: 16px;
          margin-top: 8px;
          font-size: 19px;
          font-weight: 900;
          color: #0f172a;
        }

        .footer {
          border-top: 1px solid #e2e8f0;
          padding-top: 32px;
          text-align: center;
        }

        .badge {
          display: inline-block;
          background: #d1fae5;
          color: #065f46;
          font-weight: 800;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 6px 16px;
          border-radius: 9999px;
          margin-bottom: 16px;
        }

        .footer p {
          margin: 4px 0;
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
        }

        .barcode {
          font-family: monospace;
          letter-spacing: 6px;
          color: #cbd5e1;
          font-size: 14px;
          margin-top: 16px;
        }

        .print-actions {
          display: flex;
          justify-content: center;
          gap: 12px;
          max-width: 850px;
          margin: 0 auto 24px auto;
        }

        .action-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #059669;
          color: white;
          border: none;
          padding: 12px 28px;
          border-radius: 12px;
          font-weight: 750;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
          box-shadow: 0 4px 6px -1px rgb(5 150 105 / 0.15);
        }

        .action-btn:hover {
          background: #047857;
          transform: translateY(-1px);
        }

        .action-btn.secondary {
          background: #ffffff;
          color: #475569;
          border: 1px solid #cbd5e1;
          box-shadow: none;
        }

        .action-btn.secondary:hover {
          background: #f8fafc;
          color: #0f172a;
          border-color: #94a3b8;
        }

        @media print {
          body {
            background: #ffffff;
            padding: 0;
          }
          .container {
            border: none;
            box-shadow: none;
            padding: 0;
          }
          .print-actions {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="print-actions">
        <button class="action-btn" onclick="window.print()">🖨️ Print Receipt</button>
        <button class="action-btn secondary" onclick="window.close()">❌ Close Window</button>
      </div>
      
      <div class="container">
        <div class="header">
          <div>
            <div class="brand">🌱 Sasya Kshetra</div>
            <p style="margin: 8px 0 0 0; font-size: 13px; font-weight: 500; color: #64748b;">Direct Local Agricultural Marketplace</p>
          </div>
          <div class="meta">
            <h1>Pre-Order Invoice</h1>
            <p>Invoice No: <span>#${order.id.substring(0, 8).toUpperCase()}</span></p>
            <p>Date: <span>${dateStr}</span></p>
            <p>Status: <span style="color: #059669;">COMPLETED</span></p>
          </div>
        </div>

        <div class="grid">
          <div>
            <span class="section-title">Customer Contact Ledger</span>
            <div class="billing-card">
              <h3>${customerName}</h3>
              <p><strong>Email:</strong> ${customerEmail}</p>
              <p><strong>Mobile Number:</strong> ${customerPhone}</p>
            </div>
          </div>
          <div>
            <span class="section-title">Shipping Destination</span>
            <div class="billing-card">
              <h3>Delivery Destination</h3>
              <p>${order.shippingAddress}</p>
            </div>
          </div>
        </div>

        <span class="section-title">Itemized Harvest Breakdown</span>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th style="width: 60px;">#</th>
                <th>Harvest Product</th>
                <th style="width: 100px; text-align: center;">Qty</th>
                <th style="width: 120px; text-align: right;">Unit Price</th>
                <th style="width: 140px; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <div class="summary-container">
          <div class="summary-table">
            <div class="summary-row">
              <span>Produce Subtotal</span>
              <span>₹${subtotal.toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span>Handling & Delivery</span>
              <span>₹${shippingFee.toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span>GST / Estimated Tax (8%)</span>
              <span>₹${estimatedTax.toFixed(2)}</span>
            </div>
            <div class="summary-row total">
              <span>Grand Total</span>
              <span>₹${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <span class="badge">Paid via Secure Card Transaction</span>
          <p>Thank you for supporting sustainable local agriculture! 🌱</p>
          <p style="font-size: 11px; margin-top: 8px;">If you have any questions regarding this pre-order invoice, contact billing@organicfarm.com</p>
          <div class="barcode">||||| | |||| ||| || |||||| | ||| |||||</div>
        </div>
      </div>

      <script>
        // Automatically trigger print on load
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        }
      </script>
    </body>
    </html>
  `

  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(invoiceHtml)
    printWindow.document.close()
  } else {
    alert('Popup blocker prevented opening the invoice. Please allow popups for this site to print.')
  }
}

// Export printInvoice alias for unified API compliance
export { downloadInvoice as printInvoice }
