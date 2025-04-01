import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

// interface RouteParams { 
//   params: { userId: string };
// }

// Remove type annotation for the second argument completely
export async function GET(
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { params }: any // Use any for now to satisfy build, acknowledging tech debt
) {
  // Manually assert or validate params.userId type if needed
  const userId = params?.userId as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: 'User ID parameter is required' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        image: true,
        email: true, 
        wins: true,
        losses: true,
        draws: true,
        rating: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 