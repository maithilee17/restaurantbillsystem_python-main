/* app.js - RestoBill client-side SPA (cleaned & fixed) */
const LS_MENU = 'rb_menu';
const LS_TABLES = 'rb_tables';
const LS_ORDERS = 'rb_orders';
const TAX_RATE = 0.10; // 10%

// Format prices in Indian Rupees (₹)
const formatINR = amount => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR'
}).format(amount);

const $ = s => document.querySelector(s);
const appRoot = $('#app');
const modalRoot = document.getElementById('modal-root');

const read = (k, fallback) => {
  const raw = localStorage.getItem(k);
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
};
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

// seed example data on first run (creates 15 available tables)
function seed() {
  // only write menu if it doesn't exist already
  if (!read(LS_MENU)) {
    write(LS_MENU, [
      // Starters
      { id: 'm1', name: 'Samosa (2 pcs)', price: 40.00, category: 'Starter' },
      { id: 'm2', name: 'Paneer Tikka', price: 220.00, category: 'Starter' },
      // Snacks
      { id: 'm3', name: 'Veg Sandwich', price: 80.00, category: 'Snacks' },
      { id: 'm4', name: 'French Fries', price: 120.00, category: 'Snacks' },
      // Main course
      { id: 'm5', name: 'Butter Chicken (Half)', price: 350.00, category: 'Main course' },
      { id: 'm6', name: 'Paneer Butter Masala', price: 300.00, category: 'Main course' },
      { id: 'm7', name: 'Dal Tadka', price: 160.00, category: 'Main course' },
      { id: 'm8', name: 'Jeera Rice', price: 90.00, category: 'Main course' },
      { id: 'm9', name: 'Roti (per piece)', price: 12.00, category: 'Main course' },
      { id: 'm10', name: 'Veg Biryani (Plate)', price: 220.00, category: 'Main course' },
      // Desserts
      { id: 'm11', name: 'Gulab Jamun (2 pcs)', price: 60.00, category: 'Dessert' },
      { id: 'm12', name: 'Rasmalai (2 pcs)', price: 90.00, category: 'Dessert' },
      // Drinks
      { id: 'm13', name: 'Masala Chai', price: 30.00, category: 'Drink' },
      { id: 'm14', name: 'Cold Coffee', price: 120.00, category: 'Drink' },
      { id: 'm15', name: 'Soft Drink (330ml)', price: 60.00, category: 'Drink' }
    ]);
  }

  // create 15 tables if missing
  if (!read(LS_TABLES)) {
    const tables = [];
    for (let i = 1; i <= 15; i++) {
      tables.push({
        id: 't' + i,
        number: i,
        status: 'available',
        currentOrderId: null
      });
    }
    write(LS_TABLES, tables);
  }

  if (!read(LS_ORDERS)) write(LS_ORDERS, []);
}

seed();

/* ---- tiny DOM builder ---- */
const el = (tag, attrs = {}, ...children) => {
  const e = document.createElement(tag);
  for (const k in attrs) {
    if (k.startsWith('on') && typeof attrs[k] === 'function') {
      e.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
    } else if (k === 'class') {
      e.className = attrs[k];
    } else {
      e.setAttribute(k, attrs[k]);
    }
  }
  for (const c of children) if (c || c === 0) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  return e;
};

/* ---- routing ---- */
function navigate(hash) { location.hash = hash; }
window.addEventListener('hashchange', router);
document.addEventListener('DOMContentLoaded', () => {
  const y = $('#year');
  if (y) y.textContent = new Date().getFullYear();
  router();
});

function router() {
  const hash = location.hash.replace('#', '') || 'home';
  document.querySelectorAll('.nav a').forEach(a => {
    const target = a.getAttribute('href').replace('#', '');
    a.classList.toggle('active', target === hash || (target === 'menu' && hash.startsWith('menu')));
  });
  if (hash === 'home') renderHome();
  else if (hash === 'tables') renderTables();
  else if (hash === 'menu') renderMenu();
  else if (hash === 'orders') renderOrders();
  else if (hash.startsWith('table:')) renderTableView(hash.split(':')[1]);
  else if (hash.startsWith('bill:')) renderBill(hash.split(':')[1]);
  else renderHome();
}

/* ---------- HOME ---------- */
function renderHome() {
  appRoot.innerHTML = '';

  const container = el('div', { class: 'home-container' },
    el('h1', { class: 'home-title' }, 'Restaurant Bill System'),
    el('p', { class: 'home-subtitle' },
      'Manage your restaurant operations with ease. Handle tables, orders, menu items, and billing all in one place.'
    ),

    el('div', { class: 'home-features' },
      el('div', { class: 'feature-card clickable', onClick: () => navigate('menu') },
        el('div', { class: 'feature-icon orange' }, '👨‍🍳'),
        el('h3', {}, 'Menu Management'),
        el('p', {}, 'Browse dishes and add to table orders')
      ),

      el('div', { class: 'feature-card clickable', onClick: () => navigate('tables') },
        el('div', { class: 'feature-icon green' }, '🪑'),
        el('h3', {}, 'Tables'),
        el('p', {}, 'Manage tables and start orders')
      ),

      el('div', { class: 'feature-card clickable', onClick: () => navigate('orders') },
        el('div', { class: 'feature-icon blue' }, '💵'),
        el('h3', {}, 'Orders'),
        el('p', {}, 'View all orders and bills')
      )
    ),

    el('button', { class: 'btn get-started', onClick: () => navigate('tables') }, 'Get Started')
  );

  appRoot.appendChild(container);
}

/* ---------- TABLES ---------- */
function ensureFifteenTables() {
  const tables = read(LS_TABLES, []) || [];
  const existingNumbers = new Set(tables.map(t => Number(t.number)));
  let nextIdSuffix = Date.now();
  for (let i = 1; i <= 15; i++) {
    if (!existingNumbers.has(i)) {
      tables.push({
        id: 't' + (nextIdSuffix++),
        number: i,
        status: 'available',
        currentOrderId: null
      });
    }
  }
  tables.sort((a, b) => Number(a.number) - Number(b.number));
  write(LS_TABLES, tables);
  return tables;
}

function renderTables() {
  appRoot.innerHTML = '';
  appRoot.appendChild(el('div', { class: 'title' }, 'Tables'));
  appRoot.appendChild(el('div', { class: 'subtitle' }, 'Manage restaurant tables and orders'));

  const tables = ensureFifteenTables();

  // no add-table button as requested
  const grid = el('div', { class: 'tables-grid' });
  tables.forEach(t => {
    const card = el('div', { class: 'table-card card' },
      el('h2', {}, String(t.number)),
      el('div', { class: 'badge ' + (t.status === 'available' ? 'available' : 'occupied') }, t.status),
      el('div', { class: 'table-actions' },
        t.status === 'available'
          ? el('button', { class: 'btn primary', onClick: () => startOrderForTable(t.id) }, 'Start Order')
          : el('button', { class: 'btn', onClick: () => navigate(`table:${t.id}`) }, 'View Order')
      )
    );
    card.style.borderColor = t.status === 'available' ? 'rgba(16,185,129,0.28)' : 'rgba(239,68,68,0.14)';
    grid.appendChild(card);
  });

  appRoot.appendChild(el('div', { style: 'margin-top:18px' }, grid));
}

function startOrderForTable(tableId) {
  const tables = read(LS_TABLES, []);
  const t = tables.find(x => x.id === tableId);
  if (!t) return;
  const orderId = 'o' + Date.now();
  const orders = read(LS_ORDERS, []);
  const order = { id: orderId, tableId, tableNumber: t.number, items: [], subtotal: 0, tax: 0, total: 0, status: 'pending', createdAt: new Date().toISOString() };
  orders.push(order);
  write(LS_ORDERS, orders);
  t.currentOrderId = orderId;
  t.status = 'occupied';
  write(LS_TABLES, tables);
  navigate(`table:${tableId}`);
}

/* ---------- MENU ---------- */
function renderMenu() {
  appRoot.innerHTML = '';
  appRoot.appendChild(el('div', { class: 'title' }, 'Menu'));
  appRoot.appendChild(el('div', { class: 'subtitle' }, 'All dishes available in the restaurant with prices'));

  // Group by category
  const menu = read(LS_MENU, []);
  const byCat = menu.reduce((acc, m) => {
    const cat = m.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(m);
    return acc;
  }, {});

  const container = el('div', { style: 'margin-top:18px' });

  // For each category show heading and items (NO plus on menu page)
  Object.keys(byCat).forEach(cat => {
    container.appendChild(el('h3', { style: 'margin:18px 0 8px' }, cat));
    const list = el('div', { class: 'menu-section' });
    byCat[cat].forEach(m => {
      const row = el('div', { class: 'item card menu-row' },
        el('div', { class: 'meta' },
          el('div', { style: 'font-weight:700' }, m.name),
          el('div', { class: 'small' }, m.category || 'Uncategorized')
        ),
        el('div', { class: 'price-and-action' },
          el('div', { class: 'price' }, formatINR(m.price))
          // Note: intentionally no + button here (menu page shows only name+price)
        )
      );
      list.appendChild(row);
    });
    container.appendChild(list);
  });

  appRoot.appendChild(container);
}

/* ---------- TABLE VIEW / ORDER SIDEBAR ---------- */
function renderTableView(tableId) {
  appRoot.innerHTML = '';
  const tables = read(LS_TABLES, []);
  const table = tables.find(t => t.id === tableId);
  if (!table) { appRoot.appendChild(el('div', {}, 'Table not found')); return; }

  const container = el('div', { class: 'section' });
  const left = el('div', { class: 'left' });
  left.appendChild(el('div', { class: 'title' }, `Table ${table.number}`));
  left.appendChild(el('div', { class: 'subtitle' }, 'Select items from the menu'));

  const menu = read(LS_MENU, []);
  const categories = Array.from(new Set(menu.map(m => m.category || 'Uncategorized')));
  const filterRow = el('div', { style: 'display:flex;gap:8px;margin:12px 0' });
  filterRow.appendChild(el('button', { class: 'btn', onClick: () => renderMenuList(left, menu, tableId) }, 'all'));
  categories.forEach(c => filterRow.appendChild(el('button', { class: 'btn', onClick: () => renderMenuList(left, menu.filter(it => it.category === c), tableId) }, c)));
  left.appendChild(filterRow);
  renderMenuList(left, menu, tableId);

  const right = el('div', { class: 'right' });
  right.appendChild(renderOrderSidebar(tableId));

  container.appendChild(left); container.appendChild(right);
  appRoot.appendChild(container);
}

// Menu list inside a TABLE view (has plus buttons to add to this table)
function renderMenuList(parent, items, tableId) {
  const existing = parent.querySelector('.items-list');
  if (existing) existing.remove();
  const list = el('div', { class: 'items-list' });

  items.forEach(m => {
    const row = el('div', { class: 'item' },
      el('div', { class: 'meta' },
        el('div', { style: 'font-weight:700' }, m.name),
        el('div', { class: 'small' }, formatINR(m.price))
      ),
      // plus button inside table view to quickly add one qty
      el('div', {}, el('button', { class: 'plus', onClick: () => addItemToOrder(tableId, m.id) }, '+'))
    );
    list.appendChild(row);
  });

  parent.appendChild(list);
}

function renderOrderSidebar(tableId) {
  const card = el('div', { class: 'card order-sidebar' });
  const tables = read(LS_TABLES, []);
  const t = tables.find(tt => tt.id === tableId);
  const orders = read(LS_ORDERS, []);
  const ord = t && t.currentOrderId ? orders.find(o => o.id === t.currentOrderId) : null;

  card.appendChild(el('div', { class: 'title' }, 'Current Order'));
  card.appendChild(el('div', { class: 'small' }, t ? `Table ${t.number}` : 'Table'));

  const orderList = el('div', { class: 'order-list' });
  if (!ord || !ord.items.length) {
    orderList.appendChild(el('div', { class: 'small', style: 'padding:24px;color:var(--muted)' }, 'No items added yet'));
  } else {
    const menu = read(LS_MENU, []);
    ord.items.forEach(it => {
      const m = menu.find(mm => mm.id === it.menuId);
      if (!m) return;
      const row = el('div', { class: 'order-row' },
        el('div', {}, el('div', { style: 'font-weight:700' }, m.name), el('div', { class: 'small' }, `${formatINR(m.price)} each`)),
        el('div', { class: 'qty-controls' },
          el('button', { class: 'icon-btn', onClick: () => changeQty(ord.id, it.menuId, -1, tableId) }, '-'),
          el('div', {}, String(it.qty)),
          el('button', { class: 'icon-btn', onClick: () => changeQty(ord.id, it.menuId, +1, tableId) }, '+'),
          el('div', { style: 'min-width:70px;text-align:right;font-weight:700' }, formatINR(m.price * it.qty))
        )
      );
      orderList.appendChild(row);
    });
  }
  card.appendChild(orderList);

  const sub = ord ? ord.items.reduce((s,it)=> {
    const m = read(LS_MENU,[]).find(mm => mm.id === it.menuId);
    return s + (m ? m.price * it.qty : 0);
  }, 0) : 0;

  const tax = +(sub * TAX_RATE).toFixed(2);
  const total = +(sub + tax).toFixed(2);

  card.appendChild(el('div', { class: 'summary-row' }, el('div', {}, 'Subtotal'), el('div', {}, formatINR(sub))));
  card.appendChild(el('div', { class: 'summary-row' }, el('div', {}, `Tax (${(TAX_RATE*100).toFixed(0)}%)`), el('div', {}, formatINR(tax))));
  card.appendChild(el('div', { class: 'total-row' }, el('div', {}, 'Total'), el('div', {}, formatINR(total))));

  const saveBtn = el('button', { class: 'btn primary', onClick: () => {
    if (!t || !t.currentOrderId) return alert('Add items to an order first.');
    saveOrderForTable(tableId);
    toast('Order saved');
    // stay on same page — do not navigate away
  }}, 'Save Order');

  const genBtn = el('button', { class: 'btn', onClick: () => {
    if (!t || !t.currentOrderId) { alert('No saved order. Save first.'); return; }
    navigate(`bill:${t.currentOrderId}`);
  }}, 'Generate Bill');

  card.appendChild(el('div', { style: 'display:flex;flex-direction:column;gap:8px;margin-top:12px' }, saveBtn, genBtn));
  return card;
}

function addItemToOrder(tableId, menuId) {
  const tables = read(LS_TABLES, []);
  const t = tables.find(tt => tt.id === tableId);
  if (!t) return;
  if (!t.currentOrderId) startOrderForTable(tableId);
  const orders = read(LS_ORDERS, []);
  const ord = orders.find(o => o.id === t.currentOrderId);
  if (!ord) return;
  const existing = ord.items.find(it => it.menuId === menuId);
  if (existing) existing.qty += 1; else ord.items.push({ menuId, qty: 1 });
  recalcOrder(ord);
  write(LS_ORDERS, orders);
  renderTableView(tableId);
}

function changeQty(orderId, menuId, delta, tableId) {
  const orders = read(LS_ORDERS, []);
  const ord = orders.find(o => o.id === orderId);
  if (!ord) return;
  const it = ord.items.find(i => i.menuId === menuId);
  if (!it) return;
  it.qty += delta;
  if (it.qty <= 0) ord.items = ord.items.filter(x => x.menuId !== menuId);
  recalcOrder(ord);
  write(LS_ORDERS, orders);
  renderTableView(tableId);
}

function recalcOrder(ord) {
  const menu = read(LS_MENU, []);
  const subtotal = ord.items.reduce((s,it) => {
    const m = menu.find(mm => mm.id === it.menuId);
    return s + (m ? m.price * it.qty : 0);
  }, 0);
  ord.subtotal = +subtotal.toFixed(2);
  ord.tax = +(ord.subtotal * TAX_RATE).toFixed(2);
  ord.total = +(ord.subtotal + ord.tax).toFixed(2);
}

function saveOrderForTable(tableId) {
  const tables = read(LS_TABLES, []);
  const t = tables.find(tt => tt.id === tableId);
  if (!t || !t.currentOrderId) return;
  const orders = read(LS_ORDERS, []);
  const ord = orders.find(o => o.id === t.currentOrderId);
  if (!ord) return;
  recalcOrder(ord);
  write(LS_ORDERS, orders);
  t.status = 'occupied';
  write(LS_TABLES, tables);
}

/* ---------- BILL ---------- */
function renderBill(orderId) {
  appRoot.innerHTML = '';
  const orders = read(LS_ORDERS, []);
  const ord = orders.find(o => o.id === orderId);
  if (!ord) { appRoot.appendChild(el('div', {}, 'Bill not found')); return; }
  const menu = read(LS_MENU, []);

  // Receipt container (styled in CSS)
  const receipt = el('div', { class: 'receipt-paper' },
    el('h2', { class: 'receipt-title' }, 'Restaurant Bill'),
    el('div', { class: 'receipt-meta' },
      el('div', {}, `Table ${ord.tableNumber}`),
      el('div', {}, new Date(ord.createdAt).toLocaleString('en-IN'))
    ),
    el('hr')
  );

  ord.items.forEach(it => {
    const m = menu.find(mm => mm.id === it.menuId);
    if (!m) return;
    receipt.appendChild(
      el('div', { class: 'receipt-item' },
        el('div', { class: 'item-name' }, `${m.name} x${it.qty}`),
        el('div', { class: 'item-price' }, formatINR(m.price * it.qty))
      )
    );
  });

  receipt.appendChild(el('hr'));

  receipt.appendChild(el('div', { class: 'receipt-summary' }, el('div', {}, 'Subtotal'), el('div', {}, formatINR(ord.subtotal))));
  receipt.appendChild(el('div', { class: 'receipt-summary' }, el('div', {}, `Tax (${(TAX_RATE * 100).toFixed(0)}%)`), el('div', {}, formatINR(ord.tax))));
  receipt.appendChild(el('div', { class: 'receipt-total' }, el('div', {}, 'Total'), el('div', {}, formatINR(ord.total))));

  const complete = el('button', {
    class: 'btn primary',
    onClick: () => {
      completePayment(orderId);
      toast('Payment completed');
      navigate('orders');
    }
  }, 'Complete Payment');

  receipt.appendChild(el('div', { class: 'receipt-actions' }, complete));
  appRoot.appendChild(receipt);
}

function completePayment(orderId) {
  const orders = read(LS_ORDERS, []);
  const ord = orders.find(o => o.id === orderId);
  if (!ord) return;
  ord.status = 'completed';
  ord.completedAt = new Date().toISOString();
  write(LS_ORDERS, orders);
  const tables = read(LS_TABLES, []);
  const t = tables.find(tt => tt.id === ord.tableId);
  if (t) { t.status = 'available'; t.currentOrderId = null; write(LS_TABLES, tables); }
}

/* ---------- ORDERS ---------- */
function deleteOrder(orderId) {
  const orders = read(LS_ORDERS, []);
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx === -1) { toast('Order not found'); return; }

  const order = orders[idx];
  const tables = read(LS_TABLES, []);
  const table = tables.find(t => t.id === order.tableId);
  if (table && table.currentOrderId === orderId) {
    table.currentOrderId = null;
    table.status = 'available';
    write(LS_TABLES, tables);
  }

  orders.splice(idx, 1);
  write(LS_ORDERS, orders);
  toast('Order deleted');
  renderOrders();
  if (location.hash.replace('#','') === 'tables') renderTables();
}

function renderOrders() {
  appRoot.innerHTML = '';
  const card = el('div', {}, el('div', { class: 'title' }, 'Orders History'), el('div', { class: 'subtitle' }, 'All orders'));
  appRoot.appendChild(card);

  const orders = read(LS_ORDERS, []).slice().reverse();
  const list = el('div', { class: 'orders-list' });

  orders.forEach(o => {
    const statusClass = o.status === 'completed' ? 'completed' : 'pending';
    const node = el('div', { class: 'order-item' },
      el('div', {},
        el('div', { style: 'font-weight:700' }, `Table ${o.tableNumber}`),
        el('div', { class: 'small' }, new Date(o.createdAt).toLocaleString())
      ),
      el('div', { style: 'text-align:right' },
        el('div', { style: 'font-weight:700;font-size:20px' }, formatINR(o.total)),
        el('div', { class: 'small' }, `${o.items.length} items`)
      ),
      el('div', {}, el('div', { class: 'status ' + statusClass }, o.status)),
      el('div', { style: 'display:flex;flex-direction:column;gap:8px;margin-left:12px' },
        el('button', { class: 'btn', onClick: () => navigate(`bill:${o.id}`) }, 'View Bill'),
        el('button', { class: 'btn', style: 'background:#fff;border:1px solid rgba(239,68,68,0.2);color:#ef4444', onClick: () => deleteOrder(o.id) }, 'Delete')
      )
    );
    list.appendChild(node);
  });

  appRoot.appendChild(list);
}

/* ---- modal + toast helpers ---- */
function createModal() {
  const wrapper = el('div');
  const content = el('div', { class: 'modal card' });
  wrapper.appendChild(content);
  return { node: wrapper, content };
}

function showModal(node) {
  const backdrop = el('div', { class: 'modal-backdrop' });
  backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(backdrop); });
  backdrop.appendChild(node);
  modalRoot.appendChild(backdrop);
  modalRoot.setAttribute('aria-hidden', 'false');
  return backdrop;
}

function closeModal(backdropOrNode) {
  if (!backdropOrNode) return;
  let backdrop = backdropOrNode;
  if (backdropOrNode.parentElement && backdropOrNode.parentElement.classList.contains('modal-backdrop')) {
    backdrop = backdropOrNode.parentElement;
  }
  if (backdrop && backdrop.parentElement === modalRoot) {
    backdrop.remove();
    modalRoot.setAttribute('aria-hidden', 'true');
  }
}

function toast(msg) {
  const t = el('div', { class: 'card toast' }, msg);
  // minimal inline styles (you can style .toast in CSS instead)
  t.style.position = 'fixed';
  t.style.left = '50%';
  t.style.transform = 'translateX(-50%)';
  t.style.top = '18px';
  t.style.background = '#ecfdf5';
  t.style.border = '1px solid rgba(16,185,129,0.2)';
  t.style.zIndex = 60;
  t.style.padding = '12px 18px';
  t.style.borderRadius = '8px';
  t.style.color = '#047857';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2000);
}
