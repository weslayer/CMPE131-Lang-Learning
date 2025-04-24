# Language Learning Frontend

## Environment Setup

This project uses environment variables for configuration. To set up your environment:

1. Create a `.env` file in the root of the frontend directory with the following variables:

```
# MongoDB credentials
DB_USERNAME=your_actual_username
DB_PASSWORD=your_actual_password

# Dictionary server URL
DICTIONARY_SERVER=http://127.0.0.1:8000
```

2. Replace the placeholder values with your actual credentials.

3. Make sure the `.env` file is listed in `.gitignore` to prevent committing sensitive information.

## Development

To run the development server:

```bash
npm run dev
# or
yarn dev
```

## Building for Production

To build the application for production:

```bash
npm run build
# or
yarn build
```

## Running Tests

To run tests:

```bash
npm test
# or
yarn test
```

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
