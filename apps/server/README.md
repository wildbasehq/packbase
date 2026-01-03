# Yapock

[![Wolfbite Labs proof-of-concept project image](/.github/poc-landing.png)](https://labs.yipnyap.me/)

## Install

1. **Clone the repository.**

2. **Navigate to the project directory:**

   ```bash
   cd packbase
   ```

3. **Install dependencies:**

   ```bash
   bun install
   ```

4. **Go to the server directory:**

   ```bash
   cd apps/server
   ```

5. **Copy the example environment file:**

   ```bash
   cp .env.example .env
   ```

6. **Create a Clerk Account:**

    - Sign up at [Clerk](https://clerk.com/) and create a new application. Ensure that "Email" and "Username" are
      enabled as sign-up and sign-in methods.
    - Obtain your Clerk API keys from the `development` environment and update the `.env` file with these keys (usually
      found in **Configure** > **API Keys**).
    - (Optionally) Go to **Configure** > **Settings** and enable Test Mode for easier testing during development. If
      this is on, only use the test credentials provided by Clerk.

7. **Setup PostgreSQL Database:**

    - Install PostgreSQL via the container in `apps/server/prisma/devcontainer` or use another service.
    - Update the `DATABASE_URL` and `DIRECT_URL` in the `.env` file with your database connection string.
    - Run the following command to set up the database schema:

      ```bash
      bunx prisma db push
      ```

8. **Setup an R2 Bucket:**

    - Create an R2 bucket using
      Cloudflare [In your R2 Dashboard > "Create bucket"](https://dash.cloudflare.com/?to=/:account/r2/overview)
      or another S3-compatible service.
    - Enter a name for the **[profiles | packs]** bucket and select `Create bucket`.
    - Go to **Settings** > **General** and enable "Public Development URL".
    - Obtain your R2 credentials as per [Cloudflare's Documentation](https://developers.cloudflare.com/r2/api/tokens/).
    - Update the `.env` file with your R2 credentials and bucket information, with `PROFILES_CDN_URL_PREFIX` or
      `PACKS_CDN_URL_PREFIX` set to their respective public URLs.
    - Repeat for the **packs** bucket.
        - Your S3 credentials stay the same for both buckets; only the bucket name and URL prefix change.

9. **Set your hostname**:

    - In the `.env` file, set the `HOSTNAME` variable to the URL where your server will be accessible (e.g.,
      `http://localhost:8000` for local development).

10. **Run the development server:**
   ```bash
   bun dev
   # or, if running the UI as well, from the project root:
   # bunx turbo dev
   ```