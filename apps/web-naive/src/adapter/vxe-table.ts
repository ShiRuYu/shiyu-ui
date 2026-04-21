import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';
import type { Recordable } from '@vben/types';

import type { ComponentPropsMap, ComponentType } from './component';

import { h } from 'vue';

import { IconifyIcon } from '@vben/icons';
import {
  setupVbenVxeTable,
  useVbenVxeGrid as useGrid,
} from '@vben/plugins/vxe-table';
import { get } from '@vben/utils';

import { NButton, NImage, NPopconfirm, NSwitch, NTag } from 'naive-ui';

import { $t } from '#/locales';

import { useVbenForm } from './form';

setupVbenVxeTable({
  configVxeTable: (vxeUI) => {
    vxeUI.setConfig({
      grid: {
        align: 'center',
        border: false,
        columnConfig: {
          resizable: true,
        },
        minHeight: 180,
        formConfig: {
          // 全局禁用vxe-table的表单配置，使用formOptions
          enabled: false,
        },
        proxyConfig: {
          autoLoad: true,
          response: {
            result: 'items',
            total: 'total',
            list: 'items',
          },
          showActiveMsg: true,
          showResponseMsg: false,
        },
        round: true,
        showOverflow: true,
        size: 'small',
      } as VxeTableGridOptions,
    });

    /**
     * 解决vxeTable在热更新时可能会出错的问题
     */
    vxeUI.renderer.forEach((_item, key) => {
      if (key.startsWith('Cell')) {
        vxeUI.renderer.delete(key);
      }
    });

    // 表格配置项可以用 cellRender: { name: 'CellImage' },
    vxeUI.renderer.add('CellImage', {
      renderTableDefault(renderOpts, params) {
        const { props } = renderOpts;
        const { column, row } = params;
        return h(NImage, { src: row[column.field], ...props });
      },
    });

    // 表格配置项可以用 cellRender: { name: 'CellLink' },
    vxeUI.renderer.add('CellLink', {
      renderTableDefault(renderOpts) {
        const { props } = renderOpts;
        return h(
          NButton,
          { size: 'small', type: 'primary', quaternary: true },
          { default: () => props?.text },
        );
      },
    });

    // 单元格渲染：Tag 标签，支持自定义选项映射
    vxeUI.renderer.add('CellTag', {
      renderTableDefault({ options, props }, { column, row }) {
        const value = get(row, column.field);
        const tagOptions = options ?? [
          { color: 'success', label: $t('common.enabled'), value: 1 },
          { color: 'error', label: $t('common.disabled'), value: 0 },
        ];
        const tagItem = tagOptions.find((item: any) => item.value === value);
        const colorMap: Record<
          string,
          'default' | 'error' | 'info' | 'primary' | 'success' | 'warning'
        > = {
          default: 'default',
          error: 'error',
          processing: 'info',
          success: 'success',
          warning: 'warning',
        };
        const nType = colorMap[tagItem?.color ?? ''] ?? 'default';
        return h(
          NTag,
          { ...props, type: nType, size: 'small' },
          { default: () => tagItem?.label ?? value },
        );
      },
    });

    // 单元格渲染：Switch 开关
    vxeUI.renderer.add('CellSwitch', {
      renderTableDefault({ attrs, props }, { column, row }) {
        const loadingKey = `__loading_${column.field}`;
        const finallyProps = {
          checkedValue: 1,
          uncheckedValue: 0,
          ...props,
          value: row[column.field],
          loading: row[loadingKey] ?? false,
          'onUpdate:value': onChange,
        };
        async function onChange(newVal: any) {
          row[loadingKey] = true;
          try {
            const result = await attrs?.beforeChange?.(newVal, row);
            if (result !== false) {
              row[column.field] = newVal;
            }
          } finally {
            row[loadingKey] = false;
          }
        }
        return h(NSwitch, finallyProps);
      },
    });

    /**
     * 注册表格的操作按钮渲染器
     */
    vxeUI.renderer.add('CellOperation', {
      renderTableDefault({ attrs, options, props }, { column, row }) {
        const defaultProps = { size: 'small', quaternary: true, ...props };
        let justifyContent: string;
        switch (column.align) {
          case 'center': {
            justifyContent = 'center';
            break;
          }
          case 'left': {
            justifyContent = 'flex-start';
            break;
          }
          default: {
            justifyContent = 'flex-end';
            break;
          }
        }
        const presets: Recordable<Recordable<any>> = {
          delete: {
            text: true,
            type: 'error',
            label: $t('common.delete'),
          },
          edit: {
            text: true,
            label: $t('common.edit'),
          },
        };
        const operations: Array<Recordable<any>> = (
          options || ['edit', 'delete']
        )
          .map((opt: any) => {
            if (typeof opt === 'string') {
              return presets[opt]
                ? { code: opt, ...presets[opt], ...defaultProps }
                : { code: opt, text: true, label: opt, ...defaultProps };
            } else {
              return { ...defaultProps, ...presets[opt.code], ...opt };
            }
          })
          .map((opt: any) => {
            const optBtn: Recordable<any> = {};
            Object.keys(opt).forEach((key) => {
              optBtn[key] =
                typeof opt[key] === 'function' ? opt[key](row) : opt[key];
            });
            return optBtn;
          })
          .filter((opt: any) => opt.show !== false);

        function renderBtn(opt: Recordable<any>, listen = true) {
          return h(
            NButton,
            {
              ...opt,
              icon: undefined,
              label: undefined,
              onClick: listen
                ? () =>
                    attrs?.onClick?.({
                      code: opt.code,
                      row,
                    })
                : undefined,
            },
            {
              default: () => {
                const content: any[] = [];
                if (opt.icon) {
                  content.push(
                    h(IconifyIcon, { class: 'size-4', icon: opt.icon }),
                  );
                }
                content.push(opt.label ?? opt.text);
                return content;
              },
            },
          );
        }

        function renderConfirm(opt: Recordable<any>) {
          return h(
            NPopconfirm,
            {
              positiveText: $t('common.confirm'),
              negativeText: $t('common.cancel'),
              onPositiveClick: () => {
                attrs?.onClick?.({
                  code: opt.code,
                  row,
                });
              },
            },
            {
              default: () =>
                $t('ui.actionMessage.deleteConfirm', [
                  row[attrs?.nameField || 'name'],
                ]),
              trigger: () => renderBtn({ ...opt }, false),
            },
          );
        }

        const btns = operations.map((opt) =>
          opt.code === 'delete' ? renderConfirm(opt) : renderBtn(opt),
        );
        return h(
          'div',
          {
            class: 'flex gap-1 table-operations',
            style: { justifyContent },
          },
          btns,
        );
      },
    });

    // 这里可以自行扩展 vxe-table 的全局配置，比如自定义格式化
    // vxeUI.formats.add
  },
  useVbenForm,
});

export const useVbenVxeGrid = <T extends Record<string, any>>(
  ...rest: Parameters<typeof useGrid<T, ComponentType, ComponentPropsMap>>
) => useGrid<T, ComponentType, ComponentPropsMap>(...rest);

export type OnActionClickParams<T = Recordable<any>> = {
  code: string;
  row: T;
};
export type OnActionClickFn<T = Recordable<any>> = (
  params: OnActionClickParams<T>,
) => void;
export type * from '@vben/plugins/vxe-table';
