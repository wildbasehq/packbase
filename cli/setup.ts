#!/usr/bin/env bun

/**
 * CLI Setup Script for Packbase Local Installation
 *
 * A guided installer that validates Docker availability, prompts for configuration options
 * (local MinIO or external S3, Rheo moderation), automates PostgreSQL and optional MinIO
 * container setup, opens browser for Clerk configuration, and initializes the complete
 * local Packbase environment.
 */

import {confirm, input, password, select} from '@inquirer/prompts'
import {$} from 'bun'
import {writeFileSync} from 'fs'
import open from 'open'
import {join} from 'path'
import tasuku, {type TaskFunction} from 'tasuku'

const WORKSPACE_ROOT = join(import.meta.dir, '..')
const SERVER_PATH = join(WORKSPACE_ROOT, 'apps/server')
const WEB_PATH = join(WORKSPACE_ROOT, 'apps/web')
const DEVCONTAINER_PATH = join(SERVER_PATH, 'prisma/devcontainer')

const sleep = (ms = 1000 * Math.random() + 900) =>
    new Promise((resolve) => setTimeout(resolve, ms))

interface SetupConfig {
    useS3Storage: boolean;
    storageType?: 'minio' | 'external';
    s3Endpoint?: string;
    s3Region?: string;
    s3AccessKey?: string;
    s3SecretKey?: string;
    s3BucketProfiles?: string;
    s3BucketPacks?: string;
    rheoEnabled: boolean;
    rheoEndpoint?: string;
    rheoApiKey?: string;
    hostname: string;
    clerkPublishableKey: string;
    clerkSecretKey: string;
}

async function checkDockerAvailability(task: (title: string, func: TaskFunction<void>) => any) {
    return task('Checking docker', async ({setTitle, setError}) => {
        try {
            const result = await $`docker --version`.quiet()

            if (result.exitCode === 0) {
                setTitle('Docker is usable!')
            } else {
                setError('Docker is installed but can\'t be accessed.')
                await sleep(1000)
                process.exit(1)
            }
        } catch {
            setError('Docker wasn\'t found, or cannot be accessed properly.')
            await sleep(1000)
            process.exit(1)
        }
    })
}

function installDependencies(task: (title: string, func: TaskFunction<void>) => any) {
    return task('Installing workspace dependencies', async ({setTitle}) => {
        await $`bun install`.cwd(WORKSPACE_ROOT).quiet()
        setTitle('✓ Workspace dependencies installed')
    })
}

async function promptStorageConfiguration(config: SetupConfig): Promise<void> {
    config.useS3Storage = await confirm({
        message: 'Do you want to use S3 storage for files?',
        default: true,
    })

    if (config.useS3Storage) {
        config.storageType = await select({
            message: 'Choose storage provider:',
            choices: [
                {name: 'MinIO (local Docker container)', value: 'minio'},
                {name: 'External S3 provider', value: 'external'},
            ],
        })

        if (config.storageType === 'external') {
            config.s3Endpoint = await input({
                message: 'S3 Endpoint URL:',
                default: 'https://s3.amazonaws.com',
            })

            config.s3Region = await input({
                message: 'S3 Region:',
                default: 'us-east-1',
            })

            config.s3AccessKey = await input({
                message: 'S3 Access Key:',
                validate: (value) => value.length > 0 || 'Access key is required',
            })

            config.s3SecretKey = await password({
                message: 'S3 Secret Key:',
                mask: '*',
            })

            config.s3BucketProfiles = await input({
                message: 'S3 Bucket for profiles:',
                default: 'profiles',
            })

            config.s3BucketPacks = await input({
                message: 'S3 Bucket for packs:',
                default: 'packs',
            })
        } else {
            // MinIO default configuration
            config.s3Endpoint = 'http://localhost:9000'
            config.s3Region = 'us-east-1'
            config.s3AccessKey = 'minioadmin'
            config.s3SecretKey = 'minioadmin'
            config.s3BucketProfiles = 'profiles'
            config.s3BucketPacks = 'packs'
        }
    }
}

async function promptAdditionalConfiguration(config: SetupConfig): Promise<void> {
    config.rheoEnabled = await confirm({
        message: 'Enable Rheo moderation?',
        default: false,
    })

    if (config.rheoEnabled) {
        config.rheoEndpoint = await input({
            message: 'Rheo API Endpoint:',
            validate: (value) => value.length > 0 || 'Rheo endpoint is required',
        })

        config.rheoApiKey = await password({
            message: 'Rheo API Key:',
            mask: '*',
        })
    }

    config.hostname = await input({
        message: 'Target hostname:',
        default: 'http://localhost:8000',
    })

    console.log('\n📋 Opening Clerk dashboard in your browser...')
    console.log('Please create a new application or use an existing one to get your keys.\n')

    await open('https://clerk.com')

    await new Promise((resolve) => setTimeout(resolve, 2000))

    config.clerkPublishableKey = await input({
        message: 'Clerk Publishable Key:',
        validate: (value) => value.startsWith('pk_') || 'Must start with \'pk_\'',
    })

    config.clerkSecretKey = await password({
        message: 'Clerk Secret Key:',
        mask: '*',
    })
}

function startPostgresContainer(task: (title: string, func: TaskFunction<void>) => any) {
    return task('Starting PostgreSQL container', async ({setTitle, setStatus}) => {
        setStatus('Launching container...')

        await $`docker compose up -d`.cwd(DEVCONTAINER_PATH).quiet()

        setStatus('Waiting for health check...')

        // Wait for PostgreSQL to be ready
        let retries = 30
        while (retries > 0) {
            try {
                const result = await $`docker exec postgres-dev pg_isready -U postgres`.quiet()
                if (result.exitCode === 0) {
                    break
                }
            } catch {
            }

            await new Promise((resolve) => setTimeout(resolve, 1000))
            retries--
        }

        if (retries === 0) {
            throw new Error('PostgreSQL failed to start')
        }

        setTitle('✓ PostgreSQL container running')
    })
}

function startMinIOContainer(task: (title: string, func: TaskFunction<void>) => any, config: SetupConfig) {
    return task('Starting MinIO container', async ({setTitle, setStatus}) => {
        setStatus('Checking for existing container...')

        // Check if MinIO container already exists
        const existingContainer = await $`docker ps -a --filter name=minio-dev --format {{.Names}}`.text()

        if (existingContainer.includes('minio-dev')) {
            setStatus('Starting existing container...')
            await $`docker start minio-dev`.quiet()
        } else {
            setStatus('Creating and starting container...')
            await $`docker run -d \
        --name minio-dev \
        -p 9000:9000 \
        -p 9001:9001 \
        -e MINIO_ROOT_USER=minioadmin \
        -e MINIO_ROOT_PASSWORD=minioadmin \
        -v minio_data:/data \
        minio/minio server /data --console-address ":9001"`.quiet()
        }

        setStatus('Waiting for MinIO to be ready...')

        // Wait for MinIO to be ready
        let retries = 30
        while (retries > 0) {
            try {
                const response = await fetch('http://localhost:9000/minio/health/live')
                if (response.ok) {
                    break
                }
            } catch {
            }

            await new Promise((resolve) => setTimeout(resolve, 1000))
            retries--
        }

        if (retries === 0) {
            throw new Error('MinIO failed to start')
        }

        setStatus('Creating buckets...')

        // Install MinIO client if not present
        try {
            await $`docker exec minio-dev mc --version`.quiet()
        } catch {
            // mc should be included in the minio image
        }

        // Configure mc alias
        await $`docker exec minio-dev mc alias set local http://localhost:9000 minioadmin minioadmin`.quiet()

        // Create buckets
        for (const bucket of [config.s3BucketProfiles!, config.s3BucketPacks!]) {
            try {
                await $`docker exec minio-dev mc mb local/${bucket}`.quiet()
            } catch {
                // Bucket might already exist
            }

            // Set public policy
            await $`docker exec minio-dev mc anonymous set public local/${bucket}`.quiet()
        }

        setTitle('✓ MinIO container running with buckets created')
    })
}

function generateServerEnv(config: SetupConfig): string {
    const env: string[] = [
        '# Database Configuration',
        'DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres',
        'DIRECT_URL=postgresql://postgres:postgres@localhost:5432/postgres',
        '',
        '# Clerk Authentication',
        `CLERK_PUBLISHABLE_KEY=${config.clerkPublishableKey}`,
        `CLERK_SECRET_KEY=${config.clerkSecretKey}`,
        '',
        '# Server Configuration',
        `HOSTNAME=${config.hostname}`,
        'PORT=8000',
        '',
    ]

    if (config.useS3Storage) {
        env.push(
            '# S3 Storage Configuration',
            'STORAGE_PROVIDER=s3',
            `S3_ENDPOINT=${config.s3Endpoint}`,
            `S3_REGION=${config.s3Region}`,
            `S3_ACCESS_KEY=${config.s3AccessKey}`,
            `S3_SECRET_KEY=${config.s3SecretKey}`,
            `S3_PROFILES_BUCKET=${config.s3BucketProfiles}`,
            `S3_PACKS_BUCKET=${config.s3BucketPacks}`,
            `PROFILES_CDN_URL_PREFIX=${config.s3Endpoint}/${config.s3BucketProfiles}`,
            `PACKS_CDN_URL_PREFIX=${config.s3Endpoint}/${config.s3BucketPacks}`,
            '',
        )
    } else {
        env.push(
            '# NEED S3 CONFIG!!!',
            '',
        )
    }

    if (config.rheoEnabled) {
        env.push(
            '# Rheo Moderation',
            'RHEO_ENABLED=true',
            `AGENT_INFERENCE_API_ENDPOINT=${config.rheoEndpoint}`,
            `AGENT_INFERENCE_API_KEY=${config.rheoApiKey}`,
            '',
        )
    }

    return env.join('\n')
}

function generateWebEnv(config: SetupConfig): string {
    const env: string[] = [
        '# Clerk Authentication',
        `VITE_CLERK_PUBLISHABLE_KEY=${config.clerkPublishableKey}`,
        '',
        '# API Configuration',
        `VITE_YAPOCK_URL=${config.hostname}`,
        '',
    ]

    return env.join('\n')
}

async function generateEnvironmentFiles(config: SetupConfig): Promise<void> {
    await tasuku('Generating environment files', async ({setTitle}) => {
        const serverEnv = generateServerEnv(config)
        const webEnv = generateWebEnv(config)

        writeFileSync(join(SERVER_PATH, '.env'), serverEnv)
        writeFileSync(join(WEB_PATH, '.env'), webEnv)

        setTitle('✓ Environment files created')
    })
}

async function initializeDatabase(): Promise<void> {
    await tasuku('Initializing database', async ({setTitle, setStatus}) => {
        setStatus('Running Prisma migrations...')

        await $`bunx prisma db push`.cwd(SERVER_PATH).quiet()

        setTitle('✓ Database initialized')
    })
}

function displaySummary(config: SetupConfig): void {
    console.log('\n')
    console.log('📦 Next Steps:\n')
    console.log('  1. Start the development servers:')
    console.log('     → bun dev')
    console.log('     → or: bunx turbo dev')
    console.log('\n')

    if (config.storageType === 'minio') {
        console.log('  2. Access MinIO Console:')
        console.log('     → URL: http://localhost:9001')
        console.log('     → Username: minioadmin')
        console.log('     → Password: minioadmin')
        console.log('\n')
    } else if (config.storageType === 'external') {
        console.log('  2. ⚠️  Remember to create buckets in your S3 provider:')
        console.log(`     → ${config.s3BucketProfiles}`)
        console.log(`     → ${config.s3BucketPacks}`)
        console.log('\n')
    }

    console.log('  3. Access your application:')
    console.log(`     → ${config.hostname}`)
    console.log('\n')

    if (config.rheoEnabled) {
        console.log('  ℹ️  Rheo moderation is enabled')
        console.log('\n')
    }

    console.log('📚 Documentation:')
    console.log('  → Server: apps/server/README.md')
    console.log('  → Web: apps/web/README.md')
    console.log('\n')
}

async function main() {
    console.clear()

    await tasuku.group(task => [
        checkDockerAvailability(task),
        installDependencies(task)
    ])

    // Step 3: Collect configuration
    const config: SetupConfig = {
        useS3Storage: false,
        rheoEnabled: false,
        hostname: '',
        clerkPublishableKey: '',
        clerkSecretKey: '',
    }

    await promptStorageConfiguration(config)

    await promptAdditionalConfiguration(config)

    await tasuku.group((task) => [
        startPostgresContainer(task),
        ...(config.storageType === 'minio' ? [startMinIOContainer(task, config)] : [])
    ])

    // Step 5: Generate environment files
    await generateEnvironmentFiles(config)

    // Step 6: Initialize database
    await initializeDatabase()

    // Step 7: Display summary
    displaySummary(config)
}

main().catch((error) => {
    console.error('\n❌ Setup failed:', error.message)
    process.exit(1)
})