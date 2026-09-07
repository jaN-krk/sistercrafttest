import {env} from '@store/runtime';

export function mailConfig() {
  const provider:'mailersend'|'resend' = env.EMAIL_PROVIDER === 'mailersend' ? 'mailersend' : 'resend';
  const key = String((provider === 'mailersend' ? env.MAILERSEND_API_KEY : env.RESEND_API_KEY) || '');
  const from = String(env.EMAIL_FROM || '');
  const testMode = env.EMAIL_TEST_MODE === 'true' || /@[^>\s]*\.(?:mailersend\.(?:net|com)|mlsender\.net)>?$/i.test(from);
  const recipients = String(env.EMAIL_TEST_RECIPIENTS || env.STORE_NOTIFICATION_EMAIL || '').split(',').map(v=>v.trim().toLowerCase()).filter(Boolean);
  return {provider,key,from,testMode,recipients,configured:!!(key&&from)};
}
