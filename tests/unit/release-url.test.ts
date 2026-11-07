import { expect, it } from 'vitest';
import { acceptedDownloadUrl } from '../../src/api/schemas';
const prefix = 'https://github.com/YonierProgramas/CyberSOC/releases/download/';
const cases: [string, boolean][] = [
  [prefix + 'v0.11.1/CyberSOC-Defender-0.11.1-windows-x64-setup.exe', true],
  [prefix + 'v1.0.0-rc.1+test/instalador-%C3%B1.exe', true],
  ...[
    'tag/subfolder/setup.exe',
    'tag/',
    '/setup.exe',
    '../tag/setup.exe',
    'tag/../setup.exe',
    'tag/%2e%2e',
    'tag/%2Fbad.exe',
    'tag/%5cbad.exe',
    'tag/%252Fbad.exe',
    'tag/%00bad.exe',
    'tag/%C2%85bad.exe',
    'tag/bad%20name.exe',
    'tag/bad%.exe',
    'tag/setup.exe?next=evil',
    'tag/setup.exe#x',
    'tag/a\\b.exe',
    'tag/setup.exe?',
    'tag/setup.exe#',
  ].map((path): [string, boolean] => [prefix + path, false]),
  [prefix.replace('https:', 'http:') + 'tag/a.exe', false],
  [prefix.replace('github.com', 'github.com:443') + 'tag/a.exe', false],
  [prefix.replace('github.com', 'other.invalid') + 'tag/a.exe', false],
  [prefix.replace('CyberSOC/', 'Other/') + 'tag/a.exe', false],
];
it.each(cases)('AUD-08: %s => %s', (url, valid) => {
  expect(acceptedDownloadUrl(url)).toBe(valid);
});
