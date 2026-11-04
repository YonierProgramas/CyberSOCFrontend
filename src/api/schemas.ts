import { z } from 'zod';
const uuid = z.string().uuid();
const timestamp = z.string().datetime();
const displayName = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[^\u0000-\u001f\u007f-\u009f]+$/);
export const profileSchema = z.object({ displayName }).strict();
const timezone = z
  .string()
  .min(1)
  .max(100)
  .refine((value) => {
    return Intl.supportedValuesOf('timeZone').includes(value);
  });
export const preferencesSchema = z
  .object({
    locale: z.enum(['es-CO', 'es']),
    timezone,
    theme: z.enum(['system', 'light', 'dark']),
  })
  .strict();
export const purposeSchema = z.enum(['scan_summaries', 'report_storage']);
export const consentSchema = z
  .object({
    purpose: purposeSchema,
    granted: z.boolean(),
    policyVersion: z.string().min(1).max(40).nullable(),
    currentPolicyVersion: z.string().min(1).max(40),
    needsRenewal: z.boolean(),
    effective: z.boolean(),
    changedAt: timestamp.nullable(),
  })
  .strict();
export const consentsSchema = z
  .array(consentSchema)
  .length(2)
  .refine((items) => items[0]?.purpose !== items[1]?.purpose);
export const meSchema = z
  .object({
    userId: uuid,
    email: z.email().nullable(),
    profile: z.object({ displayName, createdAt: timestamp }).strict(),
    preferences: preferencesSchema,
    consents: consentsSchema,
  })
  .strict();
const size = z.number().int().min(1).max(2147483647);
const sha256 = z.string().regex(/^[a-f0-9]{64}$/);
export const releaseSchema = z
  .object({
    version: z.string().max(100),
    platform: z.literal('windows-x64'),
    publishedAt: timestamp,
    sizeBytes: size,
    sha256,
    sourceCommit: z.string().regex(/^[a-f0-9]{40}$/),
    notes: z.string().max(10000),
    requirements: z
      .object({ os: z.literal('Windows 10/11 x64'), admin: z.literal(false) })
      .strict(),
  })
  .strict();
export function acceptedDownloadUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const prefix = '/YonierProgramas/CyberSOC/releases/download/';
    const rest = url.pathname.slice(prefix.length);
    return (
      value.startsWith('https://github.com' + prefix) &&
      url.origin === 'https://github.com' &&
      url.username === '' &&
      url.password === '' &&
      url.search === '' &&
      url.hash === '' &&
      url.pathname.startsWith(prefix) &&
      rest.split('/').length === 2 &&
      rest.split('/').every((part) => {
        const decoded = decodeURIComponent(part);
        return (
          decoded.length > 0 &&
          decoded !== '.' &&
          decoded !== '..' &&
          !/[\\/\u0000-\u0020\u007f]/.test(decoded)
        );
      })
    );
  } catch {
    return false;
  }
}
export const downloadSchema = z
  .object({
    requestId: uuid,
    version: z.string().max(100),
    downloadUrl: z.string().url().refine(acceptedDownloadUrl),
    sizeBytes: size,
    sha256,
    notice: z.string().max(200),
  })
  .strict();
export const deviceSchema = z
  .object({
    deviceId: uuid,
    displayName,
    platform: z.literal('windows-x64'),
    appVersion: z.string().max(60),
    createdAt: timestamp,
    lastSeenAt: timestamp.nullable(),
    revokedAt: timestamp.nullable(),
  })
  .strict();
export const cursorSchema = z.string().regex(/^c1\.[A-Za-z0-9_-]{43}$/);
export const devicePageSchema = z
  .object({
    items: z.array(deviceSchema).max(100),
    nextCursor: cursorSchema.nullable(),
  })
  .strict();
export type Me = z.infer<typeof meSchema>;
export type PreferenceView = z.infer<typeof preferencesSchema>;
export type ConsentView = z.infer<typeof consentSchema>;
export type Purpose = z.infer<typeof purposeSchema>;
export type DevicePageView = z.infer<typeof devicePageSchema>;
export type ReleaseView = z.infer<typeof releaseSchema>;
export type DownloadView = z.infer<typeof downloadSchema>;
