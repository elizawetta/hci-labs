import { initAnalytics, track } from './analytics.js';

const main = document.querySelector('#main');
const pageTitles = ['Поиск', 'Номера', 'Условия', 'Бронирование', 'Готово'];
const routes = ['search', 'results', 'room', 'booking', 'success'];
const money = value => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value);
const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const iso = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const today = iso(new Date());
const defaultStart = new Date();
defaultStart.setDate(defaultStart.getDate() + 25);
const defaultEnd = new Date(defaultStart);
defaultEnd.setDate(defaultEnd.getDate() + 3);
const bedOptions = {
  single: { id: 'single', label: '4 односпальные кровати', places: 4, features: [], description: 'Четыре односпальные кровати шириной 90 см.' },
  double: { id: 'double', label: '2 двуспальные кровати', places: 4, features: [], description: 'Две двуспальные кровати шириной 160 см.' },
  mixed: { id: 'mixed', label: '1 двуспальная + 2 односпальные кровати', places: 4, features: [], description: 'Двуспальная кровать шириной 160 см и две односпальные по 90 см.' },
  bunk: { id: 'bunk', label: '1 двуспальная + 1 двухъярусная кровать', places: 4, features: ['bunk'], description: 'Двуспальная кровать шириной 160 см и двухъярусная кровать с двумя местами по 90 см.' },
  sofa: { id: 'sofa', label: '1 двуспальная кровать + диван на 2 места', places: 4, features: ['sofa'], description: 'Двуспальная кровать шириной 160 см и раскладной диван шириной 140 см на два места.' },
  extra: { id: 'extra', label: '1 двуспальная + 1 односпальная кровать', places: 4, features: ['extra'], note: 'Дополнительно: раскладная кровать на 1 место', description: 'Двуспальная кровать шириной 160 см, односпальная шириной 90 см и дополнительная раскладная кровать шириной 80 см. Дополнительная кровать входит в бронирование и стоимость.' }
};
const rooms = [
  { id: 'garden', hotel: 'Тихий сад', name: 'Семейный номер', area: 32, rate: 7900, supplement: 0, image: 1, location: 'Спокойный район рядом с парком', meals: 'Без питания', breakfast: false, bedOptions: ['bunk'], cancel: true },
  { id: 'central', hotel: 'Центральный', name: 'Семейный комфорт', area: 38, rate: 9800, supplement: 400, image: 2, location: 'В центре города', meals: 'Завтрак для всех гостей включён', breakfast: true, bedOptions: ['double', 'mixed'], cancel: true },
  { id: 'river', hotel: 'У набережной', name: 'Семейный люкс', area: 46, rate: 13400, supplement: 0, image: 3, location: 'Рядом с набережной', meals: 'Завтрак для всех гостей включён', breakfast: true, bedOptions: ['sofa'], cancel: false },
  { id: 'park', hotel: 'Парковый', name: 'Номер с дополнительной кроватью', area: 30, rate: 7200, supplement: 0, image: 1, location: 'Рядом с городским садом', meals: 'Без питания', breakfast: false, bedOptions: ['extra'], cancel: true },
  { id: 'boulevard', hotel: 'Бульвар', name: 'Четырёхместный стандарт', area: 34, rate: 8400, supplement: 0, image: 2, location: 'На пешеходном бульваре', meals: 'Без питания', breakfast: false, bedOptions: ['single'], cancel: true },
  { id: 'panorama', hotel: 'Панорама', name: 'Семейный номер с видом на город', area: 42, rate: 11200, supplement: 0, image: 3, location: 'Рядом с центральной площадью', meals: 'Завтрак для всех гостей включён', breakfast: true, bedOptions: ['mixed', 'sofa'], cancel: true },
  { id: 'linden', hotel: 'Липовый двор', name: 'Семейный стандарт', area: 28, rate: 6100, supplement: 300, image: 1, location: 'В тихом жилом квартале', meals: 'Без питания', breakfast: false, bedOptions: ['bunk'], cancel: false },
  { id: 'avenue', hotel: 'Проспект', name: 'Четырёхместный комфорт', area: 36, rate: 9100, supplement: 0, image: 2, location: 'Рядом с остановкой транспорта', meals: 'Завтрак для всех гостей включён', breakfast: true, bedOptions: ['double', 'single'], cancel: false },
  { id: 'terrace', hotel: 'Терраса', name: 'Просторный семейный номер', area: 48, rate: 14900, supplement: 0, image: 3, location: 'Рядом с прогулочной зоной', meals: 'Завтрак для всех гостей включён', breakfast: true, bedOptions: ['mixed'], cancel: true },
  { id: 'sunrise', hotel: 'Рассвет', name: 'Номер с дополнительным местом', area: 29, rate: 6800, supplement: 0, image: 1, location: 'Недалеко от вокзала', meals: 'Завтрак для всех гостей включён', breakfast: true, bedOptions: ['extra'], cancel: false },
  { id: 'quarter', hotel: 'Старый квартал', name: 'Семейная студия', area: 40, rate: 8700, supplement: 200, image: 3, location: 'В историческом районе', meals: 'Без питания', breakfast: false, bedOptions: ['sofa', 'extra'], cancel: true },
  { id: 'lime', hotel: 'Лайм', name: 'Четырёхместный номер', area: 35, rate: 10200, supplement: 0, image: 2, location: 'Рядом с городским сквером', meals: 'Завтрак для всех гостей включён', breakfast: true, bedOptions: ['mixed', 'single'], cancel: true }
];
const emptyFilters = () => ({ noBunk: false, noSofa: false, noExtra: false, breakfast: false, cancellation: false });
const state = { search: { city: 'Казань', checkin: iso(defaultStart), checkout: iso(defaultEnd), adults: 2, children: 2, ages: [5, 9] }, searched: false, budget: '', filters: emptyFilters(), selected: null, selectedBeds: null, complete: false, draft: { name: '', email: '' } };
const matchingBeds = room => room.bedOptions.map(id => bedOptions[id]).filter(option =>
  (!state.filters.noBunk || !option.features.includes('bunk')) &&
  (!state.filters.noSofa || !option.features.includes('sofa')) &&
  (!state.filters.noExtra || !option.features.includes('extra'))
);
const selectedBed = room => matchingBeds(room).find(option => option.id === state.selectedBeds) || matchingBeds(room)[0];
const bedLabel = option => `${option.label}${option.note ? `. ${option.note}` : ''}`;
const bedCard = option => `<div class="bed-card"><p>${option.label}</p>${option.note ? `<p class="bed-extra">${option.note}</p>` : ''}<p class="muted">${option.places} места</p></div>`;
const nights = () => Math.round((Date.parse(state.search.checkout) - Date.parse(state.search.checkin)) / 86400000);
const childFee = room => room.supplement * state.search.children * nights();
const total = room => room.rate * nights() + childFee(room);
const dateText = value => new Date(value + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
const dates = () => `${dateText(state.search.checkin)} — ${dateText(state.search.checkout)}`;
const guests = () => `${state.search.adults} взр.${state.search.children ? `, детей: ${state.search.children} (возраст: ${state.search.ages.join(', ')})` : ''} · 1 номер`;
const selected = () => rooms.find(room => room.id === state.selected);
const options = (max, current, min = 0) => Array.from({ length: max - min + 1 }, (_, i) => `<option value="${i + min}" ${i + min === Number(current) ? 'selected' : ''}>${i + min}</option>`).join('');
const cancellationDeadline = () => {
  const date = new Date(state.search.checkin + 'T18:00:00');
  date.setDate(date.getDate() - 2);
  return date;
};
const freeCancellation = room => room.cancel && cancellationDeadline() > new Date();
const image = room => `../assets/booking/room-${room.image}.jpg`;
const back = (route, label) => `<a class="back" href="#${route}">← ${label}</a>`;
function showErrors(form, errors) {
  if (Object.keys(errors).length) track('form_error', { form: form.id, fields: Object.keys(errors).join(',') });
  form.querySelectorAll('[aria-invalid]').forEach(input => input.removeAttribute('aria-invalid'));
  form.querySelectorAll('.error').forEach(error => { error.textContent = ''; });
  for (const [name, message] of Object.entries(errors)) {
    form.querySelector(`[data-error="${name}"]`).textContent = message;
    const input = form.elements[name];
    if (input) input.setAttribute('aria-invalid', 'true');
  }
  const first = Object.keys(errors)[0];
  if (first && form.elements[first]) form.elements[first].focus();
  return !first;
}
function navigate(route) {
  if (location.hash === '#' + route) render();
  else location.hash = route;
}
function guestLabel(adults, children) {
  return `${adults} ${adults === 1 ? 'взрослый' : 'взрослых'}${children ? `, ${children} ${children === 1 ? 'ребёнок' : 'ребёнка'}` : ''}`;
}
function searchForm() {
  const s = state.search;
  const counter = (name, label, max, min) => `<div class="guest-row"><label for="${name}">${label}</label><div class="guest-counter"><button type="button" data-counter="${name}" data-delta="-1" aria-label="${name === 'adults' ? 'Меньше взрослых' : 'Меньше детей'}">−</button><select id="${name}" name="${name}">${options(max, s[name], min)}</select><button type="button" data-counter="${name}" data-delta="1" aria-label="${name === 'adults' ? 'Больше взрослых' : 'Больше детей'}">+</button></div></div>`;
  return `<form id="search-form" class="search-bar" aria-label="Параметры поиска" novalidate>
    <div class="search-cell destination"><label for="city">Куда</label><select id="city" name="city">${['Казань', 'Москва', 'Санкт-Петербург'].map(city => `<option ${s.city === city ? 'selected' : ''}>${city}</option>`).join('')}</select></div>
    <div class="search-cell"><label for="checkin">Заезд</label><input id="checkin" name="checkin" type="date" min="${today}" value="${s.checkin}" required aria-describedby="checkin-error"><p id="checkin-error" class="error" data-error="checkin"></p></div>
    <div class="search-cell"><label for="checkout">Выезд</label><input id="checkout" name="checkout" type="date" min="${today}" value="${s.checkout}" required aria-describedby="checkout-error"><p id="checkout-error" class="error" data-error="checkout"></p></div>
    <details class="guest-picker" id="guest-picker"><summary><span class="guest-caption">Гости · 1 номер</span><span id="guest-summary">${guestLabel(s.adults, s.children)}</span><span class="guest-arrow" aria-hidden="true">⌄</span></summary><div class="guest-panel">
      ${counter('adults', 'Взрослые', 4, 1)}${counter('children', 'Дети до 18 лет', 3, 0)}<div id="ages" class="ages"></div><button type="button" class="primary wide" id="guests-done">Готово</button>
    </div></details>
    <button class="primary search-submit" type="submit">Найти</button>
  </form>`;
}
function searchScreen() {
  main.innerHTML = `<h1>Поиск</h1><p class="lead">Выберите даты и гостей. Найдите один номер, где всем хватит места.</p>${searchForm()}<p class="hint">Один номер для всех гостей. Цены — за всю поездку.</p>`;
  bindSearch();
}
function bindSearch() {
  const ages = [...state.search.ages];
  const form = document.querySelector('#search-form');
  const drawAges = () => {
    document.querySelector('#ages').innerHTML = Array.from({ length: Number(form.elements.children.value) }, (_, i) => `<div class="field"><label for="age-${i}">Возраст ребёнка ${i + 1}</label><select name="age-${i}" id="age-${i}">${options(17, ages[i] ?? 5)}</select></div>`).join('');
  };
  const updateGuests = () => {
    document.querySelector('#guest-summary').textContent = guestLabel(Number(form.elements.adults.value), Number(form.elements.children.value));
    form.querySelectorAll('[data-counter]').forEach(button => {
      const input = form.elements[button.dataset.counter];
      button.disabled = Number(button.dataset.delta) < 0 ? input.selectedIndex === 0 : input.selectedIndex === input.options.length - 1;
    });
  };
  drawAges();
  updateGuests();
  form.elements.adults.addEventListener('change', updateGuests);
  form.querySelectorAll('[data-counter]').forEach(button => button.addEventListener('click', () => {
    const input = form.elements[button.dataset.counter];
    input.selectedIndex += Number(button.dataset.delta);
    input.dispatchEvent(new Event('change'));
  }));
  document.querySelector('#guests-done').addEventListener('click', () => {
    document.querySelector('#guest-picker').open = false;
    document.querySelector('#guest-picker summary').focus();
  });
  form.elements.children.addEventListener('change', () => {
    document.querySelectorAll('#ages select').forEach((input, i) => { ages[i] = Number(input.value); });
    drawAges();
    updateGuests();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const errors = {};
    const checkin = data.get('checkin');
    const checkout = data.get('checkout');
    if (!checkin || !Number.isFinite(Date.parse(checkin))) errors.checkin = 'Укажите дату заезда.';
    else if (checkin < today) errors.checkin = 'Дата заезда не может быть в прошлом.';
    if (!checkout || !Number.isFinite(Date.parse(checkout))) errors.checkout = 'Укажите дату выезда.';
    else if (checkout <= checkin) errors.checkout = 'Выезд должен быть позже заезда.';
    else if ((Date.parse(checkout) - Date.parse(checkin)) / 86400000 > 30) errors.checkout = 'Выберите поездку не дольше 30 ночей.';
    if (!showErrors(form, errors)) return;
    state.search = { city: data.get('city'), checkin, checkout, adults: Number(data.get('adults')), children: Number(data.get('children')), ages: Array.from({ length: Number(data.get('children')) }, (_, i) => Number(data.get(`age-${i}`))) };
    state.searched = true;
    state.selected = null;
    state.selectedBeds = null;
    state.complete = false;
    track('search_started', { night_count: nights(), guest_count: state.search.adults + state.search.children });
    navigate('results');
  });
}
function resultsScreen() {
  main.innerHTML = `<h1>${esc(state.search.city)}: номера для семьи</h1>${searchForm()}
  <div class="layout"><form id="filter-form" class="panel filter" novalidate><h2>Фильтры</h2><div class="field"><label for="budget">Бюджет на всю поездку, ₽</label><input id="budget" name="budget" inputmode="numeric" type="number" min="0" step="1" placeholder="Например, 36000" value="${esc(state.budget)}" aria-describedby="budget-help budget-error"><p class="hint" id="budget-help">За ${nights()} ноч. и всех гостей</p><p class="error" id="budget-error" data-error="budget"></p></div><fieldset class="filter-options"><legend>Спальные места</legend><label class="check-label"><input type="checkbox" name="noBunk" ${state.filters.noBunk ? 'checked' : ''}>Без двухъярусных кроватей</label><label class="check-label"><input type="checkbox" name="noSofa" ${state.filters.noSofa ? 'checked' : ''}>Без диванов</label><label class="check-label"><input type="checkbox" name="noExtra" ${state.filters.noExtra ? 'checked' : ''}>Без дополнительных кроватей</label></fieldset><fieldset class="filter-options"><legend>Условия проживания</legend><label class="check-label"><input type="checkbox" name="breakfast" ${state.filters.breakfast ? 'checked' : ''}>Завтрак включён</label><label class="check-label"><input type="checkbox" name="cancellation" ${state.filters.cancellation ? 'checked' : ''}>Бесплатная отмена</label></fieldset><button class="primary" type="submit">Применить</button><button class="text-button" type="button" id="reset-budget">Сбросить фильтры</button></form><div><p class="result-count" id="result-count" role="status"></p><div class="cards" id="cards"></div></div></div>`;
  bindSearch();
  const draw = () => {
    const capacity = state.search.adults + state.search.children <= 4;
    const available = capacity ? rooms.filter(room =>
      (state.budget === '' || total(room) <= Number(state.budget)) &&
      matchingBeds(room).length > 0 &&
      (!state.filters.breakfast || room.breakfast) &&
      (!state.filters.cancellation || freeCancellation(room))
    ) : [];
    document.querySelector('#result-count').textContent = `Найдено вариантов: ${available.length} · один номер для всех гостей`;
    document.querySelector('#cards').innerHTML = available.length ? available.map(room => `<article class="room-card"><img src="${image(room)}" alt="Пример интерьера семейного номера" width="420" height="320"><div class="room-info"><h2>${room.hotel}</h2><p class="location">${room.location}</p><span class="badge">До 4 гостей · ${room.area} м²</span><h3>${room.name}</h3><div class="card-beds">${matchingBeds(room).length > 1 ? '<p class="bed-choice-label">Кровати на выбор:</p>' : ''}${matchingBeds(room).map(bedCard).join('')}</div><p>${room.meals}</p><p>${freeCancellation(room) ? 'Бесплатная отмена за 2 дня до заезда' : room.cancel ? 'При отмене удерживается стоимость первой ночи' : 'Тариф без возврата'}</p><div class="price-row"><div class="price">${money(total(room))}<span class="price-note">За ${nights()} ноч. · все доплаты включены</span></div><button class="primary choose" data-room="${room.id}">Выбрать номер<span class="sr-only"> — ${room.hotel}</span></button></div></div></article>`).join('') : `<div class="panel empty"><h2>Подходящего номера для всех гостей нет</h2><p>${capacity ? 'Попробуйте изменить фильтры или сбросить ограничения поиска.' : 'Номера в каталоге рассчитаны максимум на 4 гостей. Для указанного количества гостей одного номера недостаточно.'}</p><p class="two-rooms-note">Если раздельное размещение подходит вашей семье, можно рассмотреть два отдельных номера.</p>${capacity ? '<button class="secondary" id="empty-reset">Сбросить фильтры</button>' : '<button class="secondary" id="edit-guests">Проверить состав гостей</button>'}</div>`;
    document.querySelectorAll('.choose').forEach(button => button.addEventListener('click', () => { const sameRoom = state.selected === button.dataset.room; state.selected = button.dataset.room; if (!sameRoom || !matchingBeds(selected()).some(option => option.id === state.selectedBeds)) state.selectedBeds = matchingBeds(selected())[0].id; state.complete = false; navigate('room'); }));
    document.querySelector('#empty-reset')?.addEventListener('click', reset);
    document.querySelector('#edit-guests')?.addEventListener('click', () => { document.querySelector('#guest-picker').open = true; document.querySelector('#adults').focus(); });
  };
  const reset = () => {
    state.budget = '';
    state.filters = emptyFilters();
    const form = document.querySelector('#filter-form');
    form.elements.budget.value = '';
    for (const key of Object.keys(state.filters)) form.elements[key].checked = false;
    showErrors(form, {});
    track('filters_applied', { ...state.filters, budget_limit: -1 });
    draw();
  };
  document.querySelector('#reset-budget').addEventListener('click', reset);
  document.querySelector('#filter-form').addEventListener('submit', event => {
    event.preventDefault();
    const input = document.querySelector('#budget');
    if (!showErrors(event.target, input.validity.badInput || (input.value !== '' && (!Number.isFinite(Number(input.value)) || Number(input.value) < 0 || !Number.isInteger(Number(input.value)))) ? { budget: 'Укажите целую сумму от 0 ₽.' } : {})) return;
    state.budget = input.value;
    state.filters = Object.fromEntries(Object.keys(emptyFilters()).map(key => [key, event.target.elements[key].checked]));
    track('filters_applied', { ...state.filters, budget_limit: state.budget === '' ? -1 : Number(state.budget) });
    draw();
  });
  draw();
  track('results_viewed', { result_count: document.querySelectorAll('.room-card').length });
}
function priceLines(room) {
  return `<div class="cost-line"><span>${money(room.rate)} × ${nights()} ноч.</span><span>${money(room.rate * nights())}</span></div><div class="cost-line"><span>Размещение детей${room.supplement ? ` (${money(room.supplement)} / ребёнок / ночь)` : ''}</span><span>${money(childFee(room))}</span></div><div class="cost-line total"><span>Итого</span><span class="price">${money(total(room))}</span></div><p class="hint">За весь период и всех гостей. Налоги включены, других доплат нет.</p>`;
}
function summary(room, action = false) {
  return `<aside class="panel summary" aria-label="Условия поездки"><h2>${room.hotel}</h2><p>${room.name}</p><dl><dt>Даты</dt><dd>${dates()}</dd><dt>Гости</dt><dd>${guests()}</dd><dt>Спальные места</dt><dd id="summary-beds">${bedLabel(selectedBed(room))} · ${selectedBed(room).places} места</dd></dl>${priceLines(room)}${action ? '<a class="primary" id="confirm-beds" href="#booking">Перейти к бронированию</a>' : ''}</aside>`;
}
function roomScreen() {
  const room = selected();
  track('room_viewed', { room_id: room.id });
  const deadline = cancellationDeadline();
  const availableBeds = matchingBeds(room);
  const bedSelection = `<section class="panel bed-selection"><h2>Спальные места</h2>${availableBeds.length > 1 ? `<fieldset class="bed-variants"><legend>Выберите вариант кроватей</legend>${availableBeds.map(option => `<label class="bed-variant"><input type="radio" name="bed-variant" value="${option.id}" ${option.id === selectedBed(room).id ? 'checked' : ''}><span><span>${option.label}</span>${option.note ? `<span class="bed-extra">${option.note}</span>` : ''}<small>${option.places} места · цена не меняется</small></span></label>`).join('')}</fieldset>` : bedCard(availableBeds[0])}<p class="hint" id="bed-description">${selectedBed(room).description}</p></section>`;
  main.innerHTML = `${back('results', 'К результатам')}<h1>${room.hotel} · ${room.name.toLowerCase()}</h1><p class="lead">${esc(state.search.city)} · ${room.location}</p><div class="detail-layout"><div>${bedSelection}<img class="hero-photo" src="${image(room)}" alt="Иллюстрация интерьера номера" width="1200" height="675"><p class="photo-note">Иллюстрация для учебного сервиса</p><div class="panel"><h2>Условия проживания</h2><ul class="details-list"><li><strong>Вся семья в одном номере</strong>${room.area} м², до 4 гостей. Собственная ванная комната, Wi-Fi и кондиционер.</li><li><strong>Размещение детей</strong>${room.supplement ? `Доплата за каждого ребёнка — ${money(room.supplement)} за ночь, уже учтена в итоговой цене.` : 'Доплата за детей не требуется.'}</li><li><strong>Питание</strong>${room.meals}.</li><li><strong>Отмена бронирования</strong>${freeCancellation(room) ? `Бесплатно до 18:00 ${dateText(iso(deadline))} по местному времени отеля. Позже — стоимость первой ночи, ${money(room.rate + room.supplement * state.search.children)}.` : room.cancel ? `Срок бесплатной отмены уже прошёл. При отмене удерживается стоимость первой ночи, ${money(room.rate + room.supplement * state.search.children)}.` : 'При отмене стоимость проживания не возвращается.'}</li><li><strong>Заезд и выезд</strong>Заезд с 14:00, выезд до 12:00.</li></ul></div></div>${summary(room, true)}</div>`;
  document.querySelector('#confirm-beds').addEventListener('click', () => track('beds_confirmed', { room_id: room.id, bed_variant: selectedBed(room).id }));
  document.querySelectorAll('input[name="bed-variant"]').forEach(input => input.addEventListener('change', () => {
    state.selectedBeds = input.value;
    state.complete = false;
    document.querySelector('#summary-beds').textContent = `${bedLabel(selectedBed(room))} · ${selectedBed(room).places} места`;
    document.querySelector('#bed-description').textContent = selectedBed(room).description;
  }));
}
function bookingScreen() {
  const room = selected();
  track('booking_started', { room_id: room.id, bed_variant: selectedBed(room).id });
  main.innerHTML = `${back('room', 'К условиям номера')}<h1>Бронирование номера</h1><p class="lead">Проверьте поездку и заполните контактные данные.</p><div class="detail-layout"><form id="booking-form" class="panel booking-form" novalidate><h2>Данные гостя</h2><p class="muted">Это учебная форма. Можно использовать вымышленные данные, например Анна и anna@example.com. Данные никуда не отправляются.</p><div class="field"><label for="name">Имя гостя</label><input id="name" name="name" autocomplete="given-name" maxlength="80" value="${esc(state.draft.name)}" aria-describedby="name-error" required><p id="name-error" data-error="name" class="error"></p></div><div class="field"><label for="email">Электронная почта</label><input id="email" name="email" type="email" autocomplete="email" maxlength="160" value="${esc(state.draft.email)}" placeholder="anna@example.com" aria-describedby="email-help email-error" required><p class="hint" id="email-help">Учебное подтверждение появится на следующем экране. Письмо не отправляется.</p><p id="email-error" data-error="email" class="error"></p></div><button class="primary" type="submit">Оформить бронирование</button><p class="hint" style="margin-top:12px">Без оплаты. Настоящая бронь в отеле не создаётся.</p></form>${summary(room)}</div>`;
  const form = document.querySelector('#booking-form');
  form.addEventListener('input', () => { state.draft.name = form.elements.name.value; state.draft.email = form.elements.email.value; });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const errors = {};
    if (form.elements.name.value.trim().length < 2) errors.name = 'Введите имя, минимум 2 символа.';
    if (!form.elements.email.value.trim()) errors.email = 'Укажите электронную почту.';
    else if (!form.elements.email.validity.valid || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.elements.email.value.trim())) errors.email = 'Проверьте адрес: например, anna@example.com.';
    if (!showErrors(form, errors)) return;
    state.draft.name = form.elements.name.value.trim();
    state.complete = true;
    navigate('success');
  });
}
function successScreen() {
  const room = selected();
  main.innerHTML = `<div class="success"><div class="success-mark" aria-hidden="true">✓</div><h1>Учебное бронирование оформлено</h1><section class="panel receipt"><h2>${room.hotel}</h2><p>${esc(state.search.city)} · ${room.name}</p><dl><div><dt>Заезд</dt><dd>${dateText(state.search.checkin)}, с 14:00</dd></div><div><dt>Выезд</dt><dd>${dateText(state.search.checkout)}, до 12:00</dd></div><div><dt>Гости</dt><dd>${guests()}</dd></div><div><dt>Спальные места</dt><dd>${bedLabel(selectedBed(room))} · ${selectedBed(room).places} места</dd></div></dl>${priceLines(room)}</section><button class="secondary" id="new-search">Найти другой номер</button></div>`;
  const taskMatch = state.search.adults === 2 && state.search.children === 2 && ['mixed', 'single'].includes(selectedBed(room).id);
  track('booking_completed', { room_id: room.id, bed_variant: selectedBed(room).id, total_price: total(room), task_match: taskMatch }, true);
  document.querySelector('#new-search').addEventListener('click', () => { state.complete = false; state.selected = null; state.selectedBeds = null; state.searched = false; state.budget = ''; state.filters = emptyFilters(); state.draft = { name: '', email: '' }; navigate('search'); });
}
function render() {
  let route = location.hash.slice(1) || 'search';
  if (!routes.includes(route) || (!state.searched && route !== 'search')) route = 'search';
  if (['room', 'booking', 'success'].includes(route) && !selected()) route = 'results';
  if (route === 'success' && !state.complete) route = 'booking';
  if (location.hash !== '#' + route) history.replaceState(null, '', '#' + route);
  const index = routes.indexOf(route);
  ({ search: searchScreen, results: resultsScreen, room: roomScreen, booking: bookingScreen, success: successScreen })[route]();
  document.title = `${pageTitles[index]} — Поездка`;
  main.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}
document.querySelector('.skip').addEventListener('click', event => {
  event.preventDefault();
  main.focus();
});
document.addEventListener('click', event => {
  const picker = document.querySelector('#guest-picker');
  if (picker && !picker.contains(event.target) && !event.target.closest('#edit-guests')) picker.open = false;
});
document.addEventListener('keydown', event => {
  const picker = document.querySelector('#guest-picker');
  if (event.key === 'Escape' && picker?.open) {
    picker.open = false;
    picker.querySelector('summary').focus();
  }
});
initAnalytics();
track('interface_opened', {}, true);
window.addEventListener('hashchange', render);
render();
