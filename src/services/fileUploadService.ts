import type { CopilotFileAttachment } from '../lib/llm/types';

export interface UploadResponse {
  success: boolean;
  file?: CopilotFileAttachment;
  error?: string;
}

export const uploadCopilotFile = async (file: File): Promise<UploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/files/upload', {
      method: 'POST',
      body: formData,
      // Note: In a real app, you'd include auth headers here
      // But the project usually handles this via session cookies or interceptors
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || errorData.error || `Upload failed with status ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      file: data as CopilotFileAttachment,
    };
  } catch (error) {
    console.error('File upload error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred during upload',
    };
  }
};
