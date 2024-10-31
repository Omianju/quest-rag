/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source : "/sign-in",
        destination : "/api/auth/login",
        permanent : true
      },
      {
        source : "/signup",
        destination : "/api/auth/register",
        permanent : true
      }
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gravatar.com',
        port: '',
        pathname: '/avatar/**',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;

    return config;
  },
};

export default nextConfig;
