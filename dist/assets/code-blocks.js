(() => {
  let sequence = 0;
  const fallbackCopy = text => {
    const selection = document.getSelection();
    const ranges = selection ? Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index).cloneRange()) : [];
    const focused = document.activeElement;
    const field = document.createElement('textarea');
    field.value = text;
    field.readOnly = true;
    field.style.cssText = 'position:fixed;left:-9999px;top:0;';
    document.body.append(field);
    field.select();
    try {
      if (!document.execCommand('copy')) throw new Error('Clipboard unavailable');
    } finally {
      field.remove();
      if (selection) { selection.removeAllRanges(); ranges.forEach(range => selection.addRange(range)); }
      focused?.focus({ preventScroll: true });
    }
  };
  for (const block of document.querySelectorAll('.code-block')) {
    const code = block.querySelector('pre code');
    const copy = block.querySelector('.code-copy');
    const toggle = block.querySelector('.code-toggle');
    const status = block.querySelector('.code-status');
    if (!code || !copy) continue;
    block.classList.add('is-enhanced');
    copy.hidden = false;
    let busy = false;
    let reset;
    copy.addEventListener('click', async () => {
      if (busy) return;
      busy = true;
      clearTimeout(reset);
      status.textContent = '';
      try {
        try {
          if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
          await navigator.clipboard.writeText(code.textContent);
        } catch {
          fallbackCopy(code.textContent);
        }
        copy.textContent = 'Copied!';
        status.textContent = 'Code copied to clipboard.';
      } catch {
        copy.textContent = 'Copy failed';
        status.textContent = 'Copy failed. Select the code and copy it manually.';
      } finally {
        busy = false;
        reset = setTimeout(() => { copy.textContent = 'Copy'; status.textContent = ''; }, 1800);
      }
    });
    if (toggle) {
      let id;
      do { id = `code-content-${++sequence}`; } while (document.getElementById(id));
      code.parentElement.id = id;
      toggle.setAttribute('aria-controls', id);
      toggle.hidden = false;
      toggle.addEventListener('click', () => {
        const expanded = block.dataset.expanded !== 'true';
        block.dataset.expanded = String(expanded);
        toggle.setAttribute('aria-expanded', String(expanded));
        toggle.textContent = expanded ? 'Collapse code' : `Show all ${block.dataset.codeLines} lines`;
      });
    }
  }
})();
