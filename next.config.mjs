/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/tools/ni-store",
        destination: "/store",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cf.cjdropshipping.com" },
      { protocol: "https", hostname: "oss-cf.cjdropshipping.com" },
    ],
  },
};

export default nextConfig;
