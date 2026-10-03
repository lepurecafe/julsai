(() => {
  'use strict';

  // This is a small website example, not the native Julsai editor. Drafts stay
  // in this page's memory; nothing is uploaded or persisted.
  const example = '# A Quiet Morning\n\nThe morning light was softer today. I opened my notebook and let the thoughts arrive without hurry.\n\nGood writing is a conversation with your future self.\n\n- Clear words\n- A calmer mind\n- A more open tomorrow\n\nThat’s why I keep a journal.';
  const editor = document.getElementById('demo-editor');
  const source = document.getElementById('demo-source');
  const read = document.getElementById('demo-read');
  const status = document.getElementById('demo-status');
  let draft = source?.value || editor?.value || example;

  function renderDraft() {
    if (!read) return;
    const fragment = document.createDocumentFragment();
    let paragraph = [];
    let list = null;
    const appendText = (tag, text, parent = fragment) => {
      const element = document.createElement(tag);
      element.textContent = text;
      parent.append(element);
      return element;
    };
    const flushParagraph = () => {
      if (paragraph.length) appendText('p', paragraph.join('\n'));
      paragraph = [];
    };

    for (const line of draft.replace(/\r\n?/g, '\n').split('\n')) {
      const heading = /^(#{1,6})\s+(.+)$/.exec(line);
      const item = /^[-*+]\s+(.+)$/.exec(line);
      if (!line.trim()) {
        flushParagraph();
        list = null;
      } else if (heading) {
        flushParagraph();
        list = null;
        // Keep the example below the page's h1 and section h2 hierarchy.
        appendText(`h${Math.min(6, heading[1].length + 2)}`, heading[2]);
      } else if (item) {
        flushParagraph();
        if (!list) {
          list = document.createElement('ul');
          fragment.append(list);
        }
        appendText('li', item[1], list);
      } else {
        list = null;
        paragraph.push(line);
      }
    }
    flushParagraph();
    read.replaceChildren(fragment);
  }

  function syncDraft(input) {
    draft = input.value;
    for (const field of [editor, source]) {
      // Avoid resetting the caret or disrupting an active IME composition.
      if (field && field !== input && field.value !== draft) field.value = draft;
    }
    renderDraft();
  }

  for (const field of [editor, source]) {
    if (!field) continue;
    field.value = draft;
    field.addEventListener('input', () => syncDraft(field));
  }
  renderDraft();

  function enhanceTabs(group) {
    if (!group) return;
    const tablist = group.querySelector('[data-tabs]');
    if (!tablist || tablist.dataset.enhanced) return;
    const tabs = [...tablist.querySelectorAll('button[data-view]')];
    const panels = [...group.querySelectorAll('[data-panel]')];
    if (!tabs.length || !panels.length) return;
    const validTabs = tabs.filter((tab) => panels.some((panel) => panel.dataset.panel === tab.dataset.view));
    if (!validTabs.length) return;

    function activate(tab, moveFocus = false) {
      for (const current of validTabs) {
        const selected = current === tab;
        current.setAttribute('aria-selected', String(selected));
        current.tabIndex = selected ? 0 : -1;
      }
      for (const panel of panels) panel.hidden = panel.dataset.panel !== tab.dataset.view;
      if (group.id === 'document-demo' && status) {
        const labels = { read: 'Read view', edit: 'Edit view', source: 'Markdown source' };
        status.textContent = `${labels[tab.dataset.view] || tab.textContent.trim()} · same document`;
      }
      if (moveFocus) tab.focus();
    }

    for (const tab of validTabs) {
      tab.addEventListener('click', () => activate(tab));
      tab.addEventListener('keydown', (event) => {
        const index = validTabs.indexOf(tab);
        let next;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % validTabs.length;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + validTabs.length) % validTabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = validTabs.length - 1;
        if (next === undefined) return;
        event.preventDefault();
        activate(validTabs[next], true);
      });
    }
    activate(validTabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || validTabs[0]);
    tablist.dataset.enhanced = 'true';
    tablist.hidden = false;
  }

  enhanceTabs(document.getElementById('document-demo'));
  enhanceTabs(document.getElementById('structure-demo'));

  const mobileMenu = document.getElementById('mobile-nav');
  if (mobileMenu) {
    mobileMenu.addEventListener('click', (event) => {
      const link = event.target?.closest?.('a');
      if (link && mobileMenu.contains(link)) mobileMenu.open = false;
    });
    mobileMenu.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !mobileMenu.open) return;
      mobileMenu.open = false;
      mobileMenu.querySelector('summary')?.focus();
      event.preventDefault();
    });
  }
})();
