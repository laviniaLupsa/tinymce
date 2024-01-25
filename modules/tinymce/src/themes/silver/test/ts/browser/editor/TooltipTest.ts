import { FocusTools, Mouse, UiFinder, Waiter } from '@ephox/agar';
import { context, describe, it } from '@ephox/bedrock-client';
import { Arr, Fun } from '@ephox/katamari';
import { SugarBody, SugarElement, TextContent } from '@ephox/sugar';
import { TinyHooks, TinyUiActions } from '@ephox/wrap-mcagar';
import { assert } from 'chai';

import Editor from 'tinymce/core/api/Editor';

interface TestScenario {
  readonly label: string;
  readonly pTriggerTooltip: (editor: Editor, selector: string) => Promise<void>;
}

describe('browser.tinymce.themes.silver.editor.TooltipTest', () => {
  const tooltipSelector = '.tox-silver-sink .tox-tooltip__body';

  const pAssertTooltip = async (editor: Editor, pTriggerTooltip: () => Promise<void>, text: string) => {
    await pTriggerTooltip();
    const tooltip = await TinyUiActions.pWaitForUi(editor, tooltipSelector) as SugarElement<HTMLElement>;
    assert.equal(TextContent.get(tooltip), text);
  };

  const pAssertNoTooltip = async (_: Editor, pTriggerTooltip: () => Promise<void>, _text: string) => {
    await pTriggerTooltip();
    await Waiter.pWait(300);
    UiFinder.notExists(SugarBody.body(), tooltipSelector);
  };

  const pTriggerTooltipWithMouse = async (editor: Editor, selector: string) => {
    const button = await TinyUiActions.pWaitForUi(editor, selector) as SugarElement<HTMLElement>;
    Mouse.mouseOver(button);
  };

  const pTriggerTooltipWithKeyboard = (_: Editor, selector: string) => {
    FocusTools.setFocus(SugarBody.body(), selector);
    return Promise.resolve();
  };

  const pCloseTooltip = async (editor: Editor, selector: string) => {
    const button = await TinyUiActions.pWaitForUi(editor, selector) as SugarElement<HTMLElement>;
    Mouse.mouseOut(button);
    editor.focus();
    await Waiter.pTryUntil(
      'Waiting for tooltip to NO LONGER be in DOM',
      () => UiFinder.notExists(SugarBody.body(), tooltipSelector));
  };

  const closeMenu = (selector: string) => {
    Mouse.clickOn(SugarBody.body(), selector);
    return Waiter.pTryUntil('Waiting for menu', () =>
      UiFinder.notExists(SugarBody.body(), '[role="menu"]')
    );
  };

  const openMenu = (editor: Editor, buttonSelector: string) => {
    TinyUiActions.clickOnToolbar(editor, buttonSelector);
    return TinyUiActions.pWaitForPopup(editor, '[role="menu"]');
  };

  Arr.each([
    { label: 'Mouse', pTriggerTooltip: pTriggerTooltipWithMouse },
    { label: 'Keyboard', pTriggerTooltip: pTriggerTooltipWithKeyboard },
  ], (test: TestScenario) => {
    context('Basic buttons', () => {
      const hook = TinyHooks.bddSetup<Editor>({
        base_url: '/project/tinymce/js/tinymce',
        toolbar: 'basic-button toggle-button menu-button split-button forecolor split-button-with-icon',
        setup: (ed: Editor) => {
          ed.ui.registry.addButton('basic-button', {
            text: 'Button',
            tooltip: 'Button',
            onAction: Fun.noop
          });

          ed.ui.registry.addToggleButton('toggle-button', {
            text: 'Toggle Button',
            tooltip: 'Toggle Button',
            onAction: Fun.noop
          });

          ed.ui.registry.addMenuButton('menu-button', {
            text: 'Menu Button',
            tooltip: 'Menu Button',
            fetch: (success) => {
              success([
                {
                  type: 'togglemenuitem',
                  text: 'Toggle menu item',
                  onAction: Fun.noop,
                  active: true
                }
              ]);
            },
          });

          ed.ui.registry.addSplitButton('split-button', {
            text: 'Split Button',
            tooltip: 'Split Button',
            fetch: (success) => {
              success([
                {
                  text: 'Choice item 1',
                  type: 'choiceitem',
                }
              ]);
            },
            onAction: Fun.noop,
            onItemAction: Fun.noop
          });

          ed.ui.registry.addSplitButton('split-button-with-icon', {
            icon: 'bold',
            tooltip: 'Split Button with Icon',
            presets: 'listpreview',
            columns: 3,
            fetch: (success) => {
              success([
                {
                  type: 'choiceitem',
                  value: 'lower-alpha-1',
                  icon: 'list-num-lower-alpha',
                  text: 'Lower Alpha 1'
                },
                {
                  type: 'choiceitem',
                  value: 'lower-alpha-2',
                  icon: 'list-num-lower-alpha',
                  text: 'Lower Alpha 2'
                },
                {
                  type: 'choiceitem',
                  value: 'lower-alpha-3',
                  icon: 'list-num-lower-alpha',
                  text: 'Lower Alpha 3'
                }
              ]);
            },
            onAction: Fun.noop,
            onItemAction: Fun.noop,
            select: Fun.always,
            onSetup: () => Fun.noop
          });
        }
      });

      it(`TINY-10453: Should trigger tooltip with ${test.label} - Toolbar addButton`, async () => {
        const editor = hook.editor();
        const buttonSelector = 'button[data-mce-name="basic-button"]';
        await pAssertTooltip(editor, () => test.pTriggerTooltip(editor, buttonSelector), 'Button');
        await pCloseTooltip(editor, buttonSelector);
      });

      it(`TINY-10453: Should trigger tooltip with ${test.label} - Toolbar addToggleButton`, async () => {
        const editor = hook.editor();
        const buttonSelector = 'button[data-mce-name="toggle-button"]';
        await pAssertTooltip(editor, () => test.pTriggerTooltip(editor, buttonSelector), 'Toggle Button');
        await pCloseTooltip(editor, buttonSelector);
      });

      it(`TINY-10453: Should trigger tooltip with ${test.label} - Toolbar addMenuButton`, async () => {
        const editor = hook.editor();
        const buttonSelector = 'button[data-mce-name="menu-button"]';
        await pAssertTooltip(editor, () => test.pTriggerTooltip(editor, buttonSelector), 'Menu Button');
        await pCloseTooltip(editor, buttonSelector);
      });

      it(`TINY-10453: Should trigger tooltip with ${test.label} - Toolbar addSplitButton`, async () => {
        const editor = hook.editor();
        const buttonSelector = 'div[data-mce-name="split-button"]';
        await pAssertTooltip(editor, () => test.pTriggerTooltip(editor, buttonSelector), 'Split Button');
        await pCloseTooltip(editor, buttonSelector);
      });

      it(`TINY-10453: Should trigger tooltip with ${test.label} - Toolbar Split Button Menu - forecolor`, async () => {
        const editor = hook.editor();
        const buttonSelector = 'div[data-mce-name="forecolor"] > .tox-tbtn + .tox-split-button__chevron';
        await openMenu(editor, buttonSelector);
        await Waiter.pWait(300);
        const menuSelector = 'div[data-mce-name="Red"]';
        await test.pTriggerTooltip(editor, menuSelector);
        const tooltip = await TinyUiActions.pWaitForUi(editor, '.tox-silver-sink .tox-tooltip__body:contains("Red")') as SugarElement<HTMLElement>;
        assert.equal(TextContent.get(tooltip), 'Red');
        await pCloseTooltip(editor, menuSelector);
        await closeMenu(menuSelector);
      });

      it(`TINY-10453: Should trigger tooltip with ${test.label} - Toolbar Split Button Menu - listpreview`, async () => {
        const editor = hook.editor();
        const buttonSelector = 'div[data-mce-name="split-button-with-icon"]  > .tox-tbtn + .tox-split-button__chevron';
        await openMenu(editor, buttonSelector);
        const menuSelector = 'div[aria-label="Lower Alpha 1"]';
        await pAssertTooltip(editor, () => test.pTriggerTooltip(editor, menuSelector), 'Lower Alpha 1');
        await pCloseTooltip(editor, menuSelector);
        await closeMenu(menuSelector);
      });
    });

    context('Dialog related buttons', () => {
      const hook = TinyHooks.bddSetup<Editor>({
        base_url: '/project/tinymce/js/tinymce',
        toolbar: 'dialog-button dialog-footer-button size-input-dialog-button',
        setup: (ed: Editor) => {
          ed.ui.registry.addButton('dialog-button', {
            text: 'Dialog Button',
            onAction: () => {
              ed.windowManager.open({
                title: 'Test Dialog',
                size: 'normal',
                body: {
                  type: 'panel',
                  items: [{
                    type: 'button',
                    name: 'prev',
                    text: 'Test-Button',
                    icon: 'action-prev',
                  }]
                }
              });
            }
          });

          ed.ui.registry.addButton('dialog-footer-button', {
            text: 'Dialog Footer Button',
            onAction: () => {
              ed.windowManager.open({
                title: 'Test Dialog',
                size: 'normal',
                body: {
                  type: 'panel',
                  items: [
                    {
                      type: 'input',
                      name: 'width',
                      label: 'Width'
                    },
                  ]
                },
                buttons: [{
                  type: 'menu',
                  name: 'options',
                  icon: 'Preferences',
                  tooltip: 'Preferences',
                  align: 'start',
                  items: [{
                    type: 'togglemenuitem',
                    name: 'menuitem1',
                    text: 'Menu item 1',
                  }]
                }]
              });
            }
          });

          ed.ui.registry.addButton('size-input-dialog-button', {
            text: 'Dialog Button',
            onAction: () => {
              ed.windowManager.open({
                title: 'Test Dialog',
                size: 'normal',
                body: {
                  type: 'panel',
                  items: [
                    {
                      type: 'sizeinput',
                      name: 'dimensions',
                      label: 'Constrain proportions',
                      constrain: true
                    }
                  ]
                }
              });
            }
          });
        }
      });

      it(`TINY-10453: Should trigger tooltip with ${test.label} - button without label in Dialog`, async () => {
        const editor = hook.editor();
        const toolbarButtonSelector = '[data-mce-name="dialog-button"]';
        TinyUiActions.clickOnToolbar(editor, toolbarButtonSelector);
        await TinyUiActions.pWaitForDialog(editor);
        const buttonSelector = '[data-mce-name="Test-Button"]';
        await pAssertTooltip(editor, () => test.pTriggerTooltip(editor, buttonSelector), 'Test-Button');
        await pCloseTooltip(editor, buttonSelector);
        TinyUiActions.closeDialog(editor);
      });

      it(`TINY-10453: Should trigger tooltip with ${test.label} - sizeinput - 'Constrain Proportions' in Dialog`, async () => {
        const editor = hook.editor();
        const toolbarButtonSelector = '[data-mce-name="size-input-dialog-button"]';
        TinyUiActions.clickOnToolbar(editor, toolbarButtonSelector);
        await TinyUiActions.pWaitForDialog(editor);
        const buttonSelector = '[data-mce-name="Constrain proportions"]';
        await pAssertTooltip(editor, () => test.pTriggerTooltip(editor, buttonSelector), 'Constrain proportions');
        await pCloseTooltip(editor, buttonSelector);
        TinyUiActions.closeDialog(editor);
      });

      it(`TINY-10453: Should trigger tooltip with ${test.label} - dialog footer button`, async () => {
        const editor = hook.editor();
        const toolbarButtonSelector = '[data-mce-name="dialog-footer-button"]';
        TinyUiActions.clickOnToolbar(editor, toolbarButtonSelector);
        await TinyUiActions.pWaitForDialog(editor);
        const buttonSelector = '[data-mce-name="Preferences"]';
        await pAssertTooltip(editor, () => test.pTriggerTooltip(editor, buttonSelector), 'Preferences');
        await pCloseTooltip(editor, buttonSelector);
        TinyUiActions.closeDialog(editor);
      });

      it(`TINY-10453: Should trigger tooltip with ${test.label} - dialog close button`, async () => {
        const editor = hook.editor();
        const toolbarButtonSelector = '[data-mce-name="dialog-footer-button"]';
        TinyUiActions.clickOnToolbar(editor, toolbarButtonSelector);
        await TinyUiActions.pWaitForDialog(editor);
        const buttonSelector = '[data-mce-name="close"]';
        await pAssertTooltip(editor, () => test.pTriggerTooltip(editor, buttonSelector), 'Close');
        await pCloseTooltip(editor, buttonSelector);
        TinyUiActions.closeDialog(editor);
      });
    });

    context('Bespoke buttons', () => {
      const hook = TinyHooks.bddSetup<Editor>({
        base_url: '/project/tinymce/js/tinymce',
        toolbar: 'fontsizeinput fontsize fontfamily align styles blocks',
      });

      it(`TINY-10453: Should trigger tooltip with ${test.label} - fontsizeinput - Decrease font size`, async () => {
        const editor = hook.editor();
        const buttonSelector = '[data-mce-name="fontsizeinput"] > [data-mce-name="minus"]';
        await pAssertTooltip(editor, () => test.pTriggerTooltip(editor, buttonSelector), 'Decrease font size');
        await pCloseTooltip(editor, buttonSelector);
      });

      it(`TINY-10453: Should trigger tooltip with ${test.label} - fontsizeinput - Increase font size`, async () => {
        const editor = hook.editor();
        const buttonSelector = '[data-mce-name="fontsizeinput"] > [data-mce-name="plus"]';
        await pAssertTooltip(editor, () => test.pTriggerTooltip(editor, buttonSelector), 'Increase font size');
        await pCloseTooltip(editor, buttonSelector);
      });
      it(`TINY-10453: Should trigger tooltip with ${test.label} - fontsize`, async () => {
        const editor = hook.editor();
        const buttonSelector = 'button[data-mce-name="fontsize"]';
        await pAssertTooltip(editor, () => test.pTriggerTooltip(editor, buttonSelector), 'Font size 12pt');
        await pCloseTooltip(editor, buttonSelector);
      });

      it(`TINY-10453: Should trigger tooltip with ${test.label} - fontfamily`, async () => {
        const editor = hook.editor();
        const buttonSelector = 'button[data-mce-name="fontfamily"]';
        await pAssertTooltip(editor, () => test.pTriggerTooltip(editor, buttonSelector), 'Font System Font');
        await pCloseTooltip(editor, buttonSelector);
      });

      it(`TINY-10453: Should trigger tooltip with ${test.label} - align`, async () => {
        const editor = hook.editor();
        const buttonSelector = 'button[data-mce-name="align"]';
        await pAssertTooltip(editor, () => test.pTriggerTooltip(editor, buttonSelector), 'Alignment left');
        await pCloseTooltip(editor, buttonSelector);
      });

      it(`TINY-10453: Should trigger tooltip with ${test.label} - blocks`, async () => {
        const editor = hook.editor();
        const buttonSelector = 'button[data-mce-name="blocks"]';
        await pAssertTooltip(editor, () => test.pTriggerTooltip(editor, buttonSelector), 'Block Paragraph');
        await pCloseTooltip(editor, buttonSelector);
      });

      it(`TINY-10453: Should trigger tooltip with ${test.label} - styles`, async () => {
        const editor = hook.editor();
        const buttonSelector = 'button[data-mce-name="styles"]';
        await pAssertTooltip(editor, () => test.pTriggerTooltip(editor, buttonSelector), 'Format Paragraph');
        await pCloseTooltip(editor, buttonSelector);
      });
    });

    context('Resize handle', () => {
      const hook = TinyHooks.bddSetup<Editor>({
        base_url: '/project/tinymce/js/tinymce',
        resize: 'both'
      });

      it(`TINY-10453: Should trigger tooltip with ${test.label} - resize handle`, async () => {
        const editor = hook.editor();
        const buttonSelector = 'div[data-mce-name="resize-handle"]';
        await pAssertTooltip(editor, () => test.pTriggerTooltip(editor, buttonSelector), 'Resize');
        await pCloseTooltip(editor, buttonSelector);
      });
    });

    context('overflow-button', () => {
      const hook = TinyHooks.bddSetup<Editor>({
        toolbar: Arr.range(25, Fun.constant('bold | italic | test-button')).join(' '),
        toolbar_mode: 'floating',
        setup: (ed: Editor) => {
          ed.ui.registry.addButton('test-button', {
            text: 'Test Button for Overflow Button',
            onAction: Fun.noop
          });
        },
        base_url: '/project/tinymce/js/tinymce'
      });

      it(`TINY-10453: Should trigger tooltip with ${test.label} - overflow more button`, async () => {
        const editor = hook.editor();
        const buttonSelector = 'button[data-mce-name="overflow-button"]';
        await pAssertTooltip(editor, () => test.pTriggerTooltip(editor, buttonSelector), 'Reveal or hide additional toolbar items');
        await pCloseTooltip(editor, buttonSelector);
      });
    });

    context('No tooltip', () => {
      const hook = TinyHooks.bddSetup<Editor>({
        toolbar: 'split-button',
        toolbar_mode: 'floating',
        setup: (ed: Editor) => {
          ed.ui.registry.addSplitButton('split-button', {
            text: 'Split Button',
            tooltip: 'Split Button',
            fetch: (success) => {
              success([
                {
                  text: 'Choice item 1',
                  type: 'choiceitem',
                }
              ]);
            },
            onAction: Fun.noop,
            onItemAction: Fun.noop
          });
        },
        base_url: '/project/tinymce/js/tinymce'
      });

      it(`TINY-10453: Should not show tooltip with ${test.label} - Contains text and no icon`, async () => {
        const editor = hook.editor();
        const buttonSelector = 'div[data-mce-name="split-button"] > .tox-tbtn + .tox-split-button__chevron';
        await openMenu(editor, buttonSelector);
        const menuSelector = '[aria-label="Choice item 1"]';
        await pAssertNoTooltip(editor, () => test.pTriggerTooltip(editor, menuSelector), '');
        await closeMenu(menuSelector);
      });
    });
  });
});
