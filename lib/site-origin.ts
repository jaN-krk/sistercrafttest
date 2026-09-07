import {env} from '@store/runtime';
export const siteOrigin = String(env.APP_ORIGIN || 'https://sistercrafttest.vercel.app').replace(/\/$/, '');
