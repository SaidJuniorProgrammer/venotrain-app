'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Activity, ShieldAlert, Syringe, AlertTriangle, AlertOctagon, PlayCircle, Trophy, BarChart3, Lock, User, Loader2 } from 'lucide-react';

const LEVELS = [
  { id: 1, title: 'Mapeo Anatómico', description: 'Fosa Antecubital', icon: Activity, color: 'text-cyan-400', bgLight: 'bg-cyan-500/10', borderHover: 'hover:border-cyan-500/50', glow: 'group-hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]' },
  { id: 2, title: 'Conexión Anatómica', description: 'Dorso de la Mano', icon: Activity, color: 'text-cyan-400', bgLight: 'bg-cyan-500/10', borderHover: 'hover:border-cyan-500/50', glow: 'group-hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]' },
  { id: 3, title: 'Toma de Decisiones', description: 'Calibres y Flujos', icon: Syringe, color: 'text-amber-400', bgLight: 'bg-amber-500/10', borderHover: 'hover:border-amber-500/50', glow: 'group-hover:shadow-[0_0_20px_rgba(251,191,36,0.2)]' },
  { id: 4, title: 'Código de Urgencia', description: 'Complicaciones Periféricas', icon: AlertTriangle, color: 'text-red-400', bgLight: 'bg-red-500/10', borderHover: 'hover:border-red-500/50', glow: 'group-hover:shadow-[0_0_20px_rgba(248,113,113,0.2)]' },
  { id: 5, title: 'Shock Hipovolémico', description: 'Reanimación Crítica', icon: AlertOctagon, color: 'text-red-600', bgLight: 'bg-red-900/20', borderHover: 'hover:border-red-500/80', glow: 'group-hover:shadow-[0_0_30px_rgba(220,38,38,0.4)]' }
];

export default function MainMenu() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    const savedName = localStorage.getItem('venotrain_userName');
    if (savedName) setCurrentUser(savedName);
  }, []);

  const handleStartTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName.trim() })
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('venotrain_userId', data.id);
        localStorage.setItem('venotrain_userName', data.name);
        localStorage.setItem('venotrain_unlockedLevel', '1'); // <--- INICIALIZAR EN NIVEL 1
        router.push('/levels/level-1');
      }
    } catch (error) {
      console.error('Error al registrar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openTraining = () => {
    if (currentUser) {
      // SI YA TIENE SESIÓN, LEER EL NIVEL MÁXIMO Y MANDARLO AHÍ
      const unlocked = localStorage.getItem('venotrain_unlockedLevel') || '1';
      router.push(`/levels/level-${unlocked}`); 
    } else {
      setShowModal(true);
    }
  };

  const handleCerrarSesion = () => {
    localStorage.removeItem('venotrain_userId');
    localStorage.removeItem('venotrain_userName');
    localStorage.removeItem('venotrain_unlockedLevel'); // <--- BORRAR PROGRESO
    setCurrentUser(null);
    setPlayerName('');
  };

  return (
    <main className="min-h-screen bg-[#050B14] flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      
      {/* Fondos Decorativos */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-900/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-900/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="z-10 w-full max-w-5xl flex flex-col items-center text-center">
        
        {/* LOGO Y TÍTULO */}
        <div className="mb-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(8,145,178,0.5)]">
            <Activity className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400 mb-4 tracking-tight">
            VENOTRAIN
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl font-medium">
            Simulador avanzado de acceso venoso periférico. Domina la anatomía, la bioseguridad y la resolución de crisis clínicas bajo presión.
          </p>
        </div>

        {/* ZONA DE BOTONES Y SESIÓN */}
        <div className="flex flex-col items-center gap-3 mb-16 w-full max-w-2xl">
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <button 
              onClick={openTraining}
              className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(8,145,178,0.4)] transition-all hover:scale-105"
            >
              <PlayCircle className="w-6 h-6 flex-shrink-0" /> 
              <span className="whitespace-nowrap">{currentUser ? `Continuar Entrenamiento` : 'Iniciar Entrenamiento'}</span>
            </button>
            <Link 
              href="/leaderboard"
              className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-[#1E293B] hover:bg-[#334155] text-white font-bold text-lg rounded-xl border border-slate-700 transition-colors"
            >
              <Trophy className="w-5 h-5 text-amber-400 flex-shrink-0" /> 
              <span className="whitespace-nowrap">Clasificación Global</span>
            </Link>
          </div>
          
          {/* BOTÓN CERRAR SESIÓN (Solo visible si hay un usuario activo) */}
          {currentUser && (
            <button
              onClick={handleCerrarSesion}
              className="text-slate-500 hover:text-red-400 text-sm mt-2 underline decoration-slate-600 transition-colors"
            >
              Cerrar sesión / Jugar como otra persona
            </button>
          )}
        </div>

        {/* REJILLA DE NIVELES */}
        <div className="w-full">
          <h3 className="text-slate-500 font-bold uppercase tracking-widest text-sm mb-6 flex items-center justify-center gap-2">
            <BarChart3 className="w-4 h-4" /> Módulos de Simulación
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {LEVELS.map((level) => {
              const Icon = level.icon;
              return (
                <div key={level.id} className={`group relative bg-[#0F172A] p-5 rounded-2xl border border-slate-800 transition-all duration-300 flex flex-col items-center text-center select-none ${level.borderHover} ${level.glow}`}>
                  <div className="absolute top-3 right-3 text-slate-600 group-hover:text-slate-400 transition-colors">
                    <Lock className="w-3 h-3" />
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${level.bgLight}`}>
                    <Icon className={`w-6 h-6 ${level.color}`} />
                  </div>
                  <span className="text-slate-500 font-black text-[10px] uppercase tracking-widest mb-1">Nivel {level.id}</span>
                  <h3 className="text-slate-200 font-bold text-sm leading-tight mb-2 group-hover:text-white transition-colors">{level.title}</h3>
                  <p className="text-slate-500 text-xs mt-auto">{level.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-16 text-slate-600 text-xs flex items-center gap-2 text-center px-4">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" /> 
          <span>Uso exclusivo para entrenamiento y simulación educativa. No sustituye la práctica clínica real.</span>
        </div>
      </div>

      {/* MODAL DE REGISTRO DE JUGADOR */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050B14]/80 backdrop-blur-sm p-4">
          <div className="bg-[#0F172A] p-8 rounded-3xl border border-slate-700 shadow-2xl max-w-md w-full relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">✕</button>
            
            <div className="w-16 h-16 bg-cyan-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-cyan-500/30">
              <User className="w-8 h-8 text-cyan-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2 text-center">Identificación Médica</h2>
            <p className="text-slate-400 text-sm text-center mb-6">
              Ingresa tu nombre o código de estudiante para registrar tus puntuaciones en la Clasificación Global.
            </p>

            <form onSubmit={handleStartTraining} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Ej. Dr. Martínez"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
                required
                className="w-full bg-[#1E293B] border border-slate-600 text-white rounded-xl px-4 py-4 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors text-lg"
              />
              <button 
                type="submit" 
                disabled={isLoading || !playerName.trim()}
                className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold text-lg rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Comenzar Guardia ➔'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}