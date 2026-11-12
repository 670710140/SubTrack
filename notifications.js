(() => {
  'use strict';
  const STORAGE_KEY = 'subwise.subscriptions.v1';
  const money = value => '฿' + Number(value || 0).toLocaleString('th-TH', {maximumFractionDigits: 2});
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[c]);
  const todayStart = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };

  function readSubscriptions() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(value) ? value.filter(s => s && s.name && s.date) : [];
    } catch (_) { return []; }
  }

  function nextRenewal(sub, today) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(sub.date || ''));
    if (!match) return null;
    const originalDay = Number(match[3]);
    let date = new Date(Number(match[1]), Number(match[2])-1, originalDay);
    if (Number.isNaN(date.getTime())) return null;
    let guard = 0;
    while (date < today && guard++ < 600) {
      if (sub.cycle === 'weekly') date.setDate(date.getDate()+7);
      else if (sub.cycle === 'yearly') {
        const y = date.getFullYear()+1;
        date = new Date(y, date.getMonth(), Math.min(originalDay, new Date(y,date.getMonth()+1,0).getDate()));
      } else {
        const m = date.getMonth()+1, y = date.getFullYear()+Math.floor(m/12), month = m%12;
        date = new Date(y, month, Math.min(originalDay, new Date(y,month+1,0).getDate()));
      }
    }
    return date;
  }

  function daysBetween(a,b) { return Math.round((b-a)/86400000); }
  function dateLabel(date) {
    return date.toLocaleDateString('th-TH', {day:'numeric', month:'short', year:'numeric'});
  }
  function monthlyCost(s) {
    const p = Number(s.price)||0;
    return s.cycle === 'yearly' ? p/12 : s.cycle === 'weekly' ? p*52/12 : p;
  }

  function recommendation(subscriptions) {
    if (!subscriptions.length) return null;
    const signals = /ไม่ได้เปิด|ไม่ค่อยได้ใช้|ใช้งานน้อย|ไม่คุ้ม|ไม่ได้ใช้|rarely|unused|low usage|not using|hardly use/i;
    const flagged = subscriptions.filter(s => signals.test(String(s.note || '') + ' ' + String(s.usage || '')));
    const chosen = (flagged.length ? flagged : subscriptions)
      .slice().sort((a,b) => monthlyCost(b)-monthlyCost(a))[0];
    const isUsageFlagged = flagged.includes(chosen);
    return {
      sub: chosen,
      reason: isUsageFlagged
        ? (chosen.note || chosen.usage || 'มีข้อมูลบ่งชี้ว่าใช้งานไม่บ่อย')
        : 'ยังไม่มีข้อมูลการใช้งาน จึงเลือกบริการที่มีค่าใช้จ่ายต่อเดือนสูงสุดให้ตรวจสอบก่อน'
    };
  }

  function ensurePopup() {
    if (document.getElementById('subwiseNotificationPanel')) return;
    const button = document.querySelector('[aria-label="Notifications"]');
    if (!button) return;
    button.id = button.id || 'subwiseNotificationButton';
    button.type = 'button';
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-expanded', 'false');
    button.insertAdjacentHTML('afterend', `
      <section id="subwiseNotificationPanel" role="dialog" aria-label="Notifications"
        class="hidden fixed z-[100] top-[4.75rem] right-3 sm:right-6 w-[calc(100vw-1.5rem)] max-w-sm max-h-[min(75vh,38rem)] overflow-y-auto rounded-2xl bg-surface-container-lowest text-on-surface shadow-2xl ring-1 ring-black/10">
        <div class="flex items-center justify-between gap-3 p-4 border-b border-outline-variant/40">
          <div><h2 class="font-headline-sm text-headline-sm font-bold">การแจ้งเตือน</h2><p class="text-xs text-on-surface-variant mt-0.5">อัปเดตจากรายการสมัครสมาชิกของคุณ</p></div>
          <button type="button" id="subwiseNotificationClose" aria-label="Close notifications" class="w-9 h-9 rounded-full hover:bg-surface-container flex items-center justify-center"><span class="material-symbols-outlined">close</span></button>
        </div>
        <div id="subwiseNotificationContent" class="p-3 flex flex-col gap-3"></div>
      </section>
      <div id="subwiseNotificationBackdrop" class="hidden fixed inset-0 z-[90]" aria-hidden="true"></div>
    `);
  }

  function render() {
    ensurePopup();
    const content = document.getElementById('subwiseNotificationContent');
    const button = document.getElementById('subwiseNotificationButton');
    if (!content || !button) return;
    const subscriptions = readSubscriptions();
    const today = todayStart();
    const upcoming = subscriptions.map(sub => ({sub, date:nextRenewal(sub,today)}))
      .filter(x => x.date).sort((a,b) => a.date-b.date);
    const closest = upcoming[0] || null;
    const cancel = recommendation(subscriptions);

    let renewalHtml = closest ? (() => {
      const days = daysBetween(today, closest.date);
      const when = days === 0 ? 'Due today' : days === 1 ? 'Due tomorrow' : `In ${days} days`;
      return `<article class="rounded-xl border border-error/20 bg-error-container/50 p-3">
        <div class="flex items-center gap-2 text-error font-semibold text-xs uppercase tracking-wide"><span class="material-symbols-outlined text-[18px]">event_upcoming</span> Closest renewal</div>
        <div class="mt-2 flex items-start justify-between gap-2"><div class="min-w-0"><h3 class="font-semibold truncate">${escapeHtml(closest.sub.name)}</h3><p class="text-xs text-on-surface-variant mt-1">${dateLabel(closest.date)} · ${when}</p></div><strong class="shrink-0">${money(closest.sub.price)}</strong></div>
        
      </article>`;
    })() : `<article class="rounded-xl bg-surface-container p-3"><div class="font-semibold text-sm">Closest renewal</div><p class="text-xs text-on-surface-variant mt-1">No subscription renewal dates found.</p></article>`;

    let cancelHtml = cancel ? `<article class="rounded-xl border border-tertiary/20 bg-tertiary-fixed/30 p-3">
      <div class="flex items-center gap-2 text-on-tertiary-fixed-variant font-semibold text-xs uppercase tracking-wide"><span class="material-symbols-outlined text-[18px]">lightbulb</span> Recommended cancellation review</div>
      <div class="mt-2 flex items-start justify-between gap-2"><div class="min-w-0"><h3 class="font-semibold truncate">${escapeHtml(cancel.sub.name)}</h3><p class="text-xs text-on-surface-variant mt-1">${escapeHtml(cancel.reason)}</p></div><strong class="shrink-0">${money(monthlyCost(cancel.sub))}<span class="text-[10px] font-normal">/mo.</span></strong></div>
      
    </article>` : `<article class="rounded-xl bg-surface-container p-3"><div class="font-semibold text-sm">Recommended cancellation review</div><p class="text-xs text-on-surface-variant mt-1">Add a subscription to receive a cost-saving suggestion.</p></article>`;

    content.innerHTML = renewalHtml + cancelHtml + `<p class="px-1 pb-1 text-[10px] leading-relaxed text-on-surface-variant">Cancellation suggestions are estimates based on saved notes and subscription cost. They do not cancel anything automatically.</p>`;
    const dot = button.querySelector('.absolute');
    if (dot) dot.classList.toggle('hidden', !closest && !cancel);
  }

  function setOpen(open) {
    const panel = document.getElementById('subwiseNotificationPanel');
    const backdrop = document.getElementById('subwiseNotificationBackdrop');
    const button = document.getElementById('subwiseNotificationButton');
    if (!panel || !backdrop || !button) return;
    panel.classList.toggle('hidden', !open);
    backdrop.classList.toggle('hidden', !open);
    button.setAttribute('aria-expanded', String(open));
    if (open) render();
  }

  document.addEventListener('click', event => {
    const bell = event.target.closest('#subwiseNotificationButton, [aria-label="Notifications"]');
    if (bell) { event.preventDefault(); setOpen(document.getElementById('subwiseNotificationPanel')?.classList.contains('hidden') ?? true); return; }
    if (event.target.closest('#subwiseNotificationClose, #subwiseNotificationBackdrop')) { setOpen(false); return; }
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') setOpen(false); });
  window.addEventListener('storage', event => { if (!event.key || event.key === STORAGE_KEY) render(); });
  window.addEventListener('pageshow', render);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render, {once:true});
  else render();
})();