import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/tokenize/jp',
        destination: 'http://127.0.0.1:8000/tokenize/jp',
      },
      {
        source: '/api/term/jp/:term',
        destination: 'http://127.0.0.1:8001/term/jp/:term',
      },
      {
        source: '/api/kanji/jp/:term',
        destination: 'http://127.0.0.1:8000/kanji/jp/:term',
      },
      {
        source: '/api/image/ocr',
        destination: 'http://127.0.0.1:8000/image/ocr',

      }
    ]
  },
};

export default nextConfig;
