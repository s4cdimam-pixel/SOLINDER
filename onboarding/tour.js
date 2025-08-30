
(function(){
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const defaultOptions = {
    storageKey: 'siteTour:v1',
    runOnce: true,
    interactive: false,
    padding: 10,
    scrollIntoView: 'center',
    onStart: null,
    onEnd: null,
    locale: { next: 'Next', back: 'Back', finish: 'Finish', skip: 'Skip' }
  };

  function createEl(tag, attrs={}, html='') {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v]) => {
      if (k === 'style') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.substring(2), v);
      else el.setAttribute(k, v);
    });
    if (html) el.innerHTML = html;
    return el;
  }

  function getRect(target, padding=10) {
    const r = target.getBoundingClientRect(); 
    return {
      top: r.top - padding,
      left: r.left - padding,
      width: r.width + padding*2,
      height: r.height + padding*2,
    };
  }

  function placeTooltip(targetRect, tooltip, placement) {
    const gap = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const centerX = targetRect.left + targetRect.width/2;
    const centerY = targetRect.top + targetRect.height/2;

    tooltip.style.maxWidth = tooltip.style.maxWidth || '360px';

    const tb = tooltip.getBoundingClientRect();
    const tw = tb.width, th = tb.height;

    const tryPlace = (p) => {
      let x, y, origin = 'center';
      switch(p) {
        case 'top':
          x = clamp(centerX - tw/2, 12, vw - tw - 12);
          y = centerY - targetRect.height/2 - th - gap;
          origin = 'bottom center';
          break;
        case 'bottom':
          x = clamp(centerX - tw/2, 12, vw - tw - 12);
          y = centerY + targetRect.height/2 + gap;
          origin = 'top center';
          break;
        case 'left':
          x = centerX - targetRect.width/2 - tw - gap;
          y = clamp(centerY - th/2, 12, vh - th - 12);
          origin = 'center right';
          break;
        case 'right':
          x = centerX + targetRect.width/2 + gap;
          y = clamp(centerY - th/2, 12, vh - th - 12);
          origin = 'center left';
          break;
        default:
          if (centerY < vh/2) return tryPlace('bottom');
          return tryPlace('top');
      }
      if (y < 8) y = 8;
      if (y + th > vh - 8) y = vh - th - 8;
      tooltip.style.setProperty('--origin', origin);
      return {x, y};
    };

    const xy = tryPlace(placement || 'auto');
    tooltip.style.left = xy.x + 'px';
    tooltip.style.top  = xy.y + 'px';
  }

  function arrowSVG() {
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 72 72');
    svg.classList.add('tour-arrow');
    const g = document.createElementNS(svgNS, 'g');
    g.setAttribute('fill','none');
    g.setAttribute('stroke','url(#g)');
    g.setAttribute('stroke-width','6');
    g.setAttribute('stroke-linecap','round');
    g.setAttribute('stroke-linejoin','round');
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d','M10 20 C 28 6, 56 10, 60 28 M60 28 L54 18 M60 28 L50 32');
    const defs = document.createElementNS(svgNS, 'defs');
    const grad = document.createElementNS(svgNS, 'linearGradient');
    grad.setAttribute('id','g'); grad.setAttribute('x1','0%'); grad.setAttribute('y1','0%');
    grad.setAttribute('x2','100%'); grad.setAttribute('y2','0%');
    const s1 = document.createElementNS(svgNS, 'stop');
    s1.setAttribute('offset','0%'); s1.setAttribute('stop-color','#8b5cf6');
    const s2 = document.createElementNS(svgNS, 'stop');
    s2.setAttribute('offset','100%'); s2.setAttribute('stop-color','#06b6d4');
    grad.appendChild(s1); grad.appendChild(s2); defs.appendChild(grad);
    g.appendChild(path);
    svg.appendChild(defs);
    svg.appendChild(g);
    return svg;
  }

  async function startSiteTour(steps, options={}) {
    const opt = Object.assign({}, defaultOptions, options);
    if (opt.runOnce && localStorage.getItem(opt.storageKey) === 'done') return;

    const overlay = createEl('div', { class: 'tour-overlay', 'data-active': 'true', role: 'dialog', 'aria-modal': 'true'});
    const backdropBlock = createEl('div', { class: 'tour-backdrop-block' });
    const spotlight = createEl('div', { class: 'tour-spotlight' });
    const pulse = createEl('div', { class: 'tour-pulse' });
    const tooltip = createEl('div', { class: 'tour-tooltip', role: 'document' });
    const arr = arrowSVG();

    if (opt.interactive) overlay.classList.add('interactive');

    overlay.append(backdropBlock, spotlight, pulse, tooltip, arr);
    document.body.appendChild(overlay);
    
    window.__tourCleanup = ()=>{ try{ overlay.remove(); }catch(e){} };


    let idx = 0;
    let cleanupFns = [];

    const updateProgressDots = (container, total, active) => {
      container.innerHTML = '';
      for (let i=0;i<total;i++) {
        const dot = createEl('div', {'class':'tour-dot','data-active': i===active ? 'true':'false'});
        container.appendChild(dot);
      }
    };

    const runStepHooks = async (type, step) => {
      if (!step) return;
      try {
        if (type === 'enter' && typeof step.onEnter === 'function') await step.onEnter();
        if (type === 'leave' && typeof step.onLeave === 'function') await step.onLeave();
      } catch(e) { console.warn('[tour hook]', e); }
    };

    const goTo = async (i) => {
      idx = clamp(i, 0, steps.length - 1);
      const step = steps[idx];
      cleanupFns.forEach(fn => {try{fn()}catch(e){}});
      cleanupFns = [];

      const target = typeof step.target === 'string' ? document.querySelector(step.target) : step.target;
      if (!target) { console.warn('[tour] target not found for step', step); return next(); }

      if (step.reveal !== false) {
        target.scrollIntoView({ behavior: 'smooth', block: opt.scrollIntoView });
        await sleep(280);
      }

      const rect = getRect(target, step.padding ?? opt.padding);

      Object.assign(spotlight.style, {
        top: rect.top + 'px',
        left: rect.left + 'px',
        width: rect.width + 'px',
        height: rect.height + 'px',
      });

      const pulseSize = Math.max(rect.width, rect.height) + 10;
      Object.assign(pulse.style, {
        top: (rect.top + rect.height/2 - pulseSize/2) + 'px',
        left: (rect.left + rect.width/2 - pulseSize/2) + 'px',
        width: pulseSize + 'px',
        height: pulseSize + 'px',
      });

      const t = step.title ? `<div class="tour-title">${step.title}</div>` : '';
      const c = step.content ? `<div class="tour-text">${step.content}</div>` : '';
      const left = `<div class="tour-left"><button class="tour-btn" data-action="back">${opt.locale.back}</button><div class="tour-progress" aria-hidden="true"></div></div>`;
      const right = `<div class="tour-right"><button class="tour-btn tour-skip" data-action="skip">${opt.locale.skip}</button><button class="tour-btn tour-next" data-action="next">${idx === steps.length-1 ? opt.locale.finish : opt.locale.next}</button></div>`;
      tooltip.innerHTML = `${t}${c}<div class="tour-controls">${left}${right}</div>`;

      placeTooltip(rect, tooltip, step.placement || 'auto');

      const tb = tooltip.getBoundingClientRect();
      const cx = tb.left + tb.width/2;
      const cy = tb.top + tb.height/2;
      const tx = rect.left + rect.width/2;
      const ty = rect.top + rect.height/2;
      const rad = Math.atan2(ty - cy, tx - cx);
      const angle = rad * 180 / Math.PI;
      arr.style.setProperty('--r', angle + 'deg');
      const ax = cx + Math.cos(rad) * (tb.width/2 + 24);
      const ay = cy + Math.sin(rad) * (tb.height/2 + 24);
      Object.assign(arr.style, { left: ax + 'px', top: ay + 'px' });

      const prog = tooltip.querySelector('.tour-progress');
      updateProgressDots(prog, steps.length, idx);

      tooltip.querySelector('[data-action="next"]').onclick = next;
      tooltip.querySelector('[data-action="back"]').onclick = back;
      tooltip.querySelector('[data-action="skip"]').onclick = end;

      await runStepHooks('enter', step);

      const onWin = () => {
        const r2 = getRect(target, step.padding ?? opt.padding);
        Object.assign(spotlight.style, { top: r2.top + 'px', left: r2.left + 'px', width: r2.width + 'px', height: r2.height + 'px' });
        placeTooltip(r2, tooltip, step.placement || 'auto');
        const tb2 = tooltip.getBoundingClientRect();
        const cx2 = tb2.left + tb2.width/2;
        const cy2 = tb2.top + tb2.height/2;
        const tx2 = r2.left + r2.width/2;
        const ty2 = r2.top + r2.height/2;
        const rad2 = Math.atan2(ty2 - cy2, tx2 - cx2);
        const angle2 = rad2 * 180 / Math.PI;
        arr.style.setProperty('--r', angle2 + 'deg');
        const ax2 = cx2 + Math.cos(rad2) * (tb2.width/2 + 24);
        const ay2 = cy2 + Math.sin(rad2) * (tb2.height/2 + 24);
        Object.assign(arr.style, { left: ax2 + 'px', top: ay2 + 'px' });
      };
      window.addEventListener('resize', onWin);
      window.addEventListener('scroll', onWin, { passive: true });
      cleanupFns.push(() => {
        window.removeEventListener('resize', onWin);
        window.removeEventListener('scroll', onWin);
      });
    };

    const next = async () => {
      await runStepHooks('leave', steps[idx]);
      if (idx < steps.length - 1) await goTo(idx + 1); else end();
    };
    const back = async () => {
      await runStepHooks('leave', steps[idx]);
      await goTo(idx - 1);
    };
    const end = () => {
      cleanupFns.forEach(fn => {try{fn()}catch(e){}});
      try { document.removeEventListener('keydown', onKey); } catch(e){}
      try { overlay.remove(); } catch(e){}
      window.__tourCleanup = null;
      if (opt.runOnce) localStorage.setItem(opt.storageKey, 'done');
      if (typeof opt.onEnd === 'function') opt.onEnd();
    };

    const onKey = (e) => {
      if (e.key === 'Escape') end();
      if (e.key === 'ArrowRight' || e.key === 'Enter') next();
      if (e.key === 'ArrowLeft') back();
    };
    document.addEventListener('keydown', onKey);
    cleanupFns.push(() => document.removeEventListener('keydown', onKey));

    if (typeof opt.onStart === 'function') opt.onStart();
    await goTo(0);
    return { end, next, back };
  }

  window.startSiteTour = startSiteTour;
})();