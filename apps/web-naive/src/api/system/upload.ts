import { requestClient } from '#/api/request';

export interface StoredFile {
  contentType: string;
  key: string;
  lastModified: string;
  name: string;
  size: number;
  storageType: string;
  url: string;
}

export interface FileStorageConfig {
  currentType: string;
  supportedTypes: string[];
}

interface UploadFileParams {
  file: File;
  onError?: (error: Error) => void;
  onProgress?: (progress: { percent: number }) => void;
  onSuccess?: (data: StoredFile, file: File) => void;
}

export async function getFileStorageConfig() {
  return requestClient.get<FileStorageConfig>('/v1/system/files/config');
}

export async function getFileList() {
  return requestClient.get<StoredFile[]>('/v1/system/files/list');
}

export async function deleteFile(key: string) {
  return requestClient.delete<boolean>('/v1/system/files', {
    params: { key },
  });
}

export async function downloadFile(file: StoredFile) {
  const blob = await requestClient.download<Blob>('/v1/system/files/download', {
    params: { key: file.key },
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file.name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function uploadFile({
  file,
  onError,
  onProgress,
  onSuccess,
}: UploadFileParams) {
  try {
    onProgress?.({ percent: 0 });
    const data = await requestClient.upload<StoredFile>(
      '/v1/system/files/upload',
      {
        file,
      },
    );
    onProgress?.({ percent: 100 });
    onSuccess?.(data, file);
    return data;
  } catch (error) {
    const normalized =
      error instanceof Error ? error : new Error(String(error));
    onError?.(normalized);
    throw normalized;
  }
}

/** @deprecated Use uploadFile. */
export const upload_file = uploadFile;
