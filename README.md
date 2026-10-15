# Ajay'S Fassion House — Billing & Invoice Generator

A complete, professional, mobile-friendly billing website designed specifically for **Ajay'S Fassion House** clothing store in Karimnagar, Telangana. Built with clean HTML5, CSS3, and vanilla JavaScript, featuring an authentic traditional thermal-paper billing receipt and a modern store dashboard.

---

## 🌟 Key Features

### 1. Store Details
- **Shop Name**: Ajay'S Fassion House
- **Address**: 2-7/1, Himmathnagar, Karimnagar, Telangana
- **Phone Number**: Configurable by the shop owner in Settings
- **GSTIN**: Configurable, toggleable (disabled by default for non-GST shops)
- **Invoice Title**: `TAX INVOICE / BILL`
- **Currency**: Indian Rupees (`₹`) formatted with two decimal places (`₹4,900.00`)

### 2. Traditional Thermal Receipt Design
- Realistic 80mm (3-inch) and 58mm (2-inch) thermal paper representation with subtle paper textures and serrated tear edge.
- Pure black printer-friendly text with high contrast.
- Thin dotted separator lines (`----------------------------------------`) and double cut lines.
- Aligned columns: `Item Name`, `Qty` (pieces), `Price`, `Amount`.
- Prominent shop name and address at the top.
- Dedicated `@media print` CSS rules:
  - Hides dashboard headers, buttons, cards, and forms.
  - Sized for zero-margin thermal printer rolls and standard A4 printing.
  - Zero decorative graphics or animations in print mode.

### 3. Dashboard Metrics Cards
Automatically calculates and displays live business metrics from saved bills in `localStorage`:
- **Total Bills Created**: Lifetime bill count
- **Total Sales**: Cumulative revenue in ₹
- **Today's Sales**: Revenue collected on the current date
- **Products Sold**: Total garment pieces sold across all bills

### 4. Create New Bill Form
- **Invoice Number**: Automatically generates sequential numbers (e.g. `AFH-1001`, `AFH-1002`).
- **Invoice Date & Time**: Defaults to live date and current time.
- **Customer Information**: Customer Name, Phone Number, and Billing Address (optional).
- **Payment Options**:
  - Methods: `Cash`, `UPI / GPay / PhonePe`, `Card`, `Other`.
  - Statuses: `Paid`, `Unpaid`, `Partially Paid`.
  - Amount Paid & Balance Due auto-calculated in real time.

### 5. Product & Quantity Entry
- Add multiple products per bill with real-time recalculations.
- Each row contains:
  - Item Name (e.g. Shirt, Cotton Pant, Jeans, Kurta)
  - Quantity in pieces (positive integer)
  - Price per piece in ₹
  - Automatic line amount (`Quantity × Price Per Piece`)
  - Remove button
- **Quick Preset Garment Chips**: 1-click addition of common clothing items (`+ Shirt ₹600`, `+ Cotton ₹700`, `+ Jeans ₹1,200`, etc.).
- **Load Sample Bill Button**: Loads the exact sample clothing bill:
  - Shirt — 3 pieces × ₹600 = ₹1,800
  - Shirt — 1 piece × ₹800 = ₹800
  - Cotton — 1 piece × ₹900 = ₹900
  - Cotton — 2 pieces × ₹700 = ₹1,400
  - **Sample Total**: **₹4,900.00 for 7 pieces**
- Bills start blank by default, allowing the shop owner to choose when to load sample data.

### 6. Dynamic Bill Calculations
- `Line Amount = Quantity × Price Per Piece`
- `Subtotal = Sum of all product line amounts`
- `Grand Total = Subtotal − Discount + Applicable Tax`
- `Balance Due = Grand Total − Amount Paid`
- Discount supports both Fixed Amount (`₹`) and Percentage (`%`).
- Configurable GST/Tax:
  - Fully toggleable ON/OFF.
  - Custom GST rate (e.g. 5%, 12%).
  - Single GST rate or split CGST + SGST breakdown.

### 7. Previous Bills & History
- Comprehensive bill records stored locally.
- Search by invoice number, customer name, phone number, or product item.
- Filter by payment status (`Paid`, `Unpaid`, `Partially Paid`) or date (`Today`, `This Week`, `This Month`).
- Actions:
  - **View Bill**: Pop-up modal with complete thermal receipt.
  - **Reprint**: 1-click direct printing.
  - **WhatsApp Share**: Send receipt summary directly to customer's WhatsApp.
  - **Edit/Load**: Reload past bill into the editor.
  - **Delete**: Remove record with confirmation.
  - **Export to CSV**: Export all sales records to an Excel-compatible CSV file.

### 8. Shop Settings & Data Management
- Store name, address lines, and contact phone number.
- Tax toggle, GSTIN number, and default GST rate.
- Invoice prefix (e.g. `AFH-`) and next sequence number.
- Thermal roll paper width selection (80mm vs 58mm vs A4).
- Custom receipt footer greetings and return/exchange policy notes.
- Optional UPI ID for digital payment reference.
- **Backup & Restore**: Download all billing records as a JSON file and restore anytime.

---

## 🚀 How to Run

1. Open `index.html` directly in any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari):
   - Simply double-click `index.html` or drag and drop it into your browser.
2. Or serve locally with Python:
   ```bash
   python -m http.server 8080
   ```
   Then open `http://localhost:8080` in your browser.

---

## ⌨️ Keyboard Shortcuts
- `Ctrl + P` (or `Cmd + P`): Open Thermal Receipt Print Dialog.
- `Ctrl + S` (or `Cmd + S`): Save current bill record.

---

## 🖨️ Thermal Printer Setup Tips
When printing on 58mm or 80mm thermal receipt roll printers (Epson, TVS, NGX, POSIFLEX, Bluetooth thermal printers):
1. In the browser print dialog, choose your thermal printer under **Destination**.
2. Select **Paper Size**: `80mm` or `58mm` (Roll Paper).
3. Set **Margins**: `None` or `Minimum`.
4. Uncheck **Headers and Footers** to prevent browser URLs and timestamps from appearing on the receipt.
