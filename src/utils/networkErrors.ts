export const DEFAULT_NETWORK_ERROR_MESSAGE =
  'No internet connection. Check your internet and try again.';

function normalizeErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message.toLowerCase();
  }

  if (typeof error === 'string') {
    return error.toLowerCase();
  }

  return '';
}

export function isLikelyNetworkError(error: unknown) {
  const message = normalizeErrorMessage(error);

  if (!message) {
    return false;
  }

  return (
    error instanceof TypeError ||
    message.includes('network request failed') ||
    message.includes('failed to fetch') ||
    message.includes('fetch failed') ||
    message.includes('timed out') ||
    message.includes('timeout') ||
    message.includes('unable to resolve host') ||
    message.includes('no address associated with hostname') ||
    message.includes('networkerror') ||
    message.includes('offline')
  );
}
