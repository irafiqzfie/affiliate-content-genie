This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Affiliate Content Genie

An AI-powered content generation tool for creating affiliate marketing content from Shopee product links. Supports automated content generation, image creation, and direct posting to Facebook and Threads.

## Features

- 🎨 **AI Content Generation**: Generate video scripts and social media posts from product links
- 🖼️ **Image Generation**: Create product images using Stability AI and Replicate
- 📱 **Social Media Integration**: Direct posting to Facebook and Threads
- 🗓️ **Content Scheduling**: Schedule posts for optimal timing
- 💾 **Content Management**: Save and manage generated content
- 🔐 **OAuth Authentication**: Secure Facebook and Threads login with NextAuth

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Google Gemini API Key (for content generation)
API_KEY=your_gemini_api_key

# Stability AI API Key (for image generation)
STABILITY_API_KEY=your_stability_api_key

# Replicate API Key (for image transformations)
REPLICATE_API_KEY=your_replicate_api_key

# Database (Prisma)
DATABASE_URL=your_postgres_connection_string

# Facebook OAuth
FACEBOOK_CLIENT_ID=your_facebook_app_id
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret

# Threads OAuth
THREADS_APP_ID=your_threads_app_id
THREADS_APP_SECRET=your_threads_app_secret

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

### Getting API Keys

1. **Google Gemini API**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **Stability AI**: Sign up at [Stability AI](https://platform.stability.ai/)
3. **Replicate**: Get API key from [Replicate](https://replicate.com/account/api-tokens)
4. **Facebook App**: Create at [Meta for Developers](https://developers.facebook.com/)
5. **Threads App**: Configure at [Meta for Developers](https://developers.facebook.com/)
6. **Database**: Use [Prisma Postgres](https://www.prisma.io/) or any PostgreSQL database

## Getting Started

First, install dependencies:

```bash
npm install
```

Set up the database:

```bash
npm run prisma:generate
npm run prisma:migrate
```

Run the development server:

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
