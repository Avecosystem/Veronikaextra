# Deployment Guide

This guide explains how to deploy the VERONIKAextra Images application to Render.

## Prerequisites

1. A Render account
2. The following environment variables configured in Render:

## Environment Variables

The following environment variables must be set in your Render service:

```bash
# Image Generation API
NEW_API_KEY=ddc-a4f-07842c4bb9ae4099b39833a26a4acf46
PROVIDER_MODEL=provider-4/imagen-3.5
API_ENDPOINT=https://api.a4f.co/v1/images/generations

# Application Settings
PUBLIC_APP_BASE_URL=https://your-app-name.onrender.com

# Database Settings
DATABASE_URL=file:/opt/render/project/src/prisma/dev.db
PRISMA_CLIENT_ENGINE_TYPE=library
```

## Deployment Steps

1. Fork this repository to your GitHub account
2. Go to Render Dashboard
3. Click "New+" and select "Web Service"
4. Connect your GitHub account and select your forked repository
5. Configure the service:
   - Name: `veronikaextra-images`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
6. Add the environment variables listed above
7. Click "Create Web Service"

## Health Check

Once deployed, you can check the health of your application by visiting:
`https://your-app-name.onrender.com/health`

## Troubleshooting

### Database Issues

If you encounter database connection issues:

1. Ensure `DATABASE_URL` is set correctly
2. Check that `PRISMA_CLIENT_ENGINE_TYPE` is set to `library`
3. Verify the database file path is accessible

### Authentication Issues

If authentication is not working:

1. Check that the database is properly initialized
2. Verify that the Prisma client can connect to the database
3. Ensure the JWT_SECRET is consistent (uses default if not set)

### API Issues

If image generation is not working:

1. Verify that `NEW_API_KEY` is set correctly
2. Check that `PROVIDER_MODEL` is set to `provider-4/imagen-3.5`
3. Confirm that `API_ENDPOINT` is set to `https://api.a4f.co/v1/images/generations`

## Manual Database Initialization

If the database is not initializing automatically, you can manually run:

```bash
npm run migrate
```

This will generate the Prisma client and ensure the database schema is up to date.