import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Issues are imported as modules, not routed as pages, so `pageExtensions`
  // stays at its default — an .mdx file never becomes a route by accident.
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
