import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    // Solo cuentan intentos completados; los reintentos no deben inflar el ranking.
    const usersWithScores = await prisma.user.findMany({
      include: {
        scores: {
          where: { completed: true },
          orderBy: [{ score: 'desc' }, { timeSpent: 'asc' }]
        }
      }
    });

    const leaderboard = usersWithScores.map(user => {
      const bestByLevel = new Map<number, typeof user.scores[number]>();

      for (const score of user.scores) {
        const bestScore = bestByLevel.get(score.level);
        if (!bestScore || score.score > bestScore.score || (score.score === bestScore.score && score.timeSpent < bestScore.timeSpent)) {
          bestByLevel.set(score.level, score);
        }
      }

      const bestScores = [...bestByLevel.values()];
      const totalScore = bestScores.reduce((sum, score) => sum + score.score, 0);
      const totalTime = bestScores.reduce((sum, score) => sum + score.timeSpent, 0);
      const levelsCompleted = bestScores.length;

      return {
        id: user.id,
        name: user.name,
        totalScore,
        totalTime,
        levelsCompleted
      };
    })
    .filter(user => user.levelsCompleted > 0)
    .sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      return a.totalTime - b.totalTime;
    })
    .slice(0, 10); 

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Error al obtener la clasificación' }, { status: 500 });
  }
}