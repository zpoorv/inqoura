import { PRODUCT_API_TIMEOUT_MS } from '../constants/api';

const DEFAULT_USER_AGENT = 'Inqoura - Mobile - Version 1.1.1 - https://inqoura.web.app';

export async function fetchJsonWithTimeout<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PRODUCT_API_TIMEOUT_MS);

  const headers = new Headers(init?.headers);
  if (!headers.has('User-Agent')) {
    headers.set('User-Agent', DEFAULT_USER_AGENT);
  }

  try {
    const response = await fetch(url, {
      ...init,
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}.`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new TypeError('Request timed out.');
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
