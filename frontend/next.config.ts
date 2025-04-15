import type { NextConfig } from "next";

const DICTIONARY_SERVER = "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/tokenize/jp',
        destination: `${DICTIONARY_SERVER}/tokenize/jp`,
      },
      {
        source: '/api/tokenize/cn',
        destination: `${DICTIONARY_SERVER}/tokenize/cn`,
      },
      {
        source: '/api/term/jp/:term',
        destination: `${DICTIONARY_SERVER}/term/jp/:term`,
      },
      {
        source: '/api/kanji/jp/:term',
        destination: `${DICTIONARY_SERVER}/kanji/jp/:term`,
      },
      {
        source: '/api/image/ocr',
        destination: `${DICTIONARY_SERVER}/image/ocr`,

      }
    ]
  },
};

export default nextConfig;
