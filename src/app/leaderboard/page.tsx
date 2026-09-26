'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Clock, Target, ArrowLeft, Activity, Medal } from 'lucide-react';

type LeaderboardEntry = {
  id: string;
  name: string;
  totalScore: number;
  totalTime: number;
  levelsCompleted: number;
};

export default function LeaderboardPage() {
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(data => {
        setScores(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-[#050B14] flex flex-col items-center p-6 font-sans relative overflow-hidden">
      {/* Fondos Decorativos */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-900/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="z-10 w-full max-w-4xl mt-10">
        
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors mb-8 font-bold">
          <ArrowLeft className="w-5 h-5" /> Volver al Base
        </Link>

        <div className="flex flex-col items-center text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(245,158,11,0.3)]">
            <Trophy className="w-10 h-10 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
            SALÓN DE LA FAMA
          </h1>
          <p className="text-slate-400 text-lg">Los mejores tiempos y puntajes en la resolución de crisis de VENOTRAIN.</p>
        </div>

        <div className="bg-[#0F172A] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-6 bg-[#1E293B] border-b border-slate-700 text-slate-400 text-xs font-black uppercase tracking-widest">
            <div className="col-span-2 md:col-span-1 text-center">Rango</div>
            <div className="col-span-6 md:col-span-5">Especialista</div>
            <div className="col-span-4 md:col-span-2 text-center hidden md:block">Niveles</div>
            <div className="col-span-4 md:col-span-2 text-center flex items-center justify-center gap-1"><Target className="w-4 h-4"/> Puntaje</div>
            <div className="col-span-4 md:col-span-2 text-center flex items-center justify-center gap-1"><Clock className="w-4 h-4"/> Tiempo</div>
          </div>

          <div className="flex flex-col">
            {loading ? (
              <div className="p-10 text-center text-slate-500 flex flex-col items-center">
                <Activity className="w-8 h-8 animate-spin text-cyan-500 mb-4" />
                Cargando registros médicos...
              </div>
            ) : scores.length === 0 ? (
              <div className="p-10 text-center text-slate-500">Aún no hay registros en la base de datos.</div>
            ) : (
              scores.map((score, index) => {
                const isTop3 = index < 3;
                return (
                  <div key={score.id} className="grid grid-cols-12 gap-4 p-6 border-b border-slate-800/50 hover:bg-[#1E293B]/50 transition-colors items-center">
                    
                    <div className="col-span-2 md:col-span-1 flex justify-center">
                      {index === 0 ? <Medal className="w-7 h-7 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" /> : 
                       index === 1 ? <Medal className="w-7 h-7 text-slate-300 drop-shadow-[0_0_10px_rgba(203,213,225,0.5)]" /> : 
                       index === 2 ? <Medal className="w-7 h-7 text-amber-700 drop-shadow-[0_0_10px_rgba(180,83,9,0.5)]" /> : 
                       <span className="text-slate-600 font-black text-lg">{index + 1}</span>}
                    </div>

                    <div className="col-span-6 md:col-span-5">
                      <div className={`font-bold text-lg ${isTop3 ? 'text-white' : 'text-slate-300'}`}>
                        {score.name || 'Desconocido'}
                      </div>
                    </div>

                    <div className="col-span-4 md:col-span-2 text-center hidden md:block">
                      <span className="px-3 py-1 bg-[#0B1120] border border-slate-700 rounded-full text-xs font-bold text-slate-400">
                        {score.levelsCompleted} completados
                      </span>
                    </div>

                    <div className="col-span-2 text-center">
                      <span className={`font-black text-lg ${score.totalScore >= 100 ? 'text-emerald-400' : 'text-cyan-400'}`}>
                        {score.totalScore} pts
                      </span>
                    </div>

                    <div className="col-span-2 text-center font-mono text-slate-400">
                      {score.totalTime}s
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </main>
  );
}