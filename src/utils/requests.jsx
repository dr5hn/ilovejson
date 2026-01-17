// Default options are marked with *
const defaultOptions = {
  mode: 'cors', // no-cors, *cors, same-origin
  cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
  credentials: 'same-origin', // include, *same-origin, omit
  redirect: 'follow', // manual, *follow, error
  referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
};

export const getData = async (url = '') => {
  const response = await fetch(url, {
    method: 'GET',
    ...defaultOptions
  });
  return response.json();
}

export const postFile = async (url = '', data = {}) => {
  const response = await fetch(url, {
    method: 'POST',
    ...defaultOptions,
    body: data
  });
  return response.json(); // parses JSON response into native JavaScript objects
}

export const postData = async (url = '', data = {}) => {
  const response = await fetch(url, {
    method: 'POST',
    ...defaultOptions,
    body: data
  });
  return response.json(); // parses JSON response into native JavaScript objects
}

/**
 * Post file with upload progress tracking
 * Uses XMLHttpRequest to track upload progress (fetch doesn't support this)
 *
 * @param {string} url - URL to post to
 * @param {FormData} formData - Form data with file
 * @param {Function} onProgress - Progress callback: ({ stage, progress, loaded, total })
 * @returns {Promise<Object>} - Parsed JSON response
 */
export const postFileWithProgress = (url, formData, onProgress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress({
          stage: 'upload',
          progress,
          loaded: event.loaded,
          total: event.total
        });
      }
    });

    // Handle upload complete - now processing on server
    xhr.upload.addEventListener('load', () => {
      if (onProgress) {
        onProgress({
          stage: 'processing',
          progress: 100,
          message: 'Converting your file...'
        });
      }
    });

    // Handle response
    xhr.addEventListener('load', () => {
      try {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          if (onProgress) {
            onProgress({
              stage: 'complete',
              progress: 100
            });
          }
          resolve(response);
        } else {
          reject(new Error(response.error || response.message || `HTTP ${xhr.status}`));
        }
      } catch (e) {
        reject(new Error('Invalid response from server'));
      }
    });

    // Handle errors
    xhr.addEventListener('error', () => {
      reject(new Error('Network error occurred'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'));
    });

    xhr.addEventListener('timeout', () => {
      reject(new Error('Upload timed out'));
    });

    // Open and send
    xhr.open('POST', url);
    xhr.timeout = 600000; // 10 minute timeout for large files
    xhr.send(formData);
  });
}
