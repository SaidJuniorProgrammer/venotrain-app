// src/app/api/scores/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { level, score, completed, timeSpent, userId } = body;

    if (!userId || userId === 'default-user-id') {
      return NextResponse.json({ success: false, message: 'Modo invitado, no se guarda score' }, { status: 200 });
    }

    const newScore = await prisma.score.create({
      data: {
        level,
        score,
        completed,
        timeSpent,
        userId: userId 
      }
    });

    return NextResponse.json({ success: true, data: newScore }, { status: 201 });
  } catch (error) {
    console.error('Error guardando score:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}