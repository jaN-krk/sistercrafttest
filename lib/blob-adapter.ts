import { put, get, head, list, BlobNotFoundError } from '@vercel/blob';

// Preserve the store's existing /api/media URLs and upload validation.
// Vercel authenticates this store through its project-scoped OIDC connection.
export const blobMedia = {
  async put(key: string, bytes: Uint8Array, options: { httpMetadata?: { contentType?: string } }) {
    return put(key, bytes, {
      access: 'public', addRandomSuffix: false, allowOverwrite: false,
      contentType: options.httpMetadata?.contentType,
      cacheControlMaxAge: 31536000,
    });
  },
  async head(key: string) {
    try { return await head(key); }
    catch (error) { if (error instanceof BlobNotFoundError) return null; throw error; }
  },
  async get(key: string) {
    const object = await get(key, { access: 'public' });
    if (!object || object.statusCode !== 200) return null;
    return { body: object.stream, httpMetadata: { contentType: object.blob.contentType } };
  },
  async list(options: { prefix?: string; cursor?: string; limit?: number }) {
    const page = await list(options);
    return {
      objects: page.blobs.map(blob => ({ key: blob.pathname, size: blob.size, uploaded: blob.uploadedAt })),
      truncated: page.hasMore, cursor: page.cursor,
    };
  },
};
