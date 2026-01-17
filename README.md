# I ❤️ JSON

## Prerequisites
Ensure you have the following installed:
- [NodeJS v22.x or higher](https://nodejs.org/en/download/)
- [Visual Studio Code](https://code.visualstudio.com/download)

## Getting Started

Installing Dependencies
To set up your environment, first install the necessary dependencies:
```bash
yarn
```

Run Server
To start the local server, run the following command:
```bash
yarn dev
```

Using Docker
Alternatively, you can use Docker to start the project. This is especially useful for ensuring a consistent environment:
```bash
docker-compose up
```

## Authentication Setup (Optional)

The application includes optional user authentication for tracking conversion history and saving files.

### 1. Set up PostgreSQL

You need a PostgreSQL database. Options:
- **Local**: Install PostgreSQL locally
- **Docker**: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password -e POSTGRES_DB=ilovejson postgres:16`
- **Cloud**: Use services like Supabase, Neon, or Railway

### 2. Configure Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` with your values:
```bash
# Database - your PostgreSQL connection string
DATABASE_URL="postgresql://postgres:password@localhost:5432/ilovejson?schema=public"

# NextAuth - generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-generated-secret"
NEXTAUTH_URL="http://localhost:3002"

# Google OAuth - get from https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

### 3. Set up OAuth Providers

You can configure one or multiple OAuth providers. At least one provider must be configured for authentication to work.

#### Option A: Google OAuth (Recommended for beginners)

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select an existing one
3. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
4. Set Application type to "Web application"
5. Add authorized redirect URI: `http://localhost:3002/api/auth/callback/google`
6. Copy the Client ID and Client Secret to your `.env` file:
   ```bash
   GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your-client-secret"
   ```

#### Option B: GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "OAuth Apps" → "New OAuth App"
3. Fill in the details:
   - **Application name**: iLoveJSON Local
   - **Homepage URL**: `http://localhost:3002`
   - **Authorization callback URL**: `http://localhost:3002/api/auth/callback/github`
4. Click "Register application"
5. Generate a new client secret
6. Copy the Client ID and Client Secret to your `.env` file:
   ```bash
   GITHUB_ID="your-github-client-id"
   GITHUB_SECRET="your-github-client-secret"
   ```

#### Option C: Microsoft OAuth (Azure AD / Entra ID)

1. Go to [Azure Portal - App Registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps)
2. Click "New registration"
3. Fill in the details:
   - **Name**: iLoveJSON
   - **Supported account types**: Choose based on your needs (use "Multitenant" for public apps)
   - **Redirect URI**: Select "Web" and enter `http://localhost:3002/api/auth/callback/azure-ad`
4. Click "Register"
5. Copy the "Application (client) ID" and "Directory (tenant) ID"
6. Go to "Certificates & secrets" → "New client secret"
7. Copy the secret **value** (not the ID)
8. Add to your `.env` file:
   ```bash
   MICROSOFT_CLIENT_ID="your-application-client-id"
   MICROSOFT_CLIENT_SECRET="your-client-secret-value"
   MICROSOFT_TENANT_ID="common"  # or your specific tenant ID
   ```

**Note**: You can configure all three providers simultaneously. Users will see all configured options on the sign-in page.

### 4. Run Database Migrations

```bash
# Generate Prisma client (if not already done)
yarn prisma generate

# Create and apply migrations
yarn prisma migrate dev --name init
```

### 5. Verify Setup

Start the dev server and visit http://localhost:3002. You should see a "Sign In" button in the header.

## Exploring the API
Once your server is up and running, you can access the sample API endpoint at:
http://localhost:3000/api/ilovejson
This endpoint demonstrates the functionality of the I ❤️ JSON tools in action.

### As always, thanks to our amazing contributors!
<a href="https://github.com/ilovejson/ilovejson/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=ilovejson/ilovejson&anon=1" />
</a>

Made with [contrib.rocks](https://contrib.rocks).

### Sponsors
<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/dr5hn/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/dr5hn/static/sponsors.svg'/>
  </a>
</p>

### Make the world more Greener 🌴
Contribute towards a better earth by [**buying the world a tree**](https://ecologi.com/darshangada?r=60f2a36e67efcb18f734ffb8).

### Follow me at
<a href="https://github.com/dr5hn/"><img alt="Github @dr5hn" src="https://img.shields.io/static/v1?logo=github&message=Github&color=black&style=flat-square&label=" /></a> 
<a href="https://twitter.com/dr5hn/"><img alt="Twitter @dr5hn" src="https://img.shields.io/static/v1?logo=twitter&message=Twitter&color=black&style=flat-square&label=" /></a> 
<a href="https://www.linkedin.com/in/dr5hn/"><img alt="LinkedIn @dr5hn" src="https://img.shields.io/static/v1?logo=linkedin&message=LinkedIn&color=black&style=flat-square&label=&link=https://twitter.com/dr5hn" /></a>

## Powered by Next.js

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
