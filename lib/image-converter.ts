/**
 * Convert File objects to base64 strings for transmission
 */
export async function fileToBase64(file: File): Promise<{name: string; data: string}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        name: file.name,
        data: reader.result as string,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convert multiple File objects to base64 strings
 */
export async function filesToBase64Array(files: File[]): Promise<{name: string; data: string}[]> {
  return Promise.all(files.map(fileToBase64));
}