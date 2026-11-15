// Saves a Blob as a file in the browser
export function downloadBlob(blob, fileName) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Release the object URL after the download has started
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}

// When the API returns an error for a blob request, the message is inside the blob
export async function getBlobErrorMessage(error, fallback) {
  try {
    const data = error?.response?.data;

    if (data instanceof Blob) {
      const text = await data.text();
      const parsed = JSON.parse(text);
      if (parsed?.message) return parsed.message;
    } else if (data?.message) {
      return data.message;
    }
  } catch {
    // Ignore parsing problems and use the fallback message
  }

  return fallback;
}