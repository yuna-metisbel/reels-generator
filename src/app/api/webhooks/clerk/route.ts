import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    email_addresses: Array<{ email_address: string }>;
    primary_email_address_id: string;
  };
}

export async function POST(request: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing webhook secret' }, { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  const payload = await request.text();
  const wh = new Webhook(WEBHOOK_SECRET);

  let event: ClerkWebhookEvent;
  try {
    event = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'user.created') {
    const email =
      event.data.email_addresses.find(
        (e) => e.email_address
      )?.email_address ?? '';

    await prisma.user.create({
      data: {
        clerkId: event.data.id,
        email,
      },
    });
  }

  if (event.type === 'user.deleted') {
    await prisma.user.deleteMany({
      where: { clerkId: event.data.id },
    });
  }

  return NextResponse.json({ received: true });
}
