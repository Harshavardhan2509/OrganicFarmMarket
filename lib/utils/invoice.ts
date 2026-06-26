/**
 * Utility helper to compile a gorgeous, high-fidelity thermal receipt (DMart/Supermarket style)
 * for an order in INR (₹) and trigger the browser's native print dialog.
 * Works with A4/80mm/58mm printers and allows farmer customization.
 */
export function downloadInvoice(
  order: {
    id: string
    createdAt: string | Date
    totalAmount: number
    shippingAddress: string
    orderType?: string
    stallName?: string | null
    items: Array<{
      id: string
      quantity: number
      price: number // includes GST
      unitSize?: string | null
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
  },
  categoriesList?: any[]
) {
  const dateStr = new Date(order.createdAt).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  // Load custom template settings from Local Storage (configured by farmer)
  let settings = {
    storeName: 'Sasya Khetr',
    contactInfo: 'Direct Local Organic Farm Connection',
    headerText: 'TAX INVOICE / MEMO',
    footerText: 'Thank you for supporting organic local farms! 🌱',
    receiptWidth: '80mm' // '58mm', '80mm', 'A4'
  }

  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('billing_template_settings')
      if (saved) {
        settings = { ...settings, ...JSON.parse(saved) }
      }
    } catch (e) {
      console.error('Failed to parse billing template settings', e)
    }
  }

  // GST rates helper
  const getGSTForCategory = (catName: string, list?: any[]) => {
    if (list) {
      const cat = list.find(c => c.name.toLowerCase() === catName.toLowerCase())
      if (cat) return { cgst: cat.cgst || 0.0, sgst: cat.sgst || 0.0 }
    }
    // Fallback based on name keywords if list not loaded
    const name = catName.toLowerCase()
    if (name.includes('veg') || name.includes('fruit') || name.includes('grain')) {
      return { cgst: 0.0, sgst: 0.0 }
    }
    return { cgst: 4.0, sgst: 4.0 } // 8% default
  }

  // Calculate totals and extract taxes
  let subtotalWithoutTax = 0
  let totalCgst = 0
  let totalSgst = 0
  const totalWithGst = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  // Items rows
  const itemsHtml = order.items.map((item, index) => {
    const rates = getGSTForCategory(item.product.category, categoriesList)
    const totalGstRate = rates.cgst + rates.sgst
    
    // price = basePrice * (1 + totalGstRate / 100)
    const basePrice = item.price / (1 + totalGstRate / 100)
    const itemSubtotal = basePrice * item.quantity
    const itemCgst = itemSubtotal * (rates.cgst / 100)
    const itemSgst = itemSubtotal * (rates.sgst / 100)
    const itemTotal = item.price * item.quantity

    subtotalWithoutTax += itemSubtotal
    totalCgst += itemCgst
    totalSgst += itemSgst

    const itemLabel = `${index + 1}. ${item.product.name} ${item.unitSize ? `(${item.unitSize})` : ''}`
    
    return `
      <div class="item-row" style="font-size: 11px; margin-bottom: 6px; line-height: 1.3;">
        <span class="item-name" style="font-weight: 700; display: block; text-transform: uppercase;">${itemLabel}</span>
        <div class="item-details" style="display: flex; justify-content: space-between; color: #334155; margin-top: 1px;">
          <span>${item.quantity} x ₹${item.price.toFixed(2)} = ₹${itemTotal.toFixed(2)}</span>
          <span style="font-weight: 700; color: #000000;">₹${itemTotal.toFixed(2)}</span>
        </div>
      </div>
    `
  }).join('')

  // Shipping cost: pre-order shipping cost is ₹30
  let shippingFee = 0.0
  if (order.orderType !== 'live-counter') {
    shippingFee = order.totalAmount > totalWithGst ? (order.totalAmount - totalWithGst) : 30.0
  }
  const grandTotal = totalWithGst + shippingFee

  // Dynamic Taxes block
  let taxesHtml = ''
  if (totalCgst > 0 || totalSgst > 0) {
    taxesHtml = `
      <div class="summary-row" style="display: flex; justify-content: space-between; padding: 2px 0;">
        <span>CGST Tax:</span>
        <span>₹${totalCgst.toFixed(2)}</span>
      </div>
      <div class="summary-row" style="display: flex; justify-content: space-between; padding: 2px 0;">
        <span>SGST Tax:</span>
        <span>₹${totalSgst.toFixed(2)}</span>
      </div>
    `
  } else {
    taxesHtml = `
      <div class="summary-row" style="display: flex; justify-content: space-between; padding: 2px 0; color: #64748b; font-style: italic;">
        <span>Taxes (0% GST):</span>
        <span>₹0.00</span>
      </div>
    `
  }

  // Customer credentials
  const customerName = order.user?.name || 'Valued Customer'
  const customerEmail = order.user?.email || 'N/A'
  const customerPhone = order.user?.phone || 'N/A'

  const widthStyle = settings.receiptWidth === '58mm' ? '260px' : settings.receiptWidth === '80mm' ? '320px' : '800px'
  const maxActionsWidth = widthStyle

  let invoiceContentHtml = ''
  
  if (settings.receiptWidth === 'A4') {
    const a4ItemsRows = order.items.map((item, index) => {
      const rates = getGSTForCategory(item.product.category, categoriesList)
      const totalGstRate = rates.cgst + rates.sgst
      
      const basePrice = item.price / (1 + totalGstRate / 100)
      const itemSubtotal = basePrice * item.quantity
      const itemCgst = itemSubtotal * (rates.cgst / 100)
      const itemSgst = itemSubtotal * (rates.sgst / 100)
      const itemTaxAmt = itemCgst + itemSgst
      const itemTotal = item.price * item.quantity

      return `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 600;">
          <td style="padding: 10px 8px; text-align: center; color: #475569;">${index + 1}</td>
          <td style="padding: 10px 8px; font-weight: 700; color: #0f172a; text-transform: uppercase;">
            ${item.product.name}
            <div style="font-size: 9px; color: #64748b; font-weight: 600; text-transform: none; margin-top: 2px;">
              Math: ${item.quantity} x ₹${item.price.toFixed(2)} = ₹${itemTotal.toFixed(2)}
            </div>
          </td>
          <td style="padding: 10px 8px; text-align: center; color: #64748b;">${item.product.category}</td>
          <td style="padding: 10px 8px; text-align: center; color: #475569;">${item.unitSize || 'Standard'}</td>
          <td style="padding: 10px 8px; text-align: center; font-weight: 700;">${item.quantity}</td>
          <td style="padding: 10px 8px; text-align: right; color: #0f172a;">₹${basePrice.toFixed(2)}</td>
          <td style="padding: 10px 8px; text-align: center; color: #64748b;">${totalGstRate}%</td>
          <td style="padding: 10px 8px; text-align: right; color: #64748b;">₹${itemTaxAmt.toFixed(2)}</td>
          <td style="padding: 10px 8px; text-align: right; font-weight: 700; color: #0f172a;">₹${itemTotal.toFixed(2)}</td>
        </tr>
      `
    }).join('')

    invoiceContentHtml = `
      <div class="receipt-container a4-invoice" style="width: 100%; max-width: 800px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.02);">
        <!-- A4 Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #065f46; padding-bottom: 20px; margin-bottom: 24px;">
          <div>
            <h1 style="font-size: 26px; font-weight: 800; color: #065f46; text-transform: uppercase; margin-bottom: 4px;">${settings.storeName}</h1>
            <p style="font-size: 11px; color: #64748b; font-weight: 600; line-height: 1.4; max-width: 320px;">${settings.contactInfo}</p>
          </div>
          <div style="text-align: right;">
            <h2 style="font-size: 18px; font-weight: 800; color: #475569; letter-spacing: 0.05em; text-transform: uppercase; margin: 0;">${settings.headerText || 'TAX INVOICE'}</h2>
            <p style="font-size: 11px; font-weight: 700; color: #065f46; margin-top: 4px; margin-bottom: 2px;">Ref ID: #${order.id.toUpperCase()}</p>
            <p style="font-size: 10px; color: #64748b; font-weight: 600; margin: 0;">Date: ${dateStr}</p>
          </div>
        </div>

        <!-- Addresses grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 30px; font-size: 11px; text-align: left;">
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
            <h3 style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">Billed To</h3>
            <p style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">${customerName}</p>
            ${customerPhone !== 'N/A' ? `<p style="margin-bottom: 2px;"><strong style="color: #64748b;">Phone:</strong> ${customerPhone}</p>` : ''}
            ${customerEmail !== 'N/A' ? `<p style="margin-bottom: 2px;"><strong style="color: #64748b;">Email:</strong> ${customerEmail}</p>` : ''}
            ${order.shippingAddress ? `<p style="margin-top: 6px; line-height: 1.4;"><strong style="color: #64748b;">Delivery Address:</strong> ${order.shippingAddress}</p>` : ''}
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
            <h3 style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">Order Metadata</h3>
            <p style="margin-bottom: 4px;"><strong style="color: #64748b;">Order Type:</strong> <span style="font-weight: 700; color: #065f46; text-transform: uppercase;">${order.orderType === 'live-counter' ? 'Live Counter Sale' : 'Pre-Order Checkout'}</span></p>
            ${order.stallName ? `<p style="margin-bottom: 4px;"><strong style="color: #64748b;">Apartment:</strong> <span style="font-weight: 700; color: #0f172a;">${order.stallName}</span></p>` : ''}
            <p style="margin: 0;"><strong style="color: #64748b;">Payment Status:</strong> <span style="font-weight: 700; color: #15803d; text-transform: uppercase;">PAID</span></p>
          </div>
        </div>

        <!-- Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; text-align: left;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #475569;">
              <th style="padding: 10px 8px; text-align: center; width: 50px;">S.No</th>
              <th style="padding: 10px 8px; text-align: left;">Item Description</th>
              <th style="padding: 10px 8px; text-align: center; width: 100px;">Category</th>
              <th style="padding: 10px 8px; text-align: center; width: 80px;">Unit</th>
              <th style="padding: 10px 8px; text-align: center; width: 60px;">Qty</th>
              <th style="padding: 10px 8px; text-align: right; width: 90px;">Rate</th>
              <th style="padding: 10px 8px; text-align: center; width: 70px;">Tax %</th>
              <th style="padding: 10px 8px; text-align: right; width: 80px;">Tax Amt</th>
              <th style="padding: 10px 8px; text-align: right; width: 100px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${a4ItemsRows}
          </tbody>
        </table>

        <!-- Summary Totals Section -->
        <div style="display: flex; justify-content: flex-end;">
          <div style="width: 100%; max-width: 320px; font-size: 11px; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; background: #f8fafc; text-align: left;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #475569; font-weight: 600;">
              <span>Subtotal (Excl. Tax):</span>
              <span style="font-weight: 700; color: #0f172a;">₹${subtotalWithoutTax.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #475569; font-weight: 600;">
              <span>CGST Tax:</span>
              <span style="font-weight: 700; color: #0f172a;">₹${totalCgst.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #475569; font-weight: 600;">
              <span>SGST Tax:</span>
              <span style="font-weight: 700; color: #0f172a;">₹${totalSgst.toFixed(2)}</span>
            </div>
            ${shippingFee > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #475569; font-weight: 600;">
              <span>Delivery & Handling:</span>
              <span style="font-weight: 700; color: #0f172a;">₹${shippingFee.toFixed(2)}</span>
            </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; border-top: 1.5px dashed #cbd5e1; padding-top: 8px; margin-top: 8px; font-size: 14px; font-weight: 800; color: #065f46;">
              <span>Grand Total:</span>
              <span>₹${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div style="margin-top: 40px; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 20px;">
          <p style="font-size: 10px; font-weight: 600; color: #64748b;">${settings.footerText}</p>
          <div style="font-family: 'Courier Prime', monospace; letter-spacing: 4px; font-size: 11px; color: #cbd5e1; margin-top: 12px;">||||| | |||| ||| || |||||| | ||| |||||</div>
        </div>
      </div>
    `
  } else {
    invoiceContentHtml = `
      <div class="receipt-container">
        <div class="text-center">
          <div class="store-name">${settings.storeName}</div>
          <div class="store-info">${settings.contactInfo}</div>
          <div class="header-title">${settings.headerText}</div>
        </div>
        
        <div class="meta-info">
          <div class="meta-row">
            <span class="meta-label">Bill Reference:</span>
            <span class="meta-value">#${order.id.toUpperCase()}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Date:</span>
            <span class="meta-value">${dateStr}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Type:</span>
            <span class="meta-value">${order.orderType === 'live-counter' ? 'LIVE COUNTER' : 'PRE-ORDER'}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Customer:</span>
            <span class="meta-value">${customerName}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Phone:</span>
            <span class="meta-value">${customerPhone}</span>
          </div>
          ${order.shippingAddress ? `
          <div class="meta-row">
            <span class="meta-label">Address:</span>
            <span class="meta-value">${order.shippingAddress}</span>
          </div>` : ''}
          ${order.stallName ? `
          <div class="meta-row">
            <span class="meta-label">Apartment:</span>
            <span class="meta-value">${order.stallName}</span>
          </div>` : ''}
        </div>
        
        <div class="divider"></div>
        <div style="font-size: 10px; font-weight: 800; color: #475569; display: flex; justify-content: space-between; margin-bottom: 2px;">
          <span>PARTICULARS</span>
          <span>AMOUNT</span>
        </div>
        <div class="divider"></div>
        
        <div class="items-list" style="text-align: left;">
          ${itemsHtml}
        </div>
        
        <div class="divider"></div>
        
        <div class="summary-section">
          <div class="summary-row">
            <span>Produce Subtotal (Excl Tax):</span>
            <span>₹${subtotalWithoutTax.toFixed(2)}</span>
          </div>
          ${taxesHtml}
          ${shippingFee > 0.0 ? `
          <div class="summary-row">
            <span>Delivery & Handling:</span>
            <span>₹${shippingFee.toFixed(2)}</span>
          </div>` : ''}
          <div class="summary-row total">
            <span>GRAND TOTAL:</span>
            <span>₹${grandTotal.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="double-divider"></div>
        
        <div class="footer-msg">
          ${settings.footerText}
        </div>
        <div class="barcode">||||| | |||| ||| || |||||| | ||| |||||</div>
      </div>
    `
  }

  const invoiceHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice #${order.id.substring(0, 8).toUpperCase()}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          background-color: #f8fafc;
          color: #0f172a;
          padding: 30px 15px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .receipt-container {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.02);
          width: ${widthStyle};
          margin: 0 auto;
        }

        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .store-name {
          font-size: 16px;
          font-weight: 800;
          text-transform: uppercase;
          margin-bottom: 2px;
          color: #065f46;
        }
        .store-info {
          font-size: 11px;
          color: #64748b;
          margin-bottom: 8px;
          line-height: 1.3;
          font-weight: 600;
        }
        .header-title {
          font-size: 11px;
          font-weight: 800;
          border-top: 1px dashed #cbd5e1;
          border-bottom: 1px dashed #cbd5e1;
          padding: 4px 0;
          margin: 8px 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #475569;
        }
        .meta-info {
          font-size: 11px;
          line-height: 1.5;
          margin-bottom: 10px;
          text-align: left;
        }
        .meta-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
        }
        .meta-label { font-weight: 600; color: #64748b; }
        .meta-value { font-weight: 700; text-align: right; color: #0f172a; }
        
        .divider {
          border-top: 1px dashed #cbd5e1;
          margin: 8px 0;
        }
        .double-divider {
          border-top: 2px double #0f172a;
          margin: 8px 0;
        }
        
        .summary-section {
          font-size: 11px;
          line-height: 1.5;
          margin-top: 8px;
          text-align: left;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 2px 0;
          font-weight: 600;
          color: #475569;
        }
        .summary-row.total {
          font-size: 13px;
          font-weight: 800;
          border-top: 1px dashed #0f172a;
          padding-top: 6px;
          margin-top: 4px;
          color: #0f172a;
        }
        
        .footer-msg {
          font-size: 10px;
          font-weight: 600;
          color: #64748b;
          line-height: 1.4;
          margin-top: 15px;
          text-align: center;
        }
        .barcode {
          font-family: 'Courier Prime', monospace;
          letter-spacing: 4px;
          font-size: 11px;
          color: #94a3b8;
          margin-top: 10px;
          text-align: center;
        }

        .print-actions {
          display: flex;
          justify-content: center;
          gap: 12px;
          max-width: ${maxActionsWidth};
          margin: 0 auto 20px auto;
        }
        .action-btn {
          background: #059669;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 6px -1px rgb(5 150 105 / 0.1);
        }
        .action-btn:hover { background: #047857; }
        .action-btn.secondary {
          background: #ffffff;
          color: #475569;
          border: 1px solid #cbd5e1;
          box-shadow: none;
        }
        .action-btn.secondary:hover { background: #f8fafc; color: #0f172a; }

        @media print {
          body {
            background: #ffffff;
            padding: 0;
            margin: 0;
          }
          .receipt-container {
            border: none;
            box-shadow: none;
            padding: 0;
            width: ${widthStyle} !important;
          }
          .print-actions {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="print-actions">
        <button class="action-btn" onclick="window.print()">🖨️ Print Invoice</button>
        <button class="action-btn secondary" onclick="window.close()">✕ Close</button>
      </div>
      
      ${invoiceContentHtml}
      
      <script>
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
    alert('Popup blocker prevented opening the invoice receipt. Please allow popups for this site.')
  }
}

// Export printInvoice alias for unified API compliance
export { downloadInvoice as printInvoice }
