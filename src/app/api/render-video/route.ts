import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export const maxDuration = 300;

let bundleLocation: string | null = null;

async function ensureBundled(): Promise<string> {
  if (bundleLocation) return bundleLocation;
  bundleLocation = await bundle({
    entryPoint: path.join(process.cwd(), 'src/remotion/index.ts'),
  });
  return bundleLocation;
}

export async function POST(request: Request) {
  try {
    const { title, screenTexts, duration } = await request.json();

    const serveUrl = await ensureBundled();
    const inputProps = { title, screenTexts, durationInSeconds: duration };

    const composition = await selectComposition({
      serveUrl,
      id: 'ShortVideo',
      inputProps,
    });

    const outputDir = path.join(process.cwd(), 'public', 'renders');
    fs.mkdirSync(outputDir, { recursive: true });

    const fileName = `render-${Date.now()}.mp4`;
    const outputLocation = path.join(outputDir, fileName);

    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      outputLocation,
      inputProps,
    });

    return NextResponse.json({ url: `/renders/${fileName}` });
  } catch (error) {
    console.error('Render error:', error);
    const message = error instanceof Error ? error.message : 'Rendering failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
