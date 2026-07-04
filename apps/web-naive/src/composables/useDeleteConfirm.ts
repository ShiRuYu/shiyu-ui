import { message } from '#/adapter/naive';
import { $t } from '#/locales';

export function useDeleteConfirm<T extends { [key: string]: any; id: number; }>(
  deleteFn: (id: number) => Promise<any>,
  options?: {
    loadingText?: string;
    nameField?: keyof T;
    onSuccess?: () => void;
    successText?: string;
  },
) {
  const {
    nameField = 'name' as keyof T,
    onSuccess,
    loadingText,
    successText,
  } = options ?? {};

  return async (row: T) => {
    const h = message.loading(loadingText ?? $t('common.deleting'), {
      duration: 0,
    });
    try {
      await deleteFn(row.id);
      message.success(
        successText ??
          $t('ui.actionMessage.deleteSuccess', [
            String(row[nameField] ?? row.id),
          ]),
      );
      onSuccess?.();
    } catch (err: any) {
      message.error(err?.message ?? $t('common.deleteFailed'));
    } finally {
      h.destroy();
    }
  };
}
