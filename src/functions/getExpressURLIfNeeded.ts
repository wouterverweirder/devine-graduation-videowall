export const getExpressURLIfNeeded = (url: string): string => {
  // Check if the URL starts with 'http://' or 'https://'
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url; // Return the URL as is
  }

  const urlWithoutLeadingSlash = url.startsWith('/')
    ? url.slice(1) // Remove leading slash if present
    : url;
  
  // If it doesn't, prepend the Express server URL
  return `http://127.0.0.1/${urlWithoutLeadingSlash}`;
};