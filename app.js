/**
 * Ajay'S Fassion House — Billing & Invoice Generator
 * Core Application Logic, Calculations, Receipt Rendering & LocalStorage Management
 */

(function () {
  'use strict';

  // =========================================================================
  // CONSTANTS & DEFAULT STORAGE KEYS
  // =========================================================================
  const STORAGE_KEYS = {
    SETTINGS: 'ajay_fashion_settings_v1',
    BILLS: 'ajay_fashion_bills_v1',
    NEXT_SEQ: 'ajay_fashion_seq_v1'
  };

  // Sample data as specified in requirement #5
  const SAMPLE_ITEMS = [
    { name: 'Shirt', qty: 3, price: 600 },
    { name: 'Shirt', qty: 1, price: 800 },
    { name: 'Cotton', qty: 1, price: 900 },
    { name: 'Cotton', qty: 2, price: 700 }
  ];

  const DEFAULT_SETTINGS = {
    shopName: "Ajay'S Fassion House",
    addressLine1: '2-7/1, Himmathnagar,',
    addressLine2: 'Karimnagar, Telangana',
    phone: '9848012345',
    gstin: '',
    taxEnabled: false, // Default tax disabled for shops that do not charge GST
    taxRate: 5,
    taxType: 'single', // 'single' or 'cgst_sgst'
    taxTitle: 'GST',
    invoicePrefix: 'AFH-',
    nextSeq: 1001,
    paperWidth: '80mm', // '80mm', '58mm', 'a4'
    footerMsg: 'THANK YOU! VISIT AGAIN',
    footerPolicy: 'Goods once sold can be exchanged within 7 days with original bill.',
    upiId: '',
    currencySymbol: '₹'
  };

  // =========================================================================
  // APPLICATION STATE
  // =========================================================================
  let state = {
    settings: { ...DEFAULT_SETTINGS },
    bills: [],
    currentBill: {
      id: null,
      invoiceNumber: '',
      date: '',
      time: '',
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      paymentMethod: 'Cash',
      paymentStatus: 'Paid',
      items: [],
      discountType: 'amount', // 'amount' or 'percent'
      discountValue: 0,
      taxEnabled: false,
      taxRate: 5,
      taxBreakdownType: 'single',
      notes: '',
      // Calculated fields
      subtotal: 0,
      discountAmount: 0,
      taxAmount: 0,
      grandTotal: 0,
      amountPaid: 0,
      balanceDue: 0,
      totalQty: 0
    },
    activeTab: 'create-bill',
    historyFilters: {
      search: '',
      status: 'all',
      date: 'all'
    }
  };

  // =========================================================================
  // DOM ELEMENT REFERENCES
  // =========================================================================
  const dom = {
    // Navigation & Tabs
    tabCreateBill: document.getElementById('tabCreateBill'),
    tabPreviousBills: document.getElementById('tabPreviousBills'),
    tabShopSettings: document.getElementById('tabShopSettings'),
    viewCreateBill: document.getElementById('viewCreateBill'),
    viewPreviousBills: document.getElementById('viewPreviousBills'),
    viewShopSettings: document.getElementById('viewShopSettings'),
    billsCountBadge: document.getElementById('billsCountBadge'),
    liveClock: document.getElementById('liveClock'),

    // Dashboard Metrics
    metricTotalBills: document.getElementById('metricTotalBills'),
    metricTotalSales: document.getElementById('metricTotalSales'),
    metricTodaySales: document.getElementById('metricTodaySales'),
    metricTodayCount: document.getElementById('metricTodayCount'),
    metricProductsSold: document.getElementById('metricProductsSold'),

    // Bill Form Fields
    billingForm: document.getElementById('billingForm'),
    invNumber: document.getElementById('invNumber'),
    invDate: document.getElementById('invDate'),
    invTime: document.getElementById('invTime'),
    custName: document.getElementById('custName'),
    custPhone: document.getElementById('custPhone'),
    custAddress: document.getElementById('custAddress'),
    paymentMethod: document.getElementById('paymentMethod'),
    paymentStatus: document.getElementById('paymentStatus'),
    amountPaidInput: document.getElementById('amountPaidInput'),
    billDiscount: document.getElementById('billDiscount'),
    discountType: document.getElementById('discountType'),
    discountCalculatedHelp: document.getElementById('discountCalculatedHelp'),
    enableTaxToggle: document.getElementById('enableTaxToggle'),
    taxStatusText: document.getElementById('taxStatusText'),
    taxOptionsPanel: document.getElementById('taxOptionsPanel'),
    taxRateInput: document.getElementById('taxRateInput'),
    taxBreakdownType: document.getElementById('taxBreakdownType'),
    taxCalculatedHelp: document.getElementById('taxCalculatedHelp'),
    billNotes: document.getElementById('billNotes'),

    // Products Table in Form
    productsTable: document.getElementById('productsTable'),
    productsTableBody: document.getElementById('productsTableBody'),
    emptyProductsNotice: document.getElementById('emptyProductsNotice'),
    btnAddProductRow: document.getElementById('btnAddProductRow'),
    btnClearAllItems: document.getElementById('btnClearAllItems'),
    itemsSummaryPill: document.getElementById('itemsSummaryPill'),
    productsSubtotalPreview: document.getElementById('productsSubtotalPreview'),

    // Form Calculations Summary
    calcSubtotal: document.getElementById('calcSubtotal'),
    calcDiscount: document.getElementById('calcDiscount'),
    calcTaxRow: document.getElementById('calcTaxRow'),
    calcTaxLabel: document.getElementById('calcTaxLabel'),
    calcTax: document.getElementById('calcTax'),
    calcGrandTotal: document.getElementById('calcGrandTotal'),
    calcBalanceDue: document.getElementById('calcBalanceDue'),

    // Form Action Buttons
    btnResetForm: document.getElementById('btnResetForm'),
    btnLoadSampleBill: document.getElementById('btnLoadSampleBill'),
    btnQuickLoadSample: document.getElementById('btnQuickLoadSample'),
    btnQuickNewBill: document.getElementById('btnQuickNewBill'),
    btnSaveInvoice: document.getElementById('btnSaveInvoice'),
    btnSaveAndPrint: document.getElementById('btnSaveAndPrint'),
    btnPreviewMobileToggle: document.getElementById('btnPreviewMobileToggle'),

    // Thermal Receipt Preview Elements
    previewColumnContainer: document.getElementById('previewColumnContainer'),
    printableThermalReceipt: document.getElementById('printableThermalReceipt'),
    paperWidthBadge: document.getElementById('paperWidthBadge'),
    previewRollWidth: document.getElementById('previewRollWidth'),
    rcptShopName: document.getElementById('rcptShopName'),
    rcptShopAddr1: document.getElementById('rcptShopAddr1'),
    rcptShopAddr2: document.getElementById('rcptShopAddr2'),
    rcptShopPhoneWrap: document.getElementById('rcptShopPhoneWrap'),
    rcptShopPhone: document.getElementById('rcptShopPhone'),
    rcptGstinWrap: document.getElementById('rcptGstinWrap'),
    rcptGstin: document.getElementById('rcptGstin'),
    rcptBillTitle: document.getElementById('rcptBillTitle'),
    rcptCustRow: document.getElementById('rcptCustRow'),
    rcptCustName: document.getElementById('rcptCustName'),
    rcptCustPhoneRow: document.getElementById('rcptCustPhoneRow'),
    rcptCustPhone: document.getElementById('rcptCustPhone'),
    rcptBillNo: document.getElementById('rcptBillNo'),
    rcptDate: document.getElementById('rcptDate'),
    rcptTime: document.getElementById('rcptTime'),
    rcptPaymentMethod: document.getElementById('rcptPaymentMethod'),
    rcptItemsList: document.getElementById('rcptItemsList'),
    rcptTotalItemsCount: document.getElementById('rcptTotalItemsCount'),
    rcptTotalPcsCount: document.getElementById('rcptTotalPcsCount'),
    rcptSubtotal: document.getElementById('rcptSubtotal'),
    rcptDiscountRow: document.getElementById('rcptDiscountRow'),
    rcptDiscount: document.getElementById('rcptDiscount'),
    rcptTaxRow: document.getElementById('rcptTaxRow'),
    rcptTaxLabel: document.getElementById('rcptTaxLabel'),
    rcptTax: document.getElementById('rcptTax'),
    rcptGrandTotal: document.getElementById('rcptGrandTotal'),
    rcptAmountPaid: document.getElementById('rcptAmountPaid'),
    rcptBalanceDue: document.getElementById('rcptBalanceDue'),
    rcptStatusText: document.getElementById('rcptStatusText'),
    rcptNotesBox: document.getElementById('rcptNotesBox'),
    rcptNotesText: document.getElementById('rcptNotesText'),
    rcptFooterMsg: document.getElementById('rcptFooterMsg'),
    rcptFooterPolicy: document.getElementById('rcptFooterPolicy'),
    rcptPrintedAt: document.getElementById('rcptPrintedAt'),

    // Receipt Toolbar Buttons
    btnPrintReceipt: document.getElementById('btnPrintReceipt'),
    btnDirectPrint: document.getElementById('btnDirectPrint'),
    btnDownloadPDF: document.getElementById('btnDownloadPDF'),
    btnShareWhatsApp: document.getElementById('btnShareWhatsApp'),
    btnCopyText: document.getElementById('btnCopyText'),

    // Previous Bills History Elements
    historyTable: document.getElementById('historyTable'),
    historyTableBody: document.getElementById('historyTableBody'),
    emptyHistoryNotice: document.getElementById('emptyHistoryNotice'),
    historySearchInput: document.getElementById('historySearchInput'),
    historyFilterStatus: document.getElementById('historyFilterStatus'),
    historyFilterDate: document.getElementById('historyFilterDate'),
    btnClearHistoryFilters: document.getElementById('btnClearHistoryFilters'),
    btnExportCSV: document.getElementById('btnExportCSV'),
    btnNewBillFromHistory: document.getElementById('btnNewBillFromHistory'),
    btnEmptyCreateBill: document.getElementById('btnEmptyCreateBill'),

    // Shop Settings Elements
    settingsForm: document.getElementById('settingsForm'),
    cfgShopName: document.getElementById('cfgShopName'),
    cfgPhone: document.getElementById('cfgPhone'),
    cfgAddress1: document.getElementById('cfgAddress1'),
    cfgAddress2: document.getElementById('cfgAddress2'),
    cfgTaxEnabled: document.getElementById('cfgTaxEnabled'),
    cfgTaxDetailsGroup: document.getElementById('cfgTaxDetailsGroup'),
    cfgGstin: document.getElementById('cfgGstin'),
    cfgDefaultGstRate: document.getElementById('cfgDefaultGstRate'),
    cfgTaxTitle: document.getElementById('cfgTaxTitle'),
    cfgInvoicePrefix: document.getElementById('cfgInvoicePrefix'),
    cfgNextSeq: document.getElementById('cfgNextSeq'),
    cfgDefaultPaper: document.getElementById('cfgDefaultPaper'),
    cfgFooterMsg: document.getElementById('cfgFooterMsg'),
    cfgFooterPolicy: document.getElementById('cfgFooterPolicy'),
    cfgUPI: document.getElementById('cfgUPI'),
    btnSaveShopSettings: document.getElementById('btnSaveShopSettings'),
    btnSaveShopSettingsBottom: document.getElementById('btnSaveShopSettingsBottom'),
    btnBackupData: document.getElementById('btnBackupData'),
    restoreFileInput: document.getElementById('restoreFileInput'),
    btnTriggerRestore: document.getElementById('btnTriggerRestore'),
    btnResetHistory: document.getElementById('btnResetHistory'),

    // Mobile Sticky Bar
    mobileStickyBar: document.getElementById('mobileStickyBar'),
    mobileBarTotal: document.getElementById('mobileBarTotal'),
    mobileBarItems: document.getElementById('mobileBarItems'),
    btnMobilePreviewToggle: document.getElementById('btnMobilePreviewToggle'),
    btnMobileSavePrint: document.getElementById('btnMobileSavePrint'),

    // Modal Details
    billDetailModal: document.getElementById('billDetailModal'),
    modalBillTitle: document.getElementById('modalBillTitle'),
    modalBillReceiptContainer: document.getElementById('modalBillReceiptContainer'),
    btnCloseBillModal: document.getElementById('btnCloseBillModal'),
    btnModalClose: document.getElementById('btnModalClose'),
    btnModalWhatsApp: document.getElementById('btnModalWhatsApp'),
    btnModalPrint: document.getElementById('btnModalPrint'),

    // Toast Container
    toastContainer: document.getElementById('toastContainer')
  };

  // Currently viewed bill in modal
  let activeModalBill = null;

  // =========================================================================
  // UTILITY FUNCTIONS: Formatting, Date, Currency
  // =========================================================================

  /**
   * Format numbers to Indian Rupee standard format (e.g., 1,400.00)
   */
  function formatINR(val, includeSymbol = true) {
    const num = isNaN(Number(val)) ? 0 : Number(val);
    const formatted = num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return includeSymbol ? `${state.settings.currencySymbol || '₹'}${formatted}` : formatted;
  }

  /**
   * Get current formatted date string (YYYY-MM-DD for input value)
   */
  function getCurrentDateISO() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Format ISO date (YYYY-MM-DD) to Display Date (DD/MM/YYYY)
   */
  function formatDisplayDate(isoDateStr) {
    if (!isoDateStr) return '';
    const parts = isoDateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoDateStr;
  }

  /**
   * Get current formatted time (HH:MM:SS)
   */
  function getCurrentTime24() {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  /**
   * Format 24-hr time or full time string to 12-hour AM/PM
   */
  function formatDisplayTime(timeStr) {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    let h = parseInt(parts[0], 10);
    const m = parts[1] || '00';
    if (isNaN(h)) return timeStr;
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12; // 0 hour is 12 AM
    return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
  }

  /**
   * Generate next sequential invoice number based on settings
   */
  function generateNextInvoiceNumber() {
    const prefix = state.settings.invoicePrefix || 'AFH-';
    const seq = state.settings.nextSeq || 1001;
    return `${prefix}${seq}`;
  }

  /**
   * Show toast notification
   */
  function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'fa-info-circle';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-triangle-exclamation';
    
    toast.innerHTML = `<i class="fa-solid ${iconClass}"></i> <span>${escapeHtml(message)}</span>`;
    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'opacity 0.25s, transform 0.25s';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }

  /**
   * Sanitize string for HTML injection safety
   */
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // =========================================================================
  // PERSISTENCE & STORAGE
  // =========================================================================

  function loadSettings() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        state.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } else {
        state.settings = { ...DEFAULT_SETTINGS };
      }
    } catch (e) {
      console.warn('Error loading settings from localStorage:', e);
      state.settings = { ...DEFAULT_SETTINGS };
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
    } catch (e) {
      console.error('Error saving settings to localStorage:', e);
      showToast('Could not save settings to storage.', 'error');
    }
  }

  function loadBills() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BILLS);
      if (saved) {
        state.bills = JSON.parse(saved);
      } else {
        state.bills = [];
      }
    } catch (e) {
      console.warn('Error loading bills from localStorage:', e);
      state.bills = [];
    }
  }

  function saveBills() {
    try {
      localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(state.bills));
      updateDashboardMetrics();
    } catch (e) {
      console.error('Error saving bills to localStorage:', e);
      showToast('Could not save bill records.', 'error');
    }
  }

  // =========================================================================
  // DASHBOARD METRICS CALCULATION
  // =========================================================================
  function updateDashboardMetrics() {
    const bills = state.bills;
    const totalCount = bills.length;
    let totalSales = 0;
    let todaySales = 0;
    let todayCount = 0;
    let totalPcs = 0;

    const todayISO = getCurrentDateISO();

    bills.forEach(bill => {
      const amt = Number(bill.grandTotal) || 0;
      totalSales += amt;

      // Check if bill was created today
      if (bill.date === todayISO) {
        todaySales += amt;
        todayCount++;
      }

      // Sum quantities
      if (Array.isArray(bill.items)) {
        bill.items.forEach(it => {
          totalPcs += (Number(it.qty) || 0);
        });
      }
    });

    // Update DOM
    dom.metricTotalBills.textContent = totalCount.toLocaleString('en-IN');
    dom.metricTotalSales.textContent = formatINR(totalSales);
    dom.metricTodaySales.textContent = formatINR(todaySales);
    dom.metricTodayCount.textContent = `${todayCount} ${todayCount === 1 ? 'bill' : 'bills'} today`;
    dom.metricProductsSold.textContent = `${totalPcs.toLocaleString('en-IN')} pcs`;
    dom.billsCountBadge.textContent = totalCount;
  }

  // =========================================================================
  // BILL FORM & CALCULATION ENGINE
  // =========================================================================

  /**
   * Initialize a new bill in the form
   */
  function initNewBill(resetSequentialNumber = true) {
    if (resetSequentialNumber) {
      dom.invNumber.value = generateNextInvoiceNumber();
    }
    dom.invDate.value = getCurrentDateISO();
    dom.invTime.value = getCurrentTime24();
    dom.custName.value = '';
    dom.custPhone.value = '';
    dom.custAddress.value = '';
    dom.paymentMethod.value = 'Cash';
    dom.paymentStatus.value = 'Paid';
    dom.billDiscount.value = '0';
    dom.discountType.value = 'amount';
    dom.billNotes.value = '';

    // Inherit tax settings from store settings
    dom.enableTaxToggle.checked = state.settings.taxEnabled;
    dom.taxRateInput.value = state.settings.taxRate || 5;
    dom.taxBreakdownType.value = state.settings.taxType || 'single';
    updateTaxToggleUI();

    // Reset items list
    state.currentBill.items = [];
    renderProductRows();

    // Trigger full calculation
    calculateCurrentBill();
  }

  /**
   * Load the sample bill requested in requirement #5:
   * - Shirt — 3 pieces × ₹600 = ₹1,800
   * - Shirt — 1 piece × ₹800 = ₹800
   * - Cotton — 1 piece × ₹900 = ₹900
   * - Cotton — 2 pieces × ₹700 = ₹1,400
   * Total = ₹4,900 for 7 pieces
   */
  function loadSampleBill() {
    state.currentBill.items = SAMPLE_ITEMS.map((item, idx) => ({
      id: Date.now() + idx,
      name: item.name,
      qty: item.qty,
      price: item.price
    }));

    dom.custName.value = 'Ramesh Kumar';
    dom.custPhone.value = '9848012345';
    dom.custAddress.value = 'Karimnagar';
    dom.paymentMethod.value = 'Cash';
    dom.paymentStatus.value = 'Paid';
    dom.billDiscount.value = '0';
    dom.billNotes.value = 'Sample Garments Invoice';

    renderProductRows();
    calculateCurrentBill();

    showToast('Loaded sample bill: 4 items, 7 pieces = ₹4,900.00', 'success');
  }

  /**
   * Add a new item row to the product table
   */
  function addProductItem(name = '', qty = 1, price = 0) {
    const newItem = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      name: name,
      qty: Math.max(1, Number(qty) || 1),
      price: Math.max(0, Number(price) || 0)
    };

    state.currentBill.items.push(newItem);
    renderProductRows();
    calculateCurrentBill();

    // Focus newly created item name input
    setTimeout(() => {
      const inputs = dom.productsTableBody.querySelectorAll('.input-item-name');
      if (inputs.length > 0) {
        inputs[inputs.length - 1].focus();
      }
    }, 50);
  }

  /**
   * Remove a single product item by index or ID
   */
  function removeProductItem(itemId) {
    state.currentBill.items = state.currentBill.items.filter(it => it.id !== itemId);
    renderProductRows();
    calculateCurrentBill();
  }

  /**
   * Render dynamic product rows into the form table
   */
  function renderProductRows() {
    dom.productsTableBody.innerHTML = '';

    if (state.currentBill.items.length === 0) {
      dom.emptyProductsNotice.style.display = 'block';
      dom.productsTable.style.display = 'none';
      return;
    }

    dom.emptyProductsNotice.style.display = 'none';
    dom.productsTable.style.display = 'table';

    state.currentBill.items.forEach((item, index) => {
      const tr = document.createElement('tr');
      tr.dataset.id = item.id;

      const lineAmount = (item.qty * item.price);

      tr.innerHTML = `
        <td class="row-num">${index + 1}</td>
        <td>
          <input type="text" class="form-control input-item-name" 
                 placeholder="e.g. Shirt, Cotton Pant" 
                 value="${escapeHtml(item.name)}" 
                 data-id="${item.id}" required>
        </td>
        <td>
          <input type="number" class="form-control input-item-qty font-mono" 
                 placeholder="1" min="1" step="1" 
                 value="${item.qty}" 
                 data-id="${item.id}" required>
        </td>
        <td>
          <input type="number" class="form-control input-item-price font-mono" 
                 placeholder="0.00" min="0" step="any" 
                 value="${item.price}" 
                 data-id="${item.id}" required>
        </td>
        <td>
          <span class="item-amount-display" id="lineAmount_${item.id}">${formatINR(lineAmount)}</span>
        </td>
        <td>
          <button type="button" class="btn-row-remove" data-id="${item.id}" title="Remove this product">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </td>
      `;

      dom.productsTableBody.appendChild(tr);
    });

    // Attach listeners to row inputs
    attachRowEventListeners();
  }

  /**
   * Attach change/input listeners to dynamically generated product rows
   */
  function attachRowEventListeners() {
    // Name inputs
    dom.productsTableBody.querySelectorAll('.input-item-name').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const id = Number(e.target.dataset.id);
        const item = state.currentBill.items.find(it => it.id === id);
        if (item) {
          item.name = e.target.value;
          renderThermalReceipt(); // update live receipt
        }
      });
    });

    // Quantity inputs
    dom.productsTableBody.querySelectorAll('.input-item-qty').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const id = Number(e.target.dataset.id);
        const item = state.currentBill.items.find(it => it.id === id);
        if (item) {
          const val = parseInt(e.target.value, 10);
          item.qty = isNaN(val) || val < 1 ? 1 : val;
          updateRowLineAmount(item);
          calculateCurrentBill();
        }
      });
    });

    // Price inputs
    dom.productsTableBody.querySelectorAll('.input-item-price').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const id = Number(e.target.dataset.id);
        const item = state.currentBill.items.find(it => it.id === id);
        if (item) {
          const val = parseFloat(e.target.value);
          item.price = isNaN(val) || val < 0 ? 0 : val;
          updateRowLineAmount(item);
          calculateCurrentBill();
        }
      });
    });

    // Delete buttons
    dom.productsTableBody.querySelectorAll('.btn-row-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = Number(btn.dataset.id);
        removeProductItem(id);
      });
    });
  }

  function updateRowLineAmount(item) {
    const elem = document.getElementById(`lineAmount_${item.id}`);
    if (elem) {
      elem.textContent = formatINR(item.qty * item.price);
    }
  }

  /**
   * UI helper for the tax toggle and option panel
   */
  function updateTaxToggleUI() {
    const enabled = dom.enableTaxToggle.checked;
    if (enabled) {
      dom.taxOptionsPanel.style.display = 'block';
      dom.taxStatusText.textContent = 'Tax Enabled';
      dom.taxStatusText.style.color = 'var(--accent-green)';
    } else {
      dom.taxOptionsPanel.style.display = 'none';
      dom.taxStatusText.textContent = 'Tax Disabled (Non-GST)';
      dom.taxStatusText.style.color = 'var(--text-muted)';
    }
  }

  /**
   * CORE CALCULATION FORMULA (Requirement #6)
   *
   * Line Amount = Quantity × Price Per Piece
   * Subtotal = Sum of all product line amounts
   * Grand Total = Subtotal − Discount + Applicable Tax
   * Balance Due = Grand Total − Amount Paid
   */
  function calculateCurrentBill() {
    const bill = state.currentBill;

    // 1. Calculate Items Subtotal & Total Quantity
    let subtotal = 0;
    let totalQty = 0;

    bill.items.forEach(it => {
      const q = Math.max(1, Number(it.qty) || 1);
      const p = Math.max(0, Number(it.price) || 0);
      const line = q * p;
      it.lineAmount = line;
      subtotal += line;
      totalQty += q;
    });

    bill.subtotal = subtotal;
    bill.totalQty = totalQty;

    // 2. Calculate Discount
    const rawDisc = Math.max(0, parseFloat(dom.billDiscount.value) || 0);
    const discType = dom.discountType.value;
    let discAmount = 0;

    if (discType === 'percent') {
      const clampedPct = Math.min(100, rawDisc);
      discAmount = (subtotal * clampedPct) / 100;
      dom.discountCalculatedHelp.textContent = `Discount (${clampedPct}%): ${formatINR(discAmount)}`;
    } else {
      // Amount
      discAmount = Math.min(subtotal, rawDisc);
      dom.discountCalculatedHelp.textContent = `Discount: ${formatINR(discAmount)}`;
    }
    bill.discountAmount = discAmount;
    bill.discountValue = rawDisc;
    bill.discountType = discType;

    // 3. Tax / GST Calculation (only if enabled)
    const taxEnabled = dom.enableTaxToggle.checked;
    bill.taxEnabled = taxEnabled;
    let taxAmount = 0;
    const taxRate = Math.max(0, parseFloat(dom.taxRateInput.value) || 0);
    bill.taxRate = taxRate;
    bill.taxBreakdownType = dom.taxBreakdownType.value;

    if (taxEnabled && taxRate > 0) {
      const taxableBase = Math.max(0, subtotal - discAmount);
      taxAmount = (taxableBase * taxRate) / 100;

      if (bill.taxBreakdownType === 'cgst_sgst') {
        const halfRate = (taxRate / 2).toFixed(1);
        const halfAmount = taxAmount / 2;
        dom.taxCalculatedHelp.textContent = `CGST @ ${halfRate}% (${formatINR(halfAmount)}) + SGST @ ${halfRate}% (${formatINR(halfAmount)}) = ${formatINR(taxAmount)}`;
      } else {
        dom.taxCalculatedHelp.textContent = `GST @ ${taxRate}%: ${formatINR(taxAmount)}`;
      }
    } else {
      dom.taxCalculatedHelp.textContent = 'Tax: ₹0.00 (Disabled)';
    }
    bill.taxAmount = taxAmount;

    // 4. Grand Total Formula: Subtotal - Discount + Tax
    const grandTotal = Math.max(0, subtotal - discAmount + taxAmount);
    bill.grandTotal = grandTotal;

    // 5. Payment & Balance Calculation
    const paymentStatus = dom.paymentStatus.value;
    let paidVal = parseFloat(dom.amountPaidInput.value);

    // Auto-fill amount paid based on status unless manually modified
    if (paymentStatus === 'Paid') {
      paidVal = grandTotal;
      dom.amountPaidInput.value = grandTotal.toFixed(2);
    } else if (paymentStatus === 'Unpaid') {
      paidVal = 0;
      dom.amountPaidInput.value = '0.00';
    } else if (paymentStatus === 'Partially Paid') {
      if (isNaN(paidVal)) paidVal = 0;
    }

    if (isNaN(paidVal) || paidVal < 0) paidVal = 0;
    bill.amountPaid = paidVal;

    // Balance Due Formula: Grand Total - Amount Paid
    const balanceDue = Math.max(0, grandTotal - paidVal);
    bill.balanceDue = balanceDue;

    // 6. Update Meta from Inputs
    bill.invoiceNumber = dom.invNumber.value.trim() || generateNextInvoiceNumber();
    bill.date = dom.invDate.value || getCurrentDateISO();
    bill.time = dom.invTime.value || getCurrentTime24();
    bill.customerName = dom.custName.value.trim();
    bill.customerPhone = dom.custPhone.value.trim();
    bill.customerAddress = dom.custAddress.value.trim();
    bill.paymentMethod = dom.paymentMethod.value;
    bill.paymentStatus = paymentStatus;
    bill.notes = dom.billNotes.value.trim();

    // 7. Update Form Display Elements
    dom.itemsSummaryPill.textContent = `${bill.items.length} ${bill.items.length === 1 ? 'Item' : 'Items'} • ${totalQty} Pcs`;
    dom.productsSubtotalPreview.textContent = formatINR(subtotal);

    dom.calcSubtotal.textContent = formatINR(subtotal);
    dom.calcDiscount.textContent = `- ${formatINR(discAmount)}`;

    if (taxEnabled) {
      dom.calcTaxRow.style.display = 'flex';
      dom.calcTaxLabel.textContent = `Tax (${state.settings.taxTitle || 'GST'} ${taxRate}%):`;
      dom.calcTax.textContent = `+ ${formatINR(taxAmount)}`;
    } else {
      dom.calcTaxRow.style.display = 'none';
    }

    dom.calcGrandTotal.textContent = formatINR(grandTotal);
    dom.calcBalanceDue.textContent = formatINR(balanceDue);

    if (balanceDue === 0) {
      dom.calcBalanceDue.classList.add('balance-zero');
    } else {
      dom.calcBalanceDue.classList.remove('balance-zero');
    }

    // Update Mobile Sticky Bar
    dom.mobileBarTotal.textContent = formatINR(grandTotal);
    dom.mobileBarItems.textContent = `${bill.items.length} Items • ${totalQty} Pcs`;

    // 8. Update Live Thermal Receipt
    renderThermalReceipt();
  }

  // =========================================================================
  // LIVE THERMAL RECEIPT RENDERING (Requirement #7)
  // =========================================================================

  /**
   * Render the physical-look thermal receipt with aligned columns and dotted lines
   */
  function renderThermalReceipt(targetContainer = dom.printableThermalReceipt, billData = state.currentBill) {
    const s = state.settings;

    // Shop Header
    dom.rcptShopName.textContent = s.shopName.toUpperCase();
    dom.rcptShopAddr1.textContent = s.addressLine1;
    dom.rcptShopAddr2.textContent = s.addressLine2;

    if (s.phone) {
      dom.rcptShopPhoneWrap.style.display = 'block';
      dom.rcptShopPhone.textContent = s.phone;
    } else {
      dom.rcptShopPhoneWrap.style.display = 'none';
    }

    if (s.taxEnabled && s.gstin) {
      dom.rcptGstinWrap.style.display = 'block';
      dom.rcptGstin.textContent = s.gstin.toUpperCase();
    } else {
      dom.rcptGstinWrap.style.display = 'none';
    }

    // Bill Title
    dom.rcptBillTitle.textContent = 'TAX INVOICE / BILL';

    // Customer Meta
    if (billData.customerName) {
      dom.rcptCustRow.style.display = 'flex';
      dom.rcptCustName.textContent = billData.customerName;
    } else {
      dom.rcptCustRow.style.display = 'none';
    }

    if (billData.customerPhone) {
      dom.rcptCustPhoneRow.style.display = 'flex';
      dom.rcptCustPhone.textContent = billData.customerPhone;
    } else {
      dom.rcptCustPhoneRow.style.display = 'none';
    }

    // Bill Meta
    dom.rcptBillNo.textContent = billData.invoiceNumber || generateNextInvoiceNumber();
    dom.rcptDate.textContent = formatDisplayDate(billData.date);
    dom.rcptTime.textContent = formatDisplayTime(billData.time);
    dom.rcptPaymentMethod.textContent = billData.paymentMethod || 'Cash';

    // Items List
    dom.rcptItemsList.innerHTML = '';
    if (billData.items && billData.items.length > 0) {
      billData.items.forEach(it => {
        const row = document.createElement('div');
        row.className = 'receipt-item-row';
        const itemLineTotal = ((Number(it.qty) || 1) * (Number(it.price) || 0));

        row.innerHTML = `
          <span class="col-item">${escapeHtml(it.name || 'Garment')}</span>
          <span class="col-qty">${it.qty || 1}</span>
          <span class="col-price">${formatINR(it.price || 0, false)}</span>
          <span class="col-amount">${formatINR(itemLineTotal, false)}</span>
        `;
        dom.rcptItemsList.appendChild(row);
      });
    } else {
      dom.rcptItemsList.innerHTML = `
        <div class="receipt-item-row" style="justify-content: center; font-style: italic; color: #666;">
          (No products entered)
        </div>
      `;
    }

    // Count Summary
    dom.rcptTotalItemsCount.textContent = billData.items ? billData.items.length : 0;
    dom.rcptTotalPcsCount.textContent = `${billData.totalQty || 0} Pcs`;

    // Totals
    dom.rcptSubtotal.textContent = formatINR(billData.subtotal);

    if (billData.discountAmount > 0) {
      dom.rcptDiscountRow.style.display = 'flex';
      dom.rcptDiscount.textContent = `- ${formatINR(billData.discountAmount)}`;
    } else {
      dom.rcptDiscountRow.style.display = 'none';
    }

    // Tax Row
    if (billData.taxEnabled && billData.taxAmount > 0) {
      dom.rcptTaxRow.style.display = 'flex';
      if (billData.taxBreakdownType === 'cgst_sgst') {
        const halfRate = (billData.taxRate / 2).toFixed(1);
        dom.rcptTaxLabel.textContent = `CGST+SGST (${halfRate}%+${halfRate}%):`;
      } else {
        dom.rcptTaxLabel.textContent = `${s.taxTitle || 'GST'} (${billData.taxRate}%):`;
      }
      dom.rcptTax.textContent = formatINR(billData.taxAmount);
    } else {
      dom.rcptTaxRow.style.display = 'none';
    }

    // Grand Total, Paid, Balance
    dom.rcptGrandTotal.textContent = formatINR(billData.grandTotal);
    dom.rcptAmountPaid.textContent = formatINR(billData.amountPaid);
    dom.rcptBalanceDue.textContent = formatINR(billData.balanceDue);
    dom.rcptStatusText.textContent = (billData.paymentStatus || 'PAID').toUpperCase();

    // Notes
    if (billData.notes) {
      dom.rcptNotesBox.style.display = 'block';
      dom.rcptNotesText.textContent = billData.notes;
    } else {
      dom.rcptNotesBox.style.display = 'none';
    }

    // Footer
    dom.rcptFooterMsg.textContent = (s.footerMsg || 'THANK YOU! VISIT AGAIN').toUpperCase();
    dom.rcptFooterPolicy.textContent = s.footerPolicy || 'Goods once sold can be exchanged within 7 days with original bill.';
    dom.rcptPrintedAt.textContent = `Issued: ${formatDisplayDate(billData.date)} ${formatDisplayTime(billData.time)}`;
  }

  // =========================================================================
  // SAVE, PRINT, SHARE & EXPORT ACTIONS
  // =========================================================================

  /**
   * Validate and save the current bill to localStorage
   */
  function saveCurrentBill(quiet = false) {
    calculateCurrentBill();

    if (state.currentBill.items.length === 0) {
      showToast('Please add at least one product before saving the bill.', 'error');
      return false;
    }

    // Prepare bill record
    const billRecord = {
      id: state.currentBill.id || Date.now(),
      invoiceNumber: state.currentBill.invoiceNumber,
      date: state.currentBill.date,
      time: state.currentBill.time,
      customerName: state.currentBill.customerName,
      customerPhone: state.currentBill.customerPhone,
      customerAddress: state.currentBill.customerAddress,
      paymentMethod: state.currentBill.paymentMethod,
      paymentStatus: state.currentBill.paymentStatus,
      items: JSON.parse(JSON.stringify(state.currentBill.items)),
      subtotal: state.currentBill.subtotal,
      discountType: state.currentBill.discountType,
      discountValue: state.currentBill.discountValue,
      discountAmount: state.currentBill.discountAmount,
      taxEnabled: state.currentBill.taxEnabled,
      taxRate: state.currentBill.taxRate,
      taxBreakdownType: state.currentBill.taxBreakdownType,
      taxAmount: state.currentBill.taxAmount,
      grandTotal: state.currentBill.grandTotal,
      amountPaid: state.currentBill.amountPaid,
      balanceDue: state.currentBill.balanceDue,
      totalQty: state.currentBill.totalQty,
      notes: state.currentBill.notes,
      createdAt: new Date().toISOString()
    };

    // Check if updating existing or inserting new
    const existingIndex = state.bills.findIndex(b => b.invoiceNumber === billRecord.invoiceNumber);
    if (existingIndex >= 0) {
      state.bills[existingIndex] = billRecord;
    } else {
      state.bills.unshift(billRecord);

      // Increment sequence counter in settings
      const currentSeqMatch = billRecord.invoiceNumber.match(/\d+$/);
      if (currentSeqMatch) {
        const num = parseInt(currentSeqMatch[0], 10);
        if (num >= (state.settings.nextSeq || 1001)) {
          state.settings.nextSeq = num + 1;
          saveSettings();
        }
      }
    }

    saveBills();
    renderBillsHistory();

    if (!quiet) {
      showToast(`Bill #${billRecord.invoiceNumber} saved successfully!`, 'success');
    }

    return true;
  }

  /**
   * Save the bill and trigger the system print dialog
   */
  function saveAndPrintReceipt() {
    const saved = saveCurrentBill(true);
    if (saved) {
      showToast('Preparing thermal receipt for print...', 'info');
      setTimeout(() => {
        window.print();
      }, 300);
    }
  }

  /**
   * Generate raw text for receipt (suitable for SMS, clipboard, or thermal ESC/POS)
   */
  function generateReceiptPlainText(bill = state.currentBill) {
    const s = state.settings;
    const dateStr = formatDisplayDate(bill.date);
    const timeStr = formatDisplayTime(bill.time);

    let text = '';
    text += `========================================\n`;
    text += `       ${s.shopName.toUpperCase()}\n`;
    text += `       ${s.addressLine1}\n`;
    text += `       ${s.addressLine2}\n`;
    if (s.phone) text += `       Phone: ${s.phone}\n`;
    if (s.taxEnabled && s.gstin) text += `       GSTIN: ${s.gstin}\n`;
    text += `----------------------------------------\n`;
    text += `           TAX INVOICE / BILL           \n`;
    text += `----------------------------------------\n`;
    text += `Bill No : ${bill.invoiceNumber}\n`;
    text += `Date    : ${dateStr}  Time: ${timeStr}\n`;
    if (bill.customerName) text += `Customer: ${bill.customerName}\n`;
    if (bill.customerPhone) text += `Phone   : ${bill.customerPhone}\n`;
    text += `Payment : ${bill.paymentMethod} (${bill.paymentStatus})\n`;
    text += `----------------------------------------\n`;
    text += `Item Name         Qty    Price    Amount\n`;
    text += `----------------------------------------\n`;

    if (bill.items) {
      bill.items.forEach(it => {
        const name = (it.name || 'Garment').padEnd(16).substring(0, 16);
        const qty = String(it.qty).padStart(4);
        const price = String(it.price).padStart(8);
        const amt = String((it.qty * it.price)).padStart(9);
        text += `${name} ${qty} ${price} ${amt}\n`;
      });
    }

    text += `----------------------------------------\n`;
    text += `Total Items: ${bill.items.length}   Total Qty: ${bill.totalQty} Pcs\n`;
    text += `----------------------------------------\n`;
    text += `Subtotal:                  ₹${bill.subtotal.toFixed(2)}\n`;
    if (bill.discountAmount > 0) {
      text += `Discount:                 -₹${bill.discountAmount.toFixed(2)}\n`;
    }
    if (bill.taxEnabled && bill.taxAmount > 0) {
      text += `Tax (${bill.taxRate}%):                  ₹${bill.taxAmount.toFixed(2)}\n`;
    }
    text += `----------------------------------------\n`;
    text += `GRAND TOTAL:               ₹${bill.grandTotal.toFixed(2)}\n`;
    text += `Paid Amount:               ₹${bill.amountPaid.toFixed(2)}\n`;
    text += `Balance Due:               ₹${bill.balanceDue.toFixed(2)}\n`;
    text += `----------------------------------------\n`;
    text += `       ${s.footerMsg.toUpperCase()}\n`;
    text += `  ${s.footerPolicy}\n`;
    text += `========================================\n`;

    return text;
  }

  /**
   * Share receipt via WhatsApp
   */
  function shareViaWhatsApp(bill = state.currentBill) {
    const rawText = generateReceiptPlainText(bill);
    const encodedText = encodeURIComponent(rawText);
    
    let phone = bill.customerPhone ? bill.customerPhone.replace(/\D/g, '') : '';
    if (phone.length === 10) {
      phone = '91' + phone; // Add India country code if 10 digits
    }

    const waUrl = phone ? `https://wa.me/${phone}?text=${encodedText}` : `https://wa.me/?text=${encodedText}`;
    window.open(waUrl, '_blank');
    showToast('Opening WhatsApp with receipt details...', 'success');
  }

  /**
   * Copy receipt text to system clipboard
   */
  function copyReceiptToClipboard(bill = state.currentBill) {
    const text = generateReceiptPlainText(bill);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Receipt text copied to clipboard!', 'success');
      }).catch(() => {
        fallbackCopyText(text);
      });
    } else {
      fallbackCopyText(text);
    }
  }

  function fallbackCopyText(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showToast('Receipt text copied to clipboard!', 'success');
    } catch (err) {
      showToast('Could not copy receipt.', 'error');
    }
    document.body.removeChild(textArea);
  }

  // =========================================================================
  // PREVIOUS BILLS & HISTORY VIEW
  // =========================================================================

  function renderBillsHistory() {
    const filterText = state.historyFilters.search.toLowerCase().trim();
    const filterStatus = state.historyFilters.status;
    const filterDate = state.historyFilters.date;

    const todayISO = getCurrentDateISO();

    const filteredBills = state.bills.filter(bill => {
      // Status filter
      if (filterStatus !== 'all' && bill.paymentStatus !== filterStatus) {
        return false;
      }

      // Date filter
      if (filterDate === 'today' && bill.date !== todayISO) {
        return false;
      }

      // Search filter
      if (filterText) {
        const invMatch = (bill.invoiceNumber || '').toLowerCase().includes(filterText);
        const nameMatch = (bill.customerName || '').toLowerCase().includes(filterText);
        const phoneMatch = (bill.customerPhone || '').toLowerCase().includes(filterText);
        const itemsMatch = bill.items && bill.items.some(it => (it.name || '').toLowerCase().includes(filterText));
        if (!invMatch && !nameMatch && !phoneMatch && !itemsMatch) {
          return false;
        }
      }

      return true;
    });

    dom.historyTableBody.innerHTML = '';

    if (filteredBills.length === 0) {
      dom.historyTable.style.display = 'none';
      dom.emptyHistoryNotice.style.display = 'block';
      return;
    }

    dom.historyTable.style.display = 'table';
    dom.emptyHistoryNotice.style.display = 'none';

    filteredBills.forEach(bill => {
      const tr = document.createElement('tr');

      let statusBadgeClass = 'status-paid';
      if (bill.paymentStatus === 'Unpaid') statusBadgeClass = 'status-unpaid';
      if (bill.paymentStatus === 'Partially Paid') statusBadgeClass = 'status-partial';

      const itemCount = bill.items ? bill.items.length : 0;
      const totalPcs = bill.totalQty || (bill.items ? bill.items.reduce((acc, it) => acc + (Number(it.qty) || 0), 0) : 0);

      tr.innerHTML = `
        <td class="font-mono bold-text">${escapeHtml(bill.invoiceNumber)}</td>
        <td>
          <div>${formatDisplayDate(bill.date)}</div>
          <small class="text-muted font-mono">${formatDisplayTime(bill.time)}</small>
        </td>
        <td>
          <div class="bold-text">${escapeHtml(bill.customerName || 'Walk-in Customer')}</div>
          <small class="text-muted">${escapeHtml(bill.customerPhone || '-')}</small>
        </td>
        <td>${itemCount} Items (${totalPcs} pcs)</td>
        <td class="font-mono bold-text">${formatINR(bill.grandTotal)}</td>
        <td>${escapeHtml(bill.paymentMethod || 'Cash')}</td>
        <td>
          <span class="status-badge ${statusBadgeClass}">${escapeHtml(bill.paymentStatus || 'Paid')}</span>
        </td>
        <td class="text-right">
          <div class="history-actions-group">
            <button type="button" class="btn-icon btn-view-bill" data-inv="${bill.invoiceNumber}" title="View Receipt">
              <i class="fa-solid fa-eye"></i>
            </button>
            <button type="button" class="btn-icon btn-reprint-bill" data-inv="${bill.invoiceNumber}" title="Reprint Bill">
              <i class="fa-solid fa-print"></i>
            </button>
            <button type="button" class="btn-icon btn-whatsapp-bill" data-inv="${bill.invoiceNumber}" title="Share via WhatsApp">
              <i class="fa-brands fa-whatsapp"></i>
            </button>
            <button type="button" class="btn-icon btn-edit-bill" data-inv="${bill.invoiceNumber}" title="Load in Form / Edit">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button type="button" class="btn-icon btn-delete-bill" data-inv="${bill.invoiceNumber}" title="Delete Bill">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          </div>
        </td>
      `;

      dom.historyTableBody.appendChild(tr);
    });

    // Attach history action listeners
    attachHistoryActionListeners();
  }

  function attachHistoryActionListeners() {
    // View Bill
    dom.historyTableBody.querySelectorAll('.btn-view-bill').forEach(btn => {
      btn.addEventListener('click', () => {
        const inv = btn.dataset.inv;
        const bill = state.bills.find(b => b.invoiceNumber === inv);
        if (bill) openBillModal(bill);
      });
    });

    // Reprint Bill
    dom.historyTableBody.querySelectorAll('.btn-reprint-bill').forEach(btn => {
      btn.addEventListener('click', () => {
        const inv = btn.dataset.inv;
        const bill = state.bills.find(b => b.invoiceNumber === inv);
        if (bill) {
          loadBillIntoForm(bill);
          setTimeout(() => {
            window.print();
          }, 300);
        }
      });
    });

    // WhatsApp
    dom.historyTableBody.querySelectorAll('.btn-whatsapp-bill').forEach(btn => {
      btn.addEventListener('click', () => {
        const inv = btn.dataset.inv;
        const bill = state.bills.find(b => b.invoiceNumber === inv);
        if (bill) shareViaWhatsApp(bill);
      });
    });

    // Edit/Load
    dom.historyTableBody.querySelectorAll('.btn-edit-bill').forEach(btn => {
      btn.addEventListener('click', () => {
        const inv = btn.dataset.inv;
        const bill = state.bills.find(b => b.invoiceNumber === inv);
        if (bill) {
          loadBillIntoForm(bill);
          switchTab('create-bill');
          showToast(`Bill #${bill.invoiceNumber} loaded into editor.`, 'info');
        }
      });
    });

    // Delete
    dom.historyTableBody.querySelectorAll('.btn-delete-bill').forEach(btn => {
      btn.addEventListener('click', () => {
        const inv = btn.dataset.inv;
        if (confirm(`Are you sure you want to delete Bill #${inv}? This cannot be undone.`)) {
          state.bills = state.bills.filter(b => b.invoiceNumber !== inv);
          saveBills();
          renderBillsHistory();
          showToast(`Bill #${inv} deleted.`, 'info');
        }
      });
    });
  }

  /**
   * Load existing bill into the active bill editor
   */
  function loadBillIntoForm(bill) {
    dom.invNumber.value = bill.invoiceNumber;
    dom.invDate.value = bill.date;
    dom.invTime.value = bill.time;
    dom.custName.value = bill.customerName || '';
    dom.custPhone.value = bill.customerPhone || '';
    dom.custAddress.value = bill.customerAddress || '';
    dom.paymentMethod.value = bill.paymentMethod || 'Cash';
    dom.paymentStatus.value = bill.paymentStatus || 'Paid';
    dom.billDiscount.value = bill.discountValue || 0;
    dom.discountType.value = bill.discountType || 'amount';
    dom.enableTaxToggle.checked = !!bill.taxEnabled;
    dom.taxRateInput.value = bill.taxRate || 5;
    dom.taxBreakdownType.value = bill.taxBreakdownType || 'single';
    dom.amountPaidInput.value = (bill.amountPaid !== undefined) ? bill.amountPaid : bill.grandTotal;
    dom.billNotes.value = bill.notes || '';

    updateTaxToggleUI();

    state.currentBill.id = bill.id;
    state.currentBill.items = JSON.parse(JSON.stringify(bill.items || []));

    renderProductRows();
    calculateCurrentBill();
  }

  /**
   * Open the modal displaying full thermal receipt of a historical bill
   */
  function openBillModal(bill) {
    activeModalBill = bill;
    dom.modalBillTitle.textContent = `Bill #${bill.invoiceNumber} — ${bill.customerName || 'Walk-in'}`;

    // Clone receipt DOM and populate with bill data
    const clone = dom.printableThermalReceipt.cloneNode(true);
    clone.id = 'modalReceiptInstance';

    // Remove no-print tear edges from modal preview if preferred or keep them styled
    dom.modalBillReceiptContainer.innerHTML = '';
    dom.modalBillReceiptContainer.appendChild(clone);

    // Render bill data inside clone
    populateReceiptElement(clone, bill);

    dom.billDetailModal.style.display = 'flex';
  }

  function closeBillModal() {
    dom.billDetailModal.style.display = 'none';
    activeModalBill = null;
  }

  /**
   * Populate a cloned receipt element with specific bill data
   */
  function populateReceiptElement(container, bill) {
    const s = state.settings;
    container.querySelector('.receipt-shop-name').textContent = s.shopName.toUpperCase();
    container.querySelector('.receipt-shop-line#rcptShopAddr1').textContent = s.addressLine1;
    container.querySelector('.receipt-shop-line#rcptShopAddr2').textContent = s.addressLine2;

    const phoneWrap = container.querySelector('#rcptShopPhoneWrap');
    if (s.phone) {
      phoneWrap.style.display = 'block';
      phoneWrap.querySelector('#rcptShopPhone').textContent = s.phone;
    } else {
      phoneWrap.style.display = 'none';
    }

    const gstinWrap = container.querySelector('#rcptGstinWrap');
    if (s.taxEnabled && s.gstin) {
      gstinWrap.style.display = 'block';
      gstinWrap.querySelector('#rcptGstin').textContent = s.gstin.toUpperCase();
    } else {
      gstinWrap.style.display = 'none';
    }

    // Customer
    const custRow = container.querySelector('#rcptCustRow');
    if (bill.customerName) {
      custRow.style.display = 'flex';
      custRow.querySelector('#rcptCustName').textContent = bill.customerName;
    } else {
      custRow.style.display = 'none';
    }

    const custPhoneRow = container.querySelector('#rcptCustPhoneRow');
    if (bill.customerPhone) {
      custPhoneRow.style.display = 'flex';
      custPhoneRow.querySelector('#rcptCustPhone').textContent = bill.customerPhone;
    } else {
      custPhoneRow.style.display = 'none';
    }

    container.querySelector('#rcptBillNo').textContent = bill.invoiceNumber;
    container.querySelector('#rcptDate').textContent = formatDisplayDate(bill.date);
    container.querySelector('#rcptTime').textContent = formatDisplayTime(bill.time);
    container.querySelector('#rcptPaymentMethod').textContent = bill.paymentMethod || 'Cash';

    // Items
    const itemsList = container.querySelector('#rcptItemsList');
    itemsList.innerHTML = '';
    if (bill.items) {
      bill.items.forEach(it => {
        const row = document.createElement('div');
        row.className = 'receipt-item-row';
        const lineTotal = (it.qty * it.price);
        row.innerHTML = `
          <span class="col-item">${escapeHtml(it.name || 'Garment')}</span>
          <span class="col-qty">${it.qty}</span>
          <span class="col-price">${formatINR(it.price, false)}</span>
          <span class="col-amount">${formatINR(lineTotal, false)}</span>
        `;
        itemsList.appendChild(row);
      });
    }

    container.querySelector('#rcptTotalItemsCount').textContent = bill.items ? bill.items.length : 0;
    container.querySelector('#rcptTotalPcsCount').textContent = `${bill.totalQty || 0} Pcs`;
    container.querySelector('#rcptSubtotal').textContent = formatINR(bill.subtotal);

    const discRow = container.querySelector('#rcptDiscountRow');
    if (bill.discountAmount > 0) {
      discRow.style.display = 'flex';
      discRow.querySelector('#rcptDiscount').textContent = `- ${formatINR(bill.discountAmount)}`;
    } else {
      discRow.style.display = 'none';
    }

    const taxRow = container.querySelector('#rcptTaxRow');
    if (bill.taxEnabled && bill.taxAmount > 0) {
      taxRow.style.display = 'flex';
      taxRow.querySelector('#rcptTax').textContent = formatINR(bill.taxAmount);
    } else {
      taxRow.style.display = 'none';
    }

    container.querySelector('#rcptGrandTotal').textContent = formatINR(bill.grandTotal);
    container.querySelector('#rcptAmountPaid').textContent = formatINR(bill.amountPaid);
    container.querySelector('#rcptBalanceDue').textContent = formatINR(bill.balanceDue);
    container.querySelector('#rcptStatusText').textContent = (bill.paymentStatus || 'PAID').toUpperCase();

    const notesBox = container.querySelector('#rcptNotesBox');
    if (bill.notes) {
      notesBox.style.display = 'block';
      notesBox.querySelector('#rcptNotesText').textContent = bill.notes;
    } else {
      notesBox.style.display = 'none';
    }

    container.querySelector('#rcptFooterMsg').textContent = (s.footerMsg || 'THANK YOU! VISIT AGAIN').toUpperCase();
    container.querySelector('#rcptFooterPolicy').textContent = s.footerPolicy;
  }

  /**
   * Export all bills to standard CSV format
   */
  function exportBillsToCSV() {
    if (state.bills.length === 0) {
      showToast('No saved bills to export.', 'info');
      return;
    }

    const headers = [
      'Invoice Number',
      'Date',
      'Time',
      'Customer Name',
      'Phone Number',
      'Address',
      'Items Count',
      'Total Pieces',
      'Subtotal (INR)',
      'Discount (INR)',
      'Tax (INR)',
      'Grand Total (INR)',
      'Amount Paid (INR)',
      'Balance Due (INR)',
      'Payment Method',
      'Payment Status',
      'Notes'
    ];

    const rows = state.bills.map(b => [
      `"${b.invoiceNumber}"`,
      `"${b.date}"`,
      `"${b.time}"`,
      `"${(b.customerName || '').replace(/"/g, '""')}"`,
      `"${b.customerPhone || ''}"`,
      `"${(b.customerAddress || '').replace(/"/g, '""')}"`,
      b.items ? b.items.length : 0,
      b.totalQty || 0,
      (b.subtotal || 0).toFixed(2),
      (b.discountAmount || 0).toFixed(2),
      (b.taxAmount || 0).toFixed(2),
      (b.grandTotal || 0).toFixed(2),
      (b.amountPaid || 0).toFixed(2),
      (b.balanceDue || 0).toFixed(2),
      `"${b.paymentMethod || 'Cash'}"`,
      `"${b.paymentStatus || 'Paid'}"`,
      `"${(b.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ajay_Fashion_Bills_${getCurrentDateISO()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Exported bills history to CSV file.', 'success');
  }

  // =========================================================================
  // SHOP SETTINGS FORM SYNC
  // =========================================================================

  function populateSettingsForm() {
    const s = state.settings;
    dom.cfgShopName.value = s.shopName;
    dom.cfgPhone.value = s.phone;
    dom.cfgAddress1.value = s.addressLine1;
    dom.cfgAddress2.value = s.addressLine2;
    dom.cfgTaxEnabled.checked = !!s.taxEnabled;
    dom.cfgGstin.value = s.gstin || '';
    dom.cfgDefaultGstRate.value = s.taxRate || 5;
    dom.cfgTaxTitle.value = s.taxTitle || 'GST';
    dom.cfgInvoicePrefix.value = s.invoicePrefix || 'AFH-';
    dom.cfgNextSeq.value = s.nextSeq || 1001;
    dom.cfgDefaultPaper.value = s.paperWidth || '80mm';
    dom.cfgFooterMsg.value = s.footerMsg || 'THANK YOU! VISIT AGAIN';
    dom.cfgFooterPolicy.value = s.footerPolicy || '';
    dom.cfgUPI.value = s.upiId || '';

    // Show/hide GSTIN input group
    dom.cfgTaxDetailsGroup.style.display = s.taxEnabled ? 'grid' : 'none';

    // Sync paper width in preview dropdown
    dom.previewRollWidth.value = s.paperWidth || '80mm';
    updatePaperWidthStyle(s.paperWidth || '80mm');
  }

  function saveSettingsFromForm() {
    const s = state.settings;
    s.shopName = dom.cfgShopName.value.trim() || "Ajay'S Fassion House";
    s.phone = dom.cfgPhone.value.trim();
    s.addressLine1 = dom.cfgAddress1.value.trim();
    s.addressLine2 = dom.cfgAddress2.value.trim();
    s.taxEnabled = dom.cfgTaxEnabled.checked;
    s.gstin = dom.cfgGstin.value.trim().toUpperCase();
    s.taxRate = parseFloat(dom.cfgDefaultGstRate.value) || 5;
    s.taxTitle = dom.cfgTaxTitle.value.trim() || 'GST';
    s.invoicePrefix = dom.cfgInvoicePrefix.value.trim() || 'AFH-';
    s.nextSeq = parseInt(dom.cfgNextSeq.value, 10) || 1001;
    s.paperWidth = dom.cfgDefaultPaper.value;
    s.footerMsg = dom.cfgFooterMsg.value.trim();
    s.footerPolicy = dom.cfgFooterPolicy.value.trim();
    s.upiId = dom.cfgUPI.value.trim();

    saveSettings();

    // Re-render preview & update form defaults
    updatePaperWidthStyle(s.paperWidth);
    calculateCurrentBill();

    showToast('Shop settings updated successfully!', 'success');
  }

  function updatePaperWidthStyle(width) {
    dom.printableThermalReceipt.classList.remove('receipt-58mm', 'receipt-a4');
    if (width === '58mm') {
      dom.printableThermalReceipt.classList.add('receipt-58mm');
      dom.paperWidthBadge.textContent = '58mm Thermal (2")';
    } else if (width === 'a4') {
      dom.printableThermalReceipt.classList.add('receipt-a4');
      dom.paperWidthBadge.textContent = 'A4 Format';
    } else {
      dom.paperWidthBadge.textContent = '80mm Thermal (3")';
    }
  }

  /**
   * Backup all data to a downloadable JSON file
   */
  function exportDataBackup() {
    const backupObj = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      settings: state.settings,
      bills: state.bills
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `Ajay_Fashion_Backup_${getCurrentDateISO()}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    document.body.removeChild(dlAnchor);

    showToast('Backup downloaded successfully.', 'success');
  }

  /**
   * Restore data from a user-uploaded JSON file
   */
  function restoreDataFromFile(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed && (parsed.settings || parsed.bills)) {
          if (parsed.settings) state.settings = { ...DEFAULT_SETTINGS, ...parsed.settings };
          if (Array.isArray(parsed.bills)) state.bills = parsed.bills;

          saveSettings();
          saveBills();
          populateSettingsForm();
          renderBillsHistory();
          initNewBill();

          showToast('Data restored successfully!', 'success');
        } else {
          showToast('Invalid backup file format.', 'error');
        }
      } catch (err) {
        showToast('Error reading backup file: Invalid JSON.', 'error');
      }
    };
    reader.readAsText(file);
  }

  // =========================================================================
  // NAVIGATION & TAB SWITCHING
  // =========================================================================
  function switchTab(tabId) {
    state.activeTab = tabId;

    // Toggle tab buttons
    [dom.tabCreateBill, dom.tabPreviousBills, dom.tabShopSettings].forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Toggle panels
    dom.viewCreateBill.classList.toggle('active', tabId === 'create-bill');
    dom.viewPreviousBills.classList.toggle('active', tabId === 'previous-bills');
    dom.viewShopSettings.classList.toggle('active', tabId === 'shop-settings');

    if (tabId === 'previous-bills') {
      renderBillsHistory();
    } else if (tabId === 'shop-settings') {
      populateSettingsForm();
    }
  }

  // =========================================================================
  // EVENT LISTENERS INITIALIZATION
  // =========================================================================
  function initEventListeners() {
    // Tab switching
    dom.tabCreateBill.addEventListener('click', () => switchTab('create-bill'));
    dom.tabPreviousBills.addEventListener('click', () => switchTab('previous-bills'));
    dom.tabShopSettings.addEventListener('click', () => switchTab('shop-settings'));

    // Header Quick Actions
    dom.btnQuickLoadSample.addEventListener('click', () => {
      switchTab('create-bill');
      loadSampleBill();
    });

    dom.btnQuickNewBill.addEventListener('click', () => {
      switchTab('create-bill');
      initNewBill();
      showToast('New blank bill initialized.', 'info');
    });

    // Form Action Buttons
    dom.btnResetForm.addEventListener('click', () => {
      if (confirm('Start a new blank bill? Any unsaved edits will be cleared.')) {
        initNewBill();
        showToast('Form reset.', 'info');
      }
    });

    dom.btnLoadSampleBill.addEventListener('click', loadSampleBill);

    // Add Item Button
    dom.btnAddProductRow.addEventListener('click', () => {
      addProductItem('', 1, 0);
    });

    // Clear All Items Button
    dom.btnClearAllItems.addEventListener('click', () => {
      if (state.currentBill.items.length === 0) return;
      if (confirm('Remove all items from this bill?')) {
        state.currentBill.items = [];
        renderProductRows();
        calculateCurrentBill();
      }
    });

    // Quick Garment Preset Tags
    document.querySelectorAll('.tag-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const name = chip.dataset.name;
        const price = Number(chip.dataset.price) || 0;
        addProductItem(name, 1, price);
        showToast(`Added ${name} (₹${price})`, 'info', 1500);
      });
    });

    // Form inputs real-time calculation triggers
    [
      dom.invNumber,
      dom.invDate,
      dom.invTime,
      dom.custName,
      dom.custPhone,
      dom.custAddress,
      dom.billNotes
    ].forEach(input => {
      input.addEventListener('input', calculateCurrentBill);
    });

    dom.paymentMethod.addEventListener('change', calculateCurrentBill);

    dom.paymentStatus.addEventListener('change', () => {
      calculateCurrentBill();
    });

    dom.amountPaidInput.addEventListener('input', () => {
      // If user is editing amount paid manually, adjust status to partial if applicable
      const paid = parseFloat(dom.amountPaidInput.value) || 0;
      const total = state.currentBill.grandTotal;
      if (paid >= total && total > 0) {
        dom.paymentStatus.value = 'Paid';
      } else if (paid === 0) {
        dom.paymentStatus.value = 'Unpaid';
      } else {
        dom.paymentStatus.value = 'Partially Paid';
      }
      calculateCurrentBill();
    });

    dom.billDiscount.addEventListener('input', calculateCurrentBill);
    dom.discountType.addEventListener('change', calculateCurrentBill);

    // Tax toggle & options
    dom.enableTaxToggle.addEventListener('change', () => {
      updateTaxToggleUI();
      calculateCurrentBill();
    });

    dom.taxRateInput.addEventListener('input', calculateCurrentBill);
    dom.taxBreakdownType.addEventListener('change', calculateCurrentBill);

    // Save & Print Buttons
    dom.btnSaveInvoice.addEventListener('click', () => saveCurrentBill(false));
    dom.btnSaveAndPrint.addEventListener('click', saveAndPrintReceipt);
    dom.btnPrintReceipt.addEventListener('click', () => {
      window.print();
    });
    dom.btnDirectPrint.addEventListener('click', () => {
      window.print();
    });

    // Share & Export Buttons on Receipt Toolbar
    dom.btnShareWhatsApp.addEventListener('click', () => shareViaWhatsApp());
    dom.btnCopyText.addEventListener('click', () => copyReceiptToClipboard());
    dom.btnDownloadPDF.addEventListener('click', () => {
      // Standard browser print provides clean "Save as PDF" with perfect vector text
      showToast('Select "Save as PDF" in the destination dropdown.', 'info', 4000);
      setTimeout(() => window.print(), 300);
    });

    // Paper width selector in preview toolbar
    dom.previewRollWidth.addEventListener('change', (e) => {
      updatePaperWidthStyle(e.target.value);
    });

    // Mobile view toggles
    dom.btnPreviewMobileToggle.addEventListener('click', () => {
      dom.previewColumnContainer.scrollIntoView({ behavior: 'smooth' });
    });

    dom.btnMobilePreviewToggle.addEventListener('click', () => {
      dom.previewColumnContainer.scrollIntoView({ behavior: 'smooth' });
    });

    dom.btnMobileSavePrint.addEventListener('click', saveAndPrintReceipt);

    // History Filters
    dom.historySearchInput.addEventListener('input', (e) => {
      state.historyFilters.search = e.target.value;
      renderBillsHistory();
    });

    dom.historyFilterStatus.addEventListener('change', (e) => {
      state.historyFilters.status = e.target.value;
      renderBillsHistory();
    });

    dom.historyFilterDate.addEventListener('change', (e) => {
      state.historyFilters.date = e.target.value;
      renderBillsHistory();
    });

    dom.btnClearHistoryFilters.addEventListener('click', () => {
      dom.historySearchInput.value = '';
      dom.historyFilterStatus.value = 'all';
      dom.historyFilterDate.value = 'all';
      state.historyFilters.search = '';
      state.historyFilters.status = 'all';
      state.historyFilters.date = 'all';
      renderBillsHistory();
    });

    dom.btnExportCSV.addEventListener('click', exportBillsToCSV);
    dom.btnNewBillFromHistory.addEventListener('click', () => {
      switchTab('create-bill');
      initNewBill();
    });
    dom.btnEmptyCreateBill.addEventListener('click', () => {
      switchTab('create-bill');
      initNewBill();
    });

    // Settings listeners
    dom.cfgTaxEnabled.addEventListener('change', () => {
      dom.cfgTaxDetailsGroup.style.display = dom.cfgTaxEnabled.checked ? 'grid' : 'none';
    });

    dom.btnSaveShopSettings.addEventListener('click', saveSettingsFromForm);
    dom.btnSaveShopSettingsBottom.addEventListener('click', saveSettingsFromForm);

    dom.btnBackupData.addEventListener('click', exportDataBackup);
    dom.btnTriggerRestore.addEventListener('click', () => dom.restoreFileInput.click());
    dom.restoreFileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        restoreDataFromFile(e.target.files[0]);
      }
    });

    dom.btnResetHistory.addEventListener('click', () => {
      if (confirm('WARNING: Are you sure you want to delete all saved bills? This cannot be undone!')) {
        if (confirm('Please confirm one more time: permanently erase all billing history?')) {
          state.bills = [];
          saveBills();
          renderBillsHistory();
          showToast('Bills history has been cleared.', 'info');
        }
      }
    });

    // Modal listeners
    dom.btnCloseBillModal.addEventListener('click', closeBillModal);
    dom.btnModalClose.addEventListener('click', closeBillModal);
    dom.billDetailModal.addEventListener('click', (e) => {
      if (e.target === dom.billDetailModal) closeBillModal();
    });

    dom.btnModalPrint.addEventListener('click', () => {
      if (activeModalBill) {
        loadBillIntoForm(activeModalBill);
        closeBillModal();
        switchTab('create-bill');
        setTimeout(() => window.print(), 300);
      }
    });

    dom.btnModalWhatsApp.addEventListener('click', () => {
      if (activeModalBill) {
        shareViaWhatsApp(activeModalBill);
      }
    });

    // Keyboard Shortcuts: Ctrl+P to print, Ctrl+S to save
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        window.print();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveCurrentBill(false);
      }
    });

    // Live clock ticker
    setInterval(updateLiveClock, 1000);
  }

  function updateLiveClock() {
    const now = new Date();
    dom.liveClock.textContent = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }

  // =========================================================================
  // INITIALIZATION ON PAGE LOAD
  // =========================================================================
  function initApp() {
    loadSettings();
    loadBills();
    populateSettingsForm();
    initNewBill();
    updateDashboardMetrics();
    initEventListeners();
    updateLiveClock();

    console.log("Ajay'S Fassion House Billing Application initialized successfully.");
  }

  // Boot on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
