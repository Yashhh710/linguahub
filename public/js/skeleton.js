// Skeleton loaders: lightweight placeholders shaped like each page, shown while data loads.
// Usage in a view:  view.innerHTML = skeletonFor('lessons');
// Styles live in css/components.css (.sk, .sk-*).

const repeat = (count, make) => Array.from({ length: count }, (_, i) => make(i)).join('');

/** A single shimmering block. w/h accept any CSS size; extra is optional inline CSS. */
const block = (w = '100%', h = '14px', extra = '') =>
  `<span class="sk" style="width:${w};height:${h};${extra}"></span>`;
const line = (w = '100%', h = '12px') => block(w, h, 'border-radius:6px');
const circle = size => block(size, size, 'border-radius:50%;flex:none');
const pill = (w = '72px') => block(w, '30px', 'border-radius:999px;flex:none');
const heading = (w = '160px') => `<div class="sk-heading">${block(w, '20px', 'border-radius:6px')}</div>`;

const wrap = (html, extraClass = '') =>
  `<div class="sk-page ${extraClass}" aria-busy="true" aria-live="polite"><span class="visually-hidden">Loading…</span>${html}</div>`;

const card = (inner, extra = '') => `<div class="card sk-card" style="${extra}">${inner}</div>`;

const PAGES = {
  dashboard: () => wrap(`
    ${block('100%', '248px', 'border-radius:16px')}
    <div class="sk-dash">
      <div class="sk-col">
        <div class="sk-row sk-row-2">${repeat(2, () => card(`<div class="sk-inline">${block('40px', '40px', 'border-radius:12px;flex:none')}<div class="sk-stack">${line('50%', '18px')}${line('70%')}</div></div>`))}</div>
        <div>
          ${heading('170px')}
          ${card(`<div class="sk-inline sk-wrapable">${block('220px', '150px', 'border-radius:12px;flex:none;max-width:100%')}<div class="sk-stack" style="flex:1;min-width:200px">${line('30%')}${line('70%', '20px')}${line('95%')}${line('85%')}${line('100%', '9px')}</div></div>`)}
        </div>
        <div>
          ${heading('150px')}
          <div class="sk-row sk-row-4">${repeat(4, () => card(`<div class="sk-stack" style="align-items:center">${circle('38px')}${line('60%')}${line('80%', '10px')}</div>`))}</div>
        </div>
        <div>
          ${heading('150px')}
          <div class="sk-row sk-row-4">${repeat(4, () => block('100%', '120px', 'border-radius:14px'))}</div>
        </div>
        <div>
          ${heading('110px')}
          ${card(`<div class="sk-bars">${repeat(7, i => block('100%', `${40 + ((i * 37) % 60)}%`, 'border-radius:6px 6px 0 0'))}</div>`)}
        </div>
      </div>
      <div class="sk-col">
        <div>${heading('110px')}${card(`<div class="sk-inline">${circle('84px')}<div class="sk-stack" style="flex:1">${line('70%', '16px')}${line('90%')}</div></div><div class="sk-row sk-row-7" style="margin-top:16px">${repeat(7, () => circle('100%'))}</div>`)}</div>
        <div>${heading('160px')}${card(repeat(5, () => `<div class="sk-inline sk-list-row">${circle('30px')}<div class="sk-stack" style="flex:1">${line('55%')}</div>${line('36px')}</div>`))}</div>
        <div>${heading('120px')}${card(`<div class="sk-stack">${line('70%', '16px')}${line('100%')}${line('60%')}${block('100%', '38px', 'border-radius:10px')}</div>`)}</div>
      </div>
    </div>`),

  lessons: () => wrap(`
    <div class="sk-toolbar">${block('min(360px,100%)', '42px', 'border-radius:10px')}<div class="sk-inline sk-wrapable">${repeat(5, () => pill('84px'))}</div></div>
    <div class="sk-grid">${repeat(6, () => card(`${block('100%', '130px', 'border-radius:12px')}<div class="sk-stack" style="margin-top:14px">${line('35%')}${line('80%', '18px')}${line('95%')}${line('60%')}</div>`, 'padding:14px'))}</div>`),

  lessonDetail: () => wrap(`
    ${line('140px', '14px')}
    <div style="height:14px"></div>
    ${card(`<div class="sk-inline sk-wrapable">${block('280px', '200px', 'border-radius:14px;flex:none;max-width:100%')}<div class="sk-stack" style="flex:1;min-width:220px">
      <div class="sk-inline">${pill('44px')}${pill('90px')}</div>${line('65%', '26px')}${line('95%')}${line('80%')}<div class="sk-inline">${line('70px')}${line('90px')}${line('70px')}</div>${pill('130px')}</div></div>`)}
    <div class="sk-row sk-row-2" style="margin-top:18px">
      ${card(`${line('120px', '18px')}<div class="sk-stack" style="margin-top:14px">${repeat(4, () => `<div class="sk-inline sk-list-row">${line('40%')}${line('30%')}</div>`)}</div>`)}
      ${card(`${line('100px', '18px')}<div class="sk-stack" style="margin-top:14px">${line('100%')}${line('92%')}${line('85%')}${line('60%')}</div>`)}
    </div>`),

  quizzes: () => wrap(`
    ${card(`<div class="sk-inline sk-wrapable"><div class="sk-stack" style="flex:1;min-width:220px">${line('30%')}${line('55%', '24px')}${line('85%')}${pill('140px')}</div>${block('180px', '120px', 'border-radius:14px;max-width:100%')}</div>`, 'margin-bottom:20px')}
    <div class="sk-toolbar">${block('min(320px,100%)', '42px', 'border-radius:10px')}<div class="sk-inline sk-wrapable">${repeat(4, () => pill('96px'))}</div></div>
    <div class="sk-grid">${repeat(6, () => card(`<div class="sk-stack">${line('30%')}${line('75%', '18px')}${line('90%')}${line('50%')}<div class="sk-inline" style="justify-content:space-between;margin-top:6px">${line('60px')}${pill('80px')}</div></div>`))}</div>`),

  quizTake: () => wrap(`
    ${line('130px', '14px')}
    <div style="height:14px"></div>
    ${line('50%', '26px')}
    <div style="height:10px"></div>
    ${line('35%')}
    <div class="sk-stack" style="margin-top:22px;gap:16px">
      ${repeat(3, () => card(`${line('70%', '16px')}<div class="sk-stack" style="margin-top:14px;gap:8px">${repeat(4, () => block('100%', '42px', 'border-radius:10px'))}</div>`))}
    </div>`),

  progress: () => wrap(`
    ${card(`<div class="sk-inline sk-wrapable"><div class="sk-stack" style="flex:1;min-width:220px">${line('25%')}${line('55%', '26px')}${line('85%')}${line('100%', '10px')}</div>${circle('120px')}</div>`)}
    <div class="sk-inline sk-wrapable" style="margin:22px 0 16px">${repeat(4, () => line('110px', '16px'))}</div>
    <div class="sk-row sk-row-4">${repeat(4, () => card(`<div class="sk-inline">${block('40px', '40px', 'border-radius:12px;flex:none')}<div class="sk-stack" style="flex:1">${line('50%', '18px')}${line('75%')}</div></div>`))}</div>
    <div class="sk-row sk-row-2" style="margin-top:18px">
      ${card(`${line('120px', '18px')}<div class="sk-bars" style="margin-top:16px">${repeat(7, i => block('100%', `${35 + ((i * 29) % 65)}%`, 'border-radius:6px 6px 0 0'))}</div>`)}
      ${card(`${line('140px', '18px')}<div class="sk-stack" style="margin-top:16px">${repeat(4, () => `<div class="sk-stack" style="gap:6px">${line('45%')}${line('100%', '9px')}</div>`)}</div>`)}
    </div>`),

  friends: () => wrap(`
    <div class="sk-row sk-row-2" style="align-items:start">
      <div class="sk-stack" style="gap:18px">
        ${card(`<div class="sk-inline">${block('100%', '42px', 'border-radius:10px')}${pill('90px')}</div>`)}
        ${card(repeat(5, () => `<div class="sk-inline sk-list-row">${circle('40px')}<div class="sk-stack" style="flex:1">${line('45%', '14px')}${line('30%', '10px')}</div>${pill('70px')}</div>`))}
      </div>
      ${card(`<div class="sk-inline" style="justify-content:space-between">${line('150px', '18px')}<div class="sk-inline">${pill('64px')}${pill('64px')}</div></div>
        <div style="margin-top:12px">${repeat(6, () => `<div class="sk-inline sk-list-row">${circle('28px')}${circle('34px')}<div class="sk-stack" style="flex:1">${line('50%')}</div>${line('44px')}</div>`)}</div>`)}
    </div>`),

  achievements: () => wrap(`
    <div class="sk-row sk-row-4">${repeat(4, () => card(`<div class="sk-inline">${block('40px', '40px', 'border-radius:12px;flex:none')}<div class="sk-stack" style="flex:1">${line('45%', '18px')}${line('70%')}</div></div>`))}</div>
    <div class="sk-toolbar" style="margin-top:22px"><div class="sk-inline sk-wrapable">${repeat(6, () => pill('88px'))}</div>${block('min(240px,100%)', '40px', 'border-radius:10px')}</div>
    <div class="sk-grid">${repeat(6, () => card(`<div class="sk-inline">${circle('56px')}<div class="sk-stack" style="flex:1">${line('60%', '16px')}${line('90%')}${line('100%', '8px')}</div></div>`))}</div>`),

  profile: () => wrap(`
    <div class="sk-row sk-row-2" style="align-items:start">
      <div class="sk-stack" style="gap:18px">
        ${card(`<div class="sk-inline">${circle('64px')}<div class="sk-stack" style="flex:1">${line('50%', '20px')}${line('35%')}</div></div>
          <div class="sk-inline sk-wrapable" style="margin-top:18px">${repeat(5, () => circle('48px'))}</div>`)}
        ${card(`${line('140px', '18px')}<div class="sk-stack" style="margin-top:16px;gap:14px">${repeat(3, () => `<div class="sk-stack" style="gap:6px">${line('25%', '11px')}${block('100%', '42px', 'border-radius:8px')}</div>`)}</div>`)}
      </div>
      <div class="sk-stack" style="gap:18px">
        ${card(`${line('150px', '18px')}<div class="sk-stack" style="margin-top:16px;gap:14px">${repeat(3, () => `<div class="sk-stack" style="gap:6px">${line('30%', '11px')}${block('100%', '42px', 'border-radius:8px')}</div>`)}${pill('130px')}</div>`)}
        ${card(`${line('120px', '18px')}<div class="sk-stack" style="margin-top:14px">${line('100%')}${line('70%')}</div>`)}
      </div>
    </div>`),

  admin: () => wrap(`
    <div class="sk-row sk-row-4">${repeat(4, () => card(`<div class="sk-stack">${line('40%', '24px')}${line('60%', '11px')}</div>`))}</div>
    <div class="sk-heading" style="margin-top:26px">${block('90px', '20px', 'border-radius:6px')}</div>
    ${card(repeat(6, () => `<div class="sk-inline sk-list-row"><div class="sk-stack" style="flex:1">${line('30%', '14px')}${line('45%', '10px')}</div>${block('100px', '34px', 'border-radius:8px')}</div>`))}`),

  generic: () => wrap(`${card(`<div class="sk-stack">${line('40%', '22px')}${line('100%')}${line('90%')}${line('70%')}</div>`)}`)
};

export function skeletonFor(name) {
  return (PAGES[name] || PAGES.generic)();
}

/**
 * Show the skeleton only if the page is STILL loading after `delay` ms.
 * - Data arrives fast  -> the skeleton never appears (no flash).
 * - Data is slow       -> the skeleton appears, then the view replaces it with real content.
 * The timer only writes into a view that is still empty, so it can never overwrite a page
 * (or an error message) that has already rendered.
 */
export function showSkeleton(view, name, delay = 150) {
  setTimeout(() => {
    if (view.isConnected && view.innerHTML.trim() === '') view.innerHTML = skeletonFor(name);
  }, delay);
}
