// Balance contact rows using the rendered font and available width.
(() => {
  const container = document.querySelector('.contact');
  if (!container) return;
  const items = [...container.querySelectorAll('.contact-item')];
  if (!items.length) return;
  const narrow = matchMedia('screen and (max-width: 760px)');
  let frame;
  let lastWidth = -1;
  let lastGroups = '';

  function measure(node) {
    const probe = node.cloneNode(true);
    probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;width:max-content;max-width:none;white-space:nowrap;';
    container.append(probe);
    const width = probe.getBoundingClientRect().width;
    probe.remove();
    return width;
  }

  function separator() {
    const element = document.createElement('span');
    element.className = 'separator';
    element.setAttribute('aria-hidden', 'true');
    element.textContent = '-';
    return element;
  }

  function balance() {
    const width = container.getBoundingClientRect().width;
    if (!width || matchMedia('print').matches) return;
    lastWidth = width;
    const sizes = items.map(measure);
    const gap = parseFloat(getComputedStyle(container).columnGap) || 0;
    const spacing = narrow.matches ? gap : gap * 2 + measure(separator());
    const limit = narrow.matches ? 3 : items.length;
    let groups;
    // Prefer fewer rows, then the most even item counts; keep source order.
    for (let rows = Math.ceil(items.length / limit); rows <= items.length; rows++) {
      const memo = new Map();
      const target = items.length / rows;
      function split(start, remaining) {
        if (!remaining) return start === items.length ? { cost: 0, counts: [] } : null;
        const key = `${start}:${remaining}`;
        if (memo.has(key)) return memo.get(key);
        let best = null;
        for (let count = Math.min(limit, items.length - start - remaining + 1); count >= 1; count--) {
          const rowWidth = sizes.slice(start, start + count).reduce((sum, value) => sum + value, 0) + spacing * (count - 1);
          // A single long label may wrap within the available row width.
          if (count > 1 && rowWidth > width - 1) continue;
          const tail = split(start + count, remaining - 1);
          if (!tail) continue;
          const cost = (count - target) ** 2 + tail.cost;
          if (!best || cost < best.cost) best = { cost, counts: [count, ...tail.counts] };
        }
        memo.set(key, best);
        return best;
      }
      groups = split(0, rows)?.counts;
      if (groups) break;
    }
    const signature = groups.join(',');
    if (signature === lastGroups) return;
    lastGroups = signature;
    const fragment = document.createDocumentFragment();
    let start = 0;
    for (const count of groups) {
      const row = document.createElement('span');
      row.className = 'contact-row';
      for (let index = start; index < start + count; index++) {
        if (index) row.append(separator());
        row.append(items[index]);
      }
      fragment.append(row);
      start += count;
    }
    const focused = document.activeElement;
    container.replaceChildren(fragment);
    container.setAttribute('data-balanced', '');
    if (container.contains(focused)) focused.focus({ preventScroll: true });
  }

  function schedule() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(balance);
  }
  balance();
  document.fonts.ready.then(schedule);
  new ResizeObserver(() => {
    if (Math.abs(container.getBoundingClientRect().width - lastWidth) > 0.5) schedule();
  }).observe(container);
  narrow.addEventListener('change', schedule);
  window.addEventListener('afterprint', schedule);
})();
