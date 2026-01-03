# Yapock

[![Wolfbite Labs proof-of-concept project image](/.github/poc-landing.png)](https://labs.yipnyap.me/)

## Install

1. **Clone the repository:**

   ```bash
   git clone <url>
   ```

2. **Navigate to the project directory:**

   ```bash
   cd korat-hb
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

    - Sign up at [Clerk](https://clerk.com/) and create a new application.
    - In **Configure** > **User & Authentication**, ensure that "Email" and "Username" are enabled as sign-up and
      sign-in methods.
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

    - Create an R2 bucket using Cloudflare [In your R2 Dashboard](https://dash.cloudflare.com/?to=/:account/r2/overview)
      or another S3-compatible service.
    - Select `Create bucket`.
    - Enter a name for the bucket and select `Create bucket`.
    - Go to **Settings** > **General** and enable "Public Development URL".
    - Obtain your R2 credentials (Access Key ID, Secret Access Key, and Account ID).
    - Update the `.env` file with your R2 credentials and bucket information.

9. **Run the development server:**
   ```bash
   cd ../.. && bunx turbo dev
   # or, if same directory: bun dev
   ```