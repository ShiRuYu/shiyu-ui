import type { Directive, DirectiveBinding } from 'vue';

interface AccessibleComboboxBinding {
  expanded: boolean;
  label: string;
}

interface AccessibleComboboxState {
  bodyObserver?: MutationObserver;
  listboxId: string;
  menu?: HTMLElement;
  menuObserver?: MutationObserver;
  triggerId: string;
}

const states = new WeakMap<HTMLElement, AccessibleComboboxState>();
let instanceCount = 0;

function setAttribute(element: HTMLElement, name: string, value: string) {
  if (element.getAttribute(name) !== value) {
    element.setAttribute(name, value);
  }
}

function syncOptions(
  menu: HTMLElement,
  trigger: HTMLElement,
  state: AccessibleComboboxState,
) {
  const options = Array.from(
    menu.querySelectorAll<HTMLElement>('.n-base-select-option'),
  );
  options.forEach((option, index) => {
    setAttribute(option, 'role', 'option');
    setAttribute(option, 'id', `${state.listboxId}-option-${index + 1}`);
    setAttribute(
      option,
      'aria-selected',
      String(option.classList.contains('n-base-select-option--selected')),
    );
    setAttribute(
      option,
      'aria-disabled',
      String(option.classList.contains('n-base-select-option--disabled')),
    );
    setAttribute(option, 'aria-posinset', String(index + 1));
    setAttribute(option, 'aria-setsize', String(options.length));
  });

  const activeOption =
    options.find((option) =>
      option.classList.contains('n-base-select-option--pending'),
    ) ??
    options.find((option) => option.getAttribute('aria-selected') === 'true');

  if (activeOption) {
    setAttribute(trigger, 'aria-activedescendant', activeOption.id);
  } else {
    trigger.removeAttribute('aria-activedescendant');
  }
}

function findVisibleMenu() {
  return Array.from(
    document.querySelectorAll<HTMLElement>('.n-base-select-menu'),
  ).find((menu) => menu.getClientRects().length > 0);
}

function observeMenu(
  menu: HTMLElement,
  trigger: HTMLElement,
  state: AccessibleComboboxState,
) {
  if (state.menu === menu && state.menuObserver) {
    syncOptions(menu, trigger, state);
    return;
  }

  state.menuObserver?.disconnect();
  state.menu = menu;
  setAttribute(menu, 'id', state.listboxId);
  setAttribute(menu, 'role', 'listbox');
  setAttribute(menu, 'aria-labelledby', state.triggerId);
  setAttribute(trigger, 'aria-controls', state.listboxId);
  syncOptions(menu, trigger, state);

  state.menuObserver = new MutationObserver(() => {
    syncOptions(menu, trigger, state);
  });
  state.menuObserver.observe(menu, {
    attributes: true,
    attributeFilter: ['class'],
    childList: true,
    subtree: true,
  });
}

function stopObserving(state: AccessibleComboboxState) {
  state.bodyObserver?.disconnect();
  state.bodyObserver = undefined;
  state.menuObserver?.disconnect();
  state.menuObserver = undefined;
  state.menu = undefined;
}

function syncAccessibleCombobox(
  element: HTMLElement,
  binding: DirectiveBinding<AccessibleComboboxBinding>,
) {
  const trigger = element.querySelector<HTMLElement>('.n-base-selection-label');
  if (!trigger) return;

  let state = states.get(element);
  if (!state) {
    instanceCount += 1;
    state = {
      listboxId: `accessible-combobox-${instanceCount}-listbox`,
      triggerId: `accessible-combobox-${instanceCount}-trigger`,
    };
    states.set(element, state);
  }

  setAttribute(trigger, 'id', state.triggerId);
  setAttribute(trigger, 'role', 'combobox');
  setAttribute(trigger, 'aria-label', binding.value.label);
  setAttribute(trigger, 'aria-expanded', String(binding.value.expanded));
  setAttribute(trigger, 'aria-haspopup', 'listbox');

  if (!binding.value.expanded) {
    trigger.removeAttribute('aria-controls');
    trigger.removeAttribute('aria-activedescendant');
    stopObserving(state);
    return;
  }

  const menu = findVisibleMenu();
  if (menu) {
    state.bodyObserver?.disconnect();
    state.bodyObserver = undefined;
    observeMenu(menu, trigger, state);
    return;
  }

  if (!state.bodyObserver) {
    state.bodyObserver = new MutationObserver(() => {
      const nextMenu = findVisibleMenu();
      if (!nextMenu) return;
      state?.bodyObserver?.disconnect();
      state!.bodyObserver = undefined;
      observeMenu(nextMenu, trigger, state!);
    });
    state.bodyObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
}

const accessibleCombobox: Directive<HTMLElement, AccessibleComboboxBinding> = {
  mounted: syncAccessibleCombobox,
  updated: syncAccessibleCombobox,
  unmounted(element) {
    const state = states.get(element);
    if (state) stopObserving(state);
  },
};

export { accessibleCombobox };
