import type { NextConfig } from "next";
const configuredAuth=process.env.NEXT_PUBLIC_SUPABASE_URL??'',authOrigin=/^https:\/\/[-a-z0-9]+\.supabase\.co\/?$/.test(configuredAuth)?configuredAuth.replace(/\/$/,''):'';
const policy=`default-src 'self'; script-src 'self' 'unsafe-inline'${process.env.NODE_ENV==='development'?" 'unsafe-eval'":''}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' ${authOrigin}${process.env.NODE_ENV==='development'?' ws: wss:':''}; media-src 'self' blob:; worker-src 'self' blob:; frame-src 'none'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'`;
const config: NextConfig = {
  // Next dev otherwise logs action arguments, including private form contents.
  logging: { serverFunctions: false, browserToTerminal: false },
  distDir: process.env.PLUTO_TEST_OUTPUT === "true" ? ".next-tests" : ".next",
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "Permissions-Policy", value: `camera=(), microphone=${process.env.PLUTO_VOICE_ENABLED==='true'&&process.env.PLUTO_VOICE_COST_APPROVED==='approved'?'(self)':'()'}, geolocation=()` },
      { key: "Content-Security-Policy", value: policy },
      ...(process.env.NODE_ENV==='production'?[{key:'Strict-Transport-Security',value:'max-age=31536000'}]:[])
    ] }];
  }
};
export default config;
