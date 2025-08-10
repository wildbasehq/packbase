# Yapock

[![Wolfbite Labs proof-of-concept project image](/.github/poc-landing.png)](https://labs.yipnyap.me/)

**THIS IS NOT PRODUCTION READY.** If you do run this, run it either air-gapped or in a sandbox network. Almost nothing is finished.

## Installation

You need [Bun](https://bun.sh/). On Windows, use WSL2.

Storage is up to you, and can be implemented with a plugin. The default is `MemoryBlockstore` which is lost on process exit. Supabase and Prisma are the only "officially" supported plugins by Wolfbite Labs.

```bash
# S1: Choose a storage provider, or none for memory.
# - supabase: https://supabase.io/
# - prisma: https://www.prisma.io/
# Switch with `bun storage <name>`:
bun storage prisma
# or bun storage @someone/some-plugin

# S2: Install dependencies
bun install

# S3: Run the server - There is no build step or "production mode" as of yet.
bun start
```
