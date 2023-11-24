import { envVariablesInstaller } from '~/installers/envVars.js'
import { nextAuthInstaller } from '~/installers/nextAuth.js'
import { prismaInstaller } from '~/installers/prisma.js'
import { tailwindInstaller } from '~/installers/tailwind.js'
import { trpcInstaller } from '~/installers/trpc.js'
import { type PackageManager } from '~/utils/getUserPkgManager.js'
import { drizzleInstaller } from './drizzle.js'

// Turning this into a const allows the list to be iterated over for programatically creating prompt options
// Should increase extensability in the future
export const availablePackages = ['nextAuth', 'prisma', 'drizzle', 'tailwind', 'trpc', 'envVariables'] as const
export type AvailablePackages = (typeof availablePackages)[number]

export interface InstallerOptions {
  projectDir: string
  pkgManager: PackageManager
  noInstall: boolean
  packages?: PkgInstallerMap
  appRouter?: boolean
  projectName: string
  scopedAppName: string
}

export type Installer = (opts: InstallerOptions) => void

export type PkgInstallerMap = {
  [pkg in AvailablePackages]: {
    inUse: boolean
    installer: Installer
  }
}

export const buildPkgInstallerMap = (packages: AvailablePackages[]): PkgInstallerMap => ({
  nextAuth: {
    inUse: packages.includes('nextAuth'),
    installer: nextAuthInstaller,
  },
  prisma: {
    inUse: packages.includes('prisma'),
    installer: prismaInstaller,
  },
  drizzle: {
    inUse: packages.includes('drizzle'),
    installer: drizzleInstaller,
  },
  tailwind: {
    inUse: packages.includes('tailwind'),
    installer: tailwindInstaller,
  },
  trpc: {
    inUse: packages.includes('trpc'),
    installer: trpcInstaller,
  },
  envVariables: {
    inUse: true,
    installer: envVariablesInstaller,
  },
})
