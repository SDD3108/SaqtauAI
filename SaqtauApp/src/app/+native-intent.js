function withSearchAndHash(url) {
  return `${url.pathname || '/'}${url.search || ''}${url.hash || ''}`;
}

export function redirectSystemPath({ path }) {
  try {
    const url = new URL(path, 'saqtau://app');

    // Legacy/dev invite URLs currently returned by some backend deployments:
    // saqtau://family/invite/<token>
    if (
      url.protocol === 'saqtau:' &&
      url.hostname === 'family' &&
      url.pathname.startsWith('/invite/')
    ) {
      return `/family${url.pathname}${url.search || ''}${url.hash || ''}`;
    }

    // Production Universal Link:
    // https://links.saqtau.ai/family/invite/<token>
    if (
      (url.protocol === 'https:' || url.protocol === 'http:') &&
      url.hostname === 'links.saqtau.ai' &&
      url.pathname.startsWith('/family/invite/')
    ) {
      return withSearchAndHash(url);
    }

    return path;
  } catch {
    // Never throw from +native-intent; an invalid external URL should not crash the app.
    return '/';
  }
}
