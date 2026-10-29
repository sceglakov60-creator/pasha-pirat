const state = { products: [], hot: [], category: 'Все товары', sort: 'popular' };
const fallbackImage = 'photo-unavailable.png';
const money = value => `${new Intl.NumberFormat('ru-RU').format(value)} ₽`;

function productCard(product, hot = false) {
  const specs = [];
  if (product.power) specs.push(`${product.power} залпов`);
  if (product.duration) specs.push(`${product.duration} сек.`);
  if (product.caliber) specs.push(`Калибр ${product.caliber}`);
  return `<article class="product-card">
    <img class="product-image" src="${product.image || fallbackImage}" alt="Фото товара ${product.name}" loading="lazy">
    <div class="product-body">
      <div class="product-tag">${hot ? '★ Популярное · ' : ''}${product.category}</div>
      <h3 class="product-title">${product.name}</h3>
      ${product.code ? `<div class="product-code">Арт. ${product.code}</div>` : ''}
      <div class="product-specs">${specs.map(spec => `<span class="spec-pill">${spec}</span>`).join('') || '<span>Характеристики уточняйте</span>'}</div>
      <div class="product-bottom"><span class="product-price">${money(product.price)}</span><button class="order-link contact-trigger" type="button" data-product-id="${product.id}">Заказать <span>↗</span></button></div>
    </div>
  </article>`;
}

function sortedProducts(products) {
  const hotIndex = new Map(state.hot.map((id, index) => [id, index]));
  return [...products].sort((a, b) => {
    if (state.sort === 'price-asc') return a.price - b.price;
    if (state.sort === 'price-desc') return b.price - a.price;
    if (state.sort === 'power-asc' || state.sort === 'power-desc') {
      const missing = Number(a.power == null) - Number(b.power == null);
      if (missing) return missing;
      const diff = (a.power ?? 0) - (b.power ?? 0);
      return state.sort === 'power-asc' ? diff : -diff;
    }
    const aHot = hotIndex.has(a.id), bHot = hotIndex.has(b.id);
    if (aHot && bHot) return hotIndex.get(a.id) - hotIndex.get(b.id);
    if (aHot !== bHot) return aHot ? -1 : 1;
    return a.name.localeCompare(b.name, 'ru');
  });
}

function renderCatalog() {
  const list = state.category === 'Все товары' ? state.products : state.products.filter(item => item.category === state.category);
  const sorted = sortedProducts(list);
  document.querySelector('#catalog-grid').innerHTML = sorted.length ? sorted.map(item => productCard(item, state.hot.includes(item.id))).join('') : '<div class="empty-state">В этой категории пока нет товаров.</div>';
  document.querySelector('#result-count').textContent = `Найдено товаров: ${list.length}`;
  document.querySelectorAll('.tab').forEach(button => button.classList.toggle('active', button.dataset.tab === state.category));
}

function renderHot() {
  const featured = state.hot.map(id => state.products.find(product => product.id === id)).filter(Boolean);
  document.querySelector('#hot-grid').innerHTML = featured.map(product => productCard(product, true)).join('');
}

function renderServices(rows) {
  const list = [];
  for (let i = 0; i < rows.length; i += 2) {
    const label = rows[i].replace(/^•\s*/, '');
    list.push(`<div class="service-row"><span>${label}</span><strong>${rows[i + 1] || 'Уточняйте'}</strong></div>`);
  }
  document.querySelector('#service-list').innerHTML = list.join('');
}

document.querySelectorAll('.tab').forEach(button => button.addEventListener('click', () => {
  state.category = button.dataset.tab;
  renderCatalog();
}));
document.querySelectorAll('[data-category]').forEach(link => link.addEventListener('click', () => {
  state.category = link.dataset.category;
  renderCatalog();
}));
document.querySelectorAll('[data-nav]').forEach(link => link.addEventListener('click', () => {
  state.category = link.dataset.nav;
  renderCatalog();
}));
document.querySelector('#sort').addEventListener('change', event => {
  state.sort = event.target.value;
  renderCatalog();
});
const menuToggle = document.querySelector('.menu-toggle');
menuToggle.addEventListener('click', () => {
  const open = document.querySelector('.main-nav').classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
});
document.querySelectorAll('.main-nav a').forEach(link => link.addEventListener('click', () => {
  document.querySelector('.main-nav').classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
}));

const contactDialog = document.querySelector('#contact-dialog');
const contactTitle = document.querySelector('#contact-title');
const contactContext = document.querySelector('#contact-context');
const whatsappContact = document.querySelector('#whatsapp-contact');
const copyFeedback = document.querySelector('#copy-feedback');
function openContactMenu(product = null) {
  contactTitle.innerHTML = product ? 'Заказать товар<span class="blue-dot">.</span>' : 'Выберите контакт<span class="blue-dot">.</span>';
  contactContext.textContent = product
    ? `${product.name}${product.code ? ` · арт. ${product.code}` : ''} — ${money(product.price)}. Выберите мессенджер для заказа.`
    : 'Напишите нам удобным способом — ответим на вопросы и подскажем по наличию.';
  const message = product
    ? `Здравствуйте! Хочу заказать товар: ${product.name}${product.code ? ` (${product.code})` : ''} — ${money(product.price)}.`
    : 'Здравствуйте! Подскажите, пожалуйста.';
  whatsappContact.href = `https://wa.me/639451103391?text=${encodeURIComponent(message)}`;
  copyFeedback.textContent = '';
  if (!contactDialog.open) contactDialog.showModal();
}

document.addEventListener('click', event => {
  const trigger = event.target.closest('.contact-trigger');
  if (!trigger) return;
  const product = trigger.dataset.productId
    ? state.products.find(item => item.id === trigger.dataset.productId)
    : null;
  openContactMenu(product);
});
document.querySelector('.dialog-close').addEventListener('click', () => contactDialog.close());
contactDialog.addEventListener('click', event => {
  if (event.target === contactDialog) contactDialog.close();
});
document.querySelector('.copy-contact').addEventListener('click', async event => {
  const number = event.currentTarget.dataset.copy;
  try {
    await navigator.clipboard.writeText(number);
    copyFeedback.textContent = 'Номер MAX скопирован';
  } catch {
    copyFeedback.textContent = `Номер MAX: ${number}`;
  }
});
document.querySelector('#year').textContent = new Date().getFullYear();

fetch('products.json').then(response => {
  if (!response.ok) throw new Error('Не удалось загрузить каталог');
  return response.json();
}).then(data => {
  state.products = data.products;
  state.hot = data.hot;
  renderHot();
  renderCatalog();
  renderServices(data.services);
  document.querySelector('#all-count').textContent = state.products.length;
}).catch(() => {
  document.querySelector('#hot-grid').innerHTML = '<div class="empty-state">Каталог временно недоступен. Напишите нам, и мы подскажем наличие.</div>';
  document.querySelector('#catalog-grid').innerHTML = '<div class="empty-state">Не удалось загрузить каталог. Обновите страницу или свяжитесь с нами.</div>';
});
