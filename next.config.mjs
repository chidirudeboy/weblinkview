/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["africartz.s3.eu-north-1.amazonaws.com"], // Allow images from this S3 bucket
  },
};

export default nextConfig;