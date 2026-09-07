declare module '@store/runtime' {
  export const env: Record<string, unknown> & { DB?: D1Database; MEDIA?: R2Bucket };
}
declare module '*.sql?raw' {
  const sql: string;
  export default sql;
}
