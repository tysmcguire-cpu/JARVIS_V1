import type { NextConfig } from "next";
const config: NextConfig = {
  // Next dev otherwise logs action arguments, including private form contents.
  logging: { serverFunctions: false, browserToTerminal: false },
  distDir: process.env.JARVIS_TEST_OUTPUT === "true" ? ".next-tests" : ".next",
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" }
    ] }];
  }
};
export default config;
