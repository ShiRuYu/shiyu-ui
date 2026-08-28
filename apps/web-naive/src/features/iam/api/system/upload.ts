import { requestClient } from '#/shared/api/request';

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
  return requestClient.get<FileStorageConfig>('/api/iam/files/config');
}

export async function getFileList() {
  return requestClient.get<StoredFile[]>('/api/iam/files/list');
}

export async function deleteFile(key: string) {
  return requestClient.delete<boolean>('/api/iam/files', {
    params: { key },
  });
}

export async function downloadFile(file: StoredFile) {
  const blob = await requestClient.download<Blob>('/api/iam/files/download', {
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
      '/api/iam/files/upload',
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
