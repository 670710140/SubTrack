(() => {
  const STORAGE_KEY = 'subwise.subscriptions.v1';
  const seed = [
    {id:'netflix',name:'Netflix Standard',price:169,cycle:'monthly',date:'2026-11-12',payment:'TrueMoney Wallet',note:'หารกลุ่มบ้านเพื่อน (4 คน)'},
    {id:'youtube',name:'YouTube Premium',price:75,cycle:'monthly',date:'2026-11-15',payment:'KBank เดบิต ••4021',note:'Family Plan'},
    {id:'spotify',name:'Spotify',price:65,cycle:'monthly',date:'2026-11-12',payment:'KBank Student',note:'Student 50%'},
    {id:'icloud',name:'iCloud+ 50GB',price:35,cycle:'monthly',date:'2026-11-15',payment:'Apple ID / TrueMoney',note:'สำรองข้อมูล'},
    {id:'chatgpt',name:'ChatGPT Plus',price:690,cycle:'monthly',date:'2026-11-18',payment:'บัตรเดบิต KBank',note:'ไม่ได้เปิดใช้นาน 12 วัน'},
    {id:'canva',name:'Canva Pro',price:119,cycle:'monthly',date:'2026-11-24',payment:'หารกลุ่มภาควิชา',note:'Education Team'}
  ];
  let subscriptions;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    subscriptions = saved ? JSON.parse(saved) : seed;
    if (!Array.isArray(subscriptions)) subscriptions = seed;
  } catch (_) { subscriptions = seed; }
  const save = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions)); } catch (_) {} };
  try { if (!localStorage.getItem(STORAGE_KEY)) save(); } catch (_) {}

  const $ = (s, root=document) => root.querySelector(s);
  const money = n => '฿' + Number(n).toLocaleString('th-TH',{maximumFractionDigits:2});
  const fmt = d => new Date(d+'T00:00:00').toLocaleDateString('th-TH',{day:'numeric',month:'short'});
  const daysUntil = d => Math.ceil((new Date(d+'T00:00:00') - new Date(new Date().toDateString())) / 86400000);
  const toast = msg => {
    const el=$('#subwiseToast'); if(!el) return;
    el.textContent=msg; el.classList.remove('hidden');
    clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.add('hidden'),2300);
  };
  const modal = (id,open) => { const el=$('#'+id); if(!el)return; el.classList.toggle('hidden',!open); el.classList.toggle('flex',open); };
  const cycleLabel = c => ({monthly:'รายเดือน',yearly:'รายปี',weekly:'รายสัปดาห์'}[c]||'รายเดือน');
  const MONTHLY_BUDGET = 1500;

  const DEFAULT_APP_LOGOS = {
    netflix: { glyph: 'N', bg: 'bg-red-600', color: 'text-white' },
    youtube: { glyph: '▶', bg: 'bg-red-600', color: 'text-white' },
    spotify: { glyph: '♫', bg: 'bg-green-600', color: 'text-white' },
    icloud: { glyph: '☁', bg: 'bg-sky-500', color: 'text-white' },
    chatgpt: { glyph: '✳', bg: 'bg-[#10A37F]', color: 'text-white' },
    canva: { glyph: 'C', bg: 'bg-gradient-to-br from-cyan-500 to-blue-600', color: 'text-white' }
  };
  function appLogo(subscription, size='text-[24px]') {
    const key = String(subscription.id || '').toLowerCase();
    const name = String(subscription.name || '').toLowerCase();
    const entry = DEFAULT_APP_LOGOS[key] || Object.entries(DEFAULT_APP_LOGOS).find(([id]) => name.includes(id))?.[1];
    return `<span class="${size} font-bold">${entry ? entry.glyph : escapeHtml((subscription.name || '?').trim().charAt(0).toUpperCase())}</span>`;
  }
  function appLogoClasses(subscription) {
    const key = String(subscription.id || '').toLowerCase();
    const name = String(subscription.name || '').toLowerCase();
    const entry = DEFAULT_APP_LOGOS[key] || Object.entries(DEFAULT_APP_LOGOS).find(([id]) => name.includes(id))?.[1];
    return entry ? `${entry.bg} ${entry.color}` : 'bg-primary-fixed text-on-primary-fixed';
  }

  const monthlyEquivalent = s => {
    const price = Number(s.price) || 0;
    if (s.cycle === 'yearly') return price / 12;
    if (s.cycle === 'weekly') return price * 52 / 12;
    return price;
  };
  const dismissSection = (sectionId, storageKey) => {
    document.getElementById(sectionId)?.remove();
    try { localStorage.setItem(storageKey, '1'); } catch (_) {}
  };
  const render = () => {
    const list = $('#subscriptionList');
    if(list) {
      list.innerHTML = subscriptions.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(s => `
        <article class="w-full rounded-xl bg-surface-container-lowest p-space-md shadow-sm flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-11 h-11 rounded-xl ${appLogoClasses(s)} flex items-center justify-center shrink-0 shadow-sm">${appLogo(s)}</div>
            <div class="min-w-0"><h3 class="font-headline-sm text-headline-sm truncate">${escapeHtml(s.name)}</h3>
              <p class="font-body-sm text-on-surface-variant truncate">${fmt(s.date)} • ${escapeHtml(s.payment||cycleLabel(s.cycle))}</p>
              <span class="text-[11px] text-on-surface-variant">${cycleLabel(s.cycle)}</span>
            </div>
          </div>
          <div class="text-right shrink-0"><strong class="font-headline-sm">${money(s.price)}</strong><div class="text-[11px] text-on-surface-variant">/${s.cycle==='yearly'?'ปี':s.cycle==='weekly'?'สัปดาห์':'เดือน'}</div>
            <button data-delete="${s.id}" class="mt-1 text-error text-xs underline">ลบ</button>
          </div>
        </article>`).join('') || '<p class="text-center text-sm text-on-surface-variant py-5">ยังไม่มีสมาชิก กด “เพิ่มสมาชิกใหม่” เพื่อเริ่มต้น</p>';
    }
    const manage=$('#manageSubscriptionList');
    if(manage) manage.innerHTML = subscriptions.map(s=>`<div class="flex items-center justify-between gap-3 rounded-lg bg-surface-container-lowest p-3"><div class="min-w-0"><div class="font-semibold truncate">${escapeHtml(s.name)}</div><div class="text-xs text-on-surface-variant">${money(s.price)} • ${fmt(s.date)}</div></div><button data-delete="${s.id}" class="rounded-lg bg-error-container text-error px-3 py-2 text-xs font-semibold">ลบ</button></div>`).join('') || '<p class="text-sm text-on-surface-variant">ไม่มีรายการสมาชิก</p>';
    const count=subscriptions.length;
    const soon=subscriptions.filter(s=>daysUntil(s.date)>=0&&daysUntil(s.date)<=7).length;
    const yearly=subscriptions.filter(s=>s.cycle==='yearly').length;
    const pills=[...document.querySelectorAll('section button')];
    const allPill=pills.find(b=>b.textContent.includes('ทั้งหมด'));
    if(allPill){const span=allPill.querySelector('span:last-child');if(span)span.textContent=count;}
    const upcomingPill=pills.find(b=>b.textContent.includes('ตัดเงินเร็วๆ นี้'));
    if(upcomingPill){const span=upcomingPill.querySelector('span:last-child');if(span)span.textContent=soon;}
    const yearlyPill=pills.find(b=>b.textContent.includes('รายปี'));
    if(yearlyPill){const span=yearlyPill.querySelector('span:last-child');if(span)span.textContent=yearly;}
    // Monthly total is normalized to a monthly equivalent for every billing cycle.
    const monthlyTotal = subscriptions.reduce((sum, sub) => sum + monthlyEquivalent(sub), 0);
    const budgetPercent = MONTHLY_BUDGET > 0 ? monthlyTotal / MONTHLY_BUDGET * 100 : 0;
    const totalEl = $('#monthlyTotal');
    const countEl = $('#monthlyServiceCount');
    const budgetLabel = $('#monthlyBudgetLabel');
    const percentEl = $('#monthlyBudgetPercent');
    const barEl = $('#monthlyBudgetBar');
    if (totalEl) totalEl.textContent = money(monthlyTotal);
    if (countEl) countEl.textContent = count + ' บริการที่ใช้งาน';
    if (budgetLabel) budgetLabel.textContent = 'งบประมาณจำกัดต่อเดือน (' + money(MONTHLY_BUDGET) + ')';
    if (percentEl) percentEl.textContent = 'ใช้ไป ' + budgetPercent.toLocaleString('th-TH', {maximumFractionDigits:1}) + '%';
    if (barEl) barEl.style.width = Math.min(100, Math.max(0, budgetPercent)) + '%';
    renderCalendarEvents();
    renderUpcomingRenewals();
  };
  function renderSmartInsight() {
    const card = document.getElementById('smartInsightSection');
    if (!card) return;
    const target = subscriptions.find(s => String(s.id).toLowerCase() === 'chatgpt' || String(s.name).toLowerCase().includes('chatgpt'));
    if (!target) { card.classList.add('hidden'); return; }
    card.classList.remove('hidden');
    const monthly = monthlyEquivalent(target);
    const total = subscriptions.reduce((sum, sub) => sum + monthlyEquivalent(sub), 0);
    const percent = total > 0 ? Math.round(monthly / total * 100) : 0;
    const priceNodes = card.querySelectorAll('[data-smart-price]');
    priceNodes.forEach(node => node.textContent = money(monthly));
    const percentNode = card.querySelector('[data-smart-percent]');
    if (percentNode) percentNode.textContent = percent + '%';
    const appNode = card.querySelector('[data-smart-app]');
    if (appNode) appNode.textContent = target.name;
    const noteNode = card.querySelector('[data-smart-note]');
    if (noteNode) noteNode.textContent = target.note || 'ยังไม่มีบันทึกการใช้งานล่าสุด';
    const link = card.querySelector('[data-smart-cancel-link]');
    if (link) link.textContent = 'ดูวิธียกเลิก ' + target.name;
  }
  function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function nextRenewalDate(subscription, today) {
    if (!subscription.date) return null;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(subscription.date);
    if (!match) return null;
    const [, year, month, day] = match;
    const originalDay = Number(day);
    let date = new Date(Number(year), Number(month) - 1, originalDay);
    if (Number.isNaN(date.getTime())) return null;

    // Move recurring renewals forward until the next due date is today or later.
    let guard = 0;
    while (date < today && guard++ < 240) {
      if (subscription.cycle === 'weekly') {
        date.setDate(date.getDate() + 7);
      } else if (subscription.cycle === 'yearly') {
        const nextYear = date.getFullYear() + 1;
        date = new Date(nextYear, date.getMonth(), Math.min(originalDay, new Date(nextYear, date.getMonth() + 1, 0).getDate()));
      } else {
        const nextMonth = date.getMonth() + 1;
        const nextYear = date.getFullYear() + Math.floor(nextMonth / 12);
        const monthIndex = nextMonth % 12;
        date = new Date(nextYear, monthIndex, Math.min(originalDay, new Date(nextYear, monthIndex + 1, 0).getDate()));
      }
    }
    return date;
  }

  function renderUpcomingRenewals() {
    const target = $('#upcomingRenewalsList');
    if (!target) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inSevenDays = new Date(today);
    inSevenDays.setDate(inSevenDays.getDate() + 7);

    const upcoming = subscriptions.map(subscription => ({
      subscription,
      date: nextRenewalDate(subscription, today)
    })).filter(item => item.date && item.date >= today && item.date <= inSevenDays)
      .sort((a, b) => a.date - b.date);

    if (!upcoming.length) {
      target.innerHTML = '<div class="rounded-xl bg-surface-container-lowest p-space-md text-sm text-on-surface-variant">ไม่มีรายการเรียกเก็บเงินใน 7 วันข้างหน้า</div>';
      return;
    }

    target.innerHTML = upcoming.map(({ subscription: sub, date }) => {
      const days = Math.round((date - today) / 86400000);
      const countdown = days === 0 ? 'วันนี้' : days === 1 ? 'พรุ่งนี้' : `อีก ${days} วัน`;
      const badgeClass = days <= 2
        ? 'bg-error-container text-error'
        : 'bg-tertiary-fixed text-on-tertiary-fixed';
      const initial = appLogo(sub);
      const logoClasses = appLogoClasses(sub);
      const payment = escapeHtml(sub.payment || cycleLabel(sub.cycle));
      const note = sub.note ? escapeHtml(sub.note) : cycleLabel(sub.cycle);
      const dateLabel = date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
      return `
        <article class="w-full rounded-xl bg-surface-container-lowest p-space-md shadow-sm flex flex-col gap-space-sm">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-12 h-12 rounded-xl ${logoClasses} flex items-center justify-center shrink-0 font-bold shadow-sm">
                ${initial}
              </div>
              <div class="flex flex-col min-w-0">
                <h3 class="font-headline-sm text-headline-sm text-on-surface truncate">${escapeHtml(sub.name)}</h3>
                <span class="font-body-sm text-body-sm text-on-surface-variant truncate">${note}</span>
              </div>
            </div>
            <span class="shrink-0 px-2.5 py-1 rounded-full ${badgeClass} font-label-sm text-label-sm font-bold flex items-center gap-1 shadow-sm">
              <span class="material-symbols-outlined text-[14px]">${days <= 2 ? 'hourglass_bottom' : 'event'}</span>
              ${countdown}
            </span>
          </div>
          <div class="flex items-center justify-between gap-2 pt-1">
            <span class="min-w-0 px-2 py-0.5 rounded-lg bg-surface-container text-on-surface-variant font-label-sm text-label-sm truncate">${payment}</span>
            <div class="text-right shrink-0">
              <div class="font-headline-sm text-headline-sm font-bold text-on-surface">${money(sub.price)}</div>
              <div class="font-label-sm text-label-sm text-on-surface-variant">ครบกำหนด ${dateLabel}</div>
            </div>
          </div>
        </article>`;
    }).join('');
  }

  function renderCalendarEvents(){
    const target=$('#subscriptionCalendarEvents'); if(!target)return;
    const sorted=subscriptions.slice().sort((a,b)=>a.date.localeCompare(b.date));
    target.innerHTML=sorted.map(s=>`<div class="flex items-center justify-between gap-3 p-3 rounded-lg bg-surface-container-lowest"><div class="flex items-center gap-3 min-w-0"><div class="w-10 h-10 rounded-lg bg-primary-fixed text-on-primary-fixed flex items-center justify-center"><span class="material-symbols-outlined">event</span></div><div class="min-w-0"><div class="font-semibold truncate">${escapeHtml(s.name)}</div><div class="text-xs text-on-surface-variant">${fmt(s.date)} • ${cycleLabel(s.cycle)}</div></div></div><strong class="shrink-0">${money(s.price)}</strong></div>`).join('') || '<p class="text-sm text-on-surface-variant py-3">ยังไม่มีวันต่ออายุในปฏิทิน</p>';
  }
  const form=$('#subscriptionForm');
  $('#dismissUrgentAlert')?.addEventListener('click',()=>dismissSection('urgentAlertSection','subwise.dismissed.urgent.v1'));
  $('#dismissSmartInsight')?.addEventListener('click',()=>dismissSection('smartInsightSection','subwise.dismissed.insight.v1'));
  try {
    if (localStorage.getItem('subwise.dismissed.urgent.v1') === '1') $('#urgentAlertSection')?.remove();
    if (localStorage.getItem('subwise.dismissed.insight.v1') === '1') $('#smartInsightSection')?.remove();
  } catch (_) {}
  $('#addSubscriptionBtn')?.addEventListener('click',()=>{form.reset();modal('subscriptionModal',true);});
  $('#closeSubscriptionModal')?.addEventListener('click',()=>modal('subscriptionModal',false));
  $('#manageSubscriptionsBtn')?.addEventListener('click',()=>modal('manageModal',true));
  $('#closeManageModal')?.addEventListener('click',()=>modal('manageModal',false));
  [$('#subscriptionModal'),$('#manageModal')].forEach(el=>el?.addEventListener('click',e=>{if(e.target===el)modal(el.id,false);}));
  form?.addEventListener('submit',e=>{
    e.preventDefault(); const fd=new FormData(form);
    subscriptions.push({id:'sub_'+Date.now(),name:fd.get('name').trim(),price:Number(fd.get('price')),cycle:fd.get('cycle'),date:fd.get('date'),payment:fd.get('payment').trim(),note:fd.get('note').trim()});
    save();render();modal('subscriptionModal',false);toast('เพิ่มสมาชิกและวันต่ออายุในปฏิทินแล้ว');
  });
  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-delete]'); if(!btn)return;
    const sub=subscriptions.find(s=>s.id===btn.dataset.delete); if(!sub)return;
    if(!confirm(`ลบ ${sub.name} ออกจากรายการและปฏิทินใช่หรือไม่?`))return;
    subscriptions=subscriptions.filter(s=>s.id!==sub.id);save();render();toast('ลบสมาชิกออกจากปฏิทินแล้ว');
  });

  $('#exportSubscriptionCalendar')?.addEventListener('click',()=>{
    const stamp=d=>d.replaceAll('-','');
    const escapeICS=s=>String(s||'').replace(/\\/g,'\\\\').replace(/,/g,'\\,').replace(/;/g,'\\;').replace(/\n/g,'\\n');
    const events=subscriptions.map(s=>`BEGIN:VEVENT\r\nUID:${s.id}@subwise\r\nDTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}\r\nDTSTART;VALUE=DATE:${stamp(s.date)}\r\nSUMMARY:${escapeICS('ต่ออายุ '+s.name)}\r\nDESCRIPTION:${escapeICS(money(s.price)+' • '+cycleLabel(s.cycle)+' • '+(s.payment||''))}\r\nEND:VEVENT`).join('\r\n');
    const content='BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//SubWise//Subscription Reminders//TH\r\nCALSCALE:GREGORIAN\r\n'+events+'\r\nEND:VCALENDAR';
    const blob=new Blob([content],{type:'text/calendar;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='subwise-renewals.ics';a.click();URL.revokeObjectURL(url);toast('ส่งออกไฟล์ปฏิทินแล้ว');
  });
  render();
})();




(() => {
  const STORAGE_KEY = 'subwise.subscriptions.v1';

  let subscriptions = [];
  let selectedDate = new Date();
  let currentMonth = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    1
  );

  const $ = id => document.getElementById(id);

  const money = n =>
    '฿' + Number(n).toLocaleString('th-TH', {
      maximumFractionDigits: 2
    });

  const escapeHtml = value =>
    String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);

  const dateKey = date => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  function readSubscriptions() {
    try {
      const data = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || '[]'
      );

      subscriptions = Array.isArray(data) ? data : [];
    } catch {
      subscriptions = [];
    }

    renderCalendar();
  }

  // Generate recurring renewal dates for the visible month.
  function getEventsForMonth() {
    const events = [];
    const start = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );

    const end = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    );

    subscriptions.forEach(sub => {
      if (!sub.date) return;

      const original = new Date(sub.date + 'T00:00:00');
      if (isNaN(original.getTime())) return;

      let date = new Date(original);

      // Advance recurring subscriptions to the visible month.
      while (date < start) {
        if (sub.cycle === 'weekly') {
          date.setDate(date.getDate() + 7);
        } else if (sub.cycle === 'yearly') {
          date.setFullYear(date.getFullYear() + 1);
        } else {
          const nextMonth = date.getMonth() + 1;
          date = new Date(
            date.getFullYear(),
            nextMonth,
            Math.min(
              original.getDate(),
              new Date(date.getFullYear(), nextMonth + 1, 0).getDate()
            )
          );
        }
      }

      while (date <= end) {
        events.push({
          ...sub,
          eventDate: dateKey(date)
        });

        if (sub.cycle === 'weekly') {
          date.setDate(date.getDate() + 7);
        } else if (sub.cycle === 'yearly') {
          date.setFullYear(date.getFullYear() + 1);
        } else {
          const nextMonth = date.getMonth() + 1;
          date = new Date(
            date.getFullYear(),
            nextMonth,
            Math.min(
              original.getDate(),
              new Date(date.getFullYear(), nextMonth + 1, 0).getDate()
            )
          );
        }
      }
    });

    return events;
  }

  function renderCalendar() {
    const grid = $('calendarGrid');
    if (!grid) return;

    const events = getEventsForMonth();

    $('calendarSyncCount').textContent =
      `${events.length} รายการ`;

    $('calendarSyncStatus').textContent =
      `ซิงค์จากสมาชิกทั้งหมด ${subscriptions.length} บริการ`;

    const monthTitle = $('calendarMonthTitle');

    if (monthTitle) {
      monthTitle.textContent =
        currentMonth.toLocaleDateString('th-TH', {
          month: 'long',
          year: 'numeric'
        });
    }

    const firstDay = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    ).getDay();

    const daysInMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    ).getDate();

    const today = dateKey(new Date());

    const previousMonthDays = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      0
    ).getDate();

    let html = '';

    for (let i = 0; i < 42; i++) {
      const dayNumber = i - firstDay + 1;

      let date;
      let isCurrentMonth = true;

      if (dayNumber <= 0) {
        date = new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() - 1,
          previousMonthDays + dayNumber
        );
        isCurrentMonth = false;
      } else if (dayNumber > daysInMonth) {
        date = new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() + 1,
          dayNumber - daysInMonth
        );
        isCurrentMonth = false;
      } else {
        date = new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth(),
          dayNumber
        );
      }

      const key = dateKey(date);

      const dayEvents = events.filter(
        event => event.eventDate === key
      );

      const selected = key === dateKey(selectedDate);
      const isToday = key === today;

      html += `
        <button
          type="button"
          data-date="${key}"
          class="min-h-[52px] p-0.5 flex flex-col items-center justify-start rounded-lg
          ${isCurrentMonth ? 'text-on-surface' : 'text-outline-variant'}
          ${selected ? 'bg-primary-fixed ring-2 ring-primary' : 'hover:bg-surface-container'}
          ${isToday ? 'font-bold' : ''}">

          <span class="text-xs">${date.getDate()}</span>

          ${dayEvents.slice(0, 2).map(event => `
            <span class="w-full mt-0.5 px-0.5 rounded bg-primary text-white text-[9px] truncate text-center">
              ${escapeHtml(event.name)}
            </span>
          `).join('')}

          ${dayEvents.length > 2 ? `
            <span class="text-[9px] text-primary">
              +${dayEvents.length - 2}
            </span>
          ` : ''}
        </button>
      `;
    }

    grid.innerHTML = html;

    renderSelectedDate(events);
  }

  function renderSelectedDate(events) {
    const target = $('subscriptionCalendarEvents');
    if (!target) return;

    const key = dateKey(selectedDate);

    const selectedEvents = events.filter(
      event => event.eventDate === key
    );

    target.innerHTML = selectedEvents.map(event => `
      <div class="flex items-center justify-between gap-3 p-3 rounded-lg bg-surface-container-lowest">
        <div class="min-w-0">
          <div class="font-semibold truncate">
            ${escapeHtml(event.name)}
          </div>
          <div class="text-xs text-on-surface-variant">
            ${escapeHtml(event.payment || event.cycle)}
          </div>
        </div>

        <strong class="shrink-0">
          ${money(event.price)}
        </strong>
      </div>
    `).join('') || `
      <p class="text-sm text-on-surface-variant py-3">
        ไม่มีรายการต่ออายุในวันนี้
      </p>
    `;

    const title = $('selectedDateTitle');

    if (title) {
      title.textContent = selectedDate.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  }

  $('calendarGrid')?.addEventListener('click', event => {
    const button = event.target.closest('[data-date]');
    if (!button) return;

    const [y, m, d] = button.dataset.date.split('-').map(Number);

    selectedDate = new Date(y, m - 1, d);

    renderCalendar();
  });

  $('previousMonth')?.addEventListener('click', () => {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    renderCalendar();
  });

  $('nextMonth')?.addEventListener('click', () => {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    renderCalendar();
  });

  $('todayButton')?.addEventListener('click', () => {
    selectedDate = new Date();
    currentMonth = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      1
    );
    renderCalendar();
  });

  // Reload whenever the calendar page becomes visible.
  window.addEventListener('pageshow', readSubscriptions);

  // Also synchronize changes made in another browser tab.
  window.addEventListener('storage', event => {
    if (event.key === STORAGE_KEY) {
      readSubscriptions();
    }
  });

  // Initial load.
  readSubscriptions();
})();