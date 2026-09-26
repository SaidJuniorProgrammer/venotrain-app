import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma'; // Reutilizamos la instancia global

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    
    const user = await prisma.user.create({
      data: {
        name: name,
        email: `player_${Date.now()}@venotrain.local` 
      }
    });

    return NextResponse.json({ id: user.id, name: user.name });
  } catch (error) {
    console.error('Error creando usuario:', error);
    return NextResponse.json({ error: 'Error al registrar el jugador' }, { status: 500 });
  }
}