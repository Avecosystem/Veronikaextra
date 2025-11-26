<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1xpK8DLUy_9bgPlL9z6fl7y7LfiArXVat

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `VITE_BYTEZ_API_KEY` in [.env.local](.env.local) to your Bytez API key
3. Run the app:
   `npm run dev`

## Deploy to Vercel

1. Push your code to a GitHub repository
2. Connect Vercel to your repository
3. In the Vercel dashboard, go to your project settings
4. Under "Environment Variables", add:
   - Key: `VITE_BYTEZ_API_KEY`
   - Value: Your Bytez API key (e.g., `15d3999b633fbcfca8abca0e3c875a3c`)
5. Deploy your project

## Deploy to Netlify

1. Push your code to a GitHub repository
2. Connect Netlify to your repository
3. In the Netlify dashboard, go to your site settings
4. Under "Environment Variables", add:
   - Key: `VITE_BYTEZ_API_KEY`
   - Value: Your Bytez API key (e.g., `15d3999b633fbcfca8abca0e3c875a3c`)
5. Deploy your site

## Detailed Deployment Guide

For more detailed deployment instructions, see [DEPLOYMENT.md](docs/DEPLOYMENT.md)

## Testing

You can test your environment variables with:
- `npm run test:env` - Test environment variable loading
- `npm run test:bytez` - Test Bytez API integration
- `npm run verify:build` - Verify the entire build process
- `npm run verify:env` - Verify environment variable configuration