import { withSentryConfig } from "@sentry/nextjs";
import createMDX from "@next/mdx";
import remarkGfm from "remark-gfm";
import ContentSecurityPolicy from "./csp.config.mjs";

import pkg from "./package.json" assert { type: "json" };

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [],
  },
});

const version = pkg.version;

/** @type {import('next').NextConfig} */
const moduleExports = {
  //basePath: process.env.NEXT_PUBLIC_BASE_PATH,
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
  reactStrictMode: true,
  output: "export",
  // experimental: {
  //   serverActions: {
  //     bodySizeLimit: "10mb",
  //   },
  // },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(woff2|webmanifest)$/,
      type: "asset/resource",
    });

    return config;
  },
  sentry: {
    //disableClientWebpackPlugin: true,
    //disableServerWebpackPlugin: true,
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
    NEXT_PUBLIC_APP_VERSION_COMMIT: process.env.GITHUB_SHA,
    CONTENT_SECURITY_POLICY: ContentSecurityPolicy,
  },
  transpilePackages: ["@codegouvfr/react-dsfr", "tss-react"],
};

export default withSentryConfig(
  {
    ...withMDX(withSentryConfig(moduleExports, { silent: true })),
  },
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    org: "betagouv",
    project: "template-nextjs",
    sentryUrl: "https://sentry.incubateur.net/",

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    // tunnelRoute: "/monitoring",

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
  }
);