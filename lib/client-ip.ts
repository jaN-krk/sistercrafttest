import { env } from '@store/runtime';

// Vercel overwrites x-forwarded-for; a caller-supplied Cloudflare header is
// untrusted there. Native Workers use Cloudflare's own connecting-IP header.
export function clientIp(request: Request) {
  const header = env.VERCEL === '1' ? 'x-forwarded-for' : 'cf-connecting-ip';
  return request.headers.get(header)?.split(',')[0]?.trim() || 'local';
}
