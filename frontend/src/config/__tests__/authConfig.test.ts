import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('authConfig', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('exposes the configured Google client ID', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id');
    vi.stubEnv('VITE_GOOGLE_HOSTED_DOMAIN', '3styk.com');
    const { GOOGLE_CLIENT_ID } = await import('../../config/authConfig');
    expect(GOOGLE_CLIENT_ID).toBe('test-client-id');
  });

  it('defaults the hosted domain to 3styk.com when unset', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id');
    vi.stubEnv('VITE_GOOGLE_HOSTED_DOMAIN', '');
    const { GOOGLE_HOSTED_DOMAIN } = await import('../../config/authConfig');
    expect(GOOGLE_HOSTED_DOMAIN).toBe('3styk.com');
  });
});
