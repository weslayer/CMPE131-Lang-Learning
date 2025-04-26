import type { NextConfig } from "next";
import { DICTIONARY_SERVER } from "./src/config";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },
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
        source: '/api/term/cn/:term',
        destination: `${DICTIONARY_SERVER}/term/cn/:term`,
      },
      {
        source: '/api/kanji/jp/:term',
        destination: `${DICTIONARY_SERVER}/kanji/jp/:term`,
      },
      {
        source: '/api/image/ocr',
        destination: `${DICTIONARY_SERVER}/image/ocr`,
      },
      {
        source: '/api/user/decks',
        destination: `${DICTIONARY_SERVER}/user/decks`,
      },
      {
        source: '/api/user/default-deck',
        destination: `${DICTIONARY_SERVER}/user/default-deck`,
      },
      {
        source: '/api/decks/:deck/flashcards',
        destination: `${DICTIONARY_SERVER}/decks/:deck/flashcards`,
      }
    ]
  },
};

export default nextConfig;
