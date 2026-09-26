'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Syringe, CheckCircle, XCircle, Info, Clock, PlayCircle, AlertTriangle, AlertCircle } from 'lucide-react';

// ============================================================================
// DATOS DE LOS CATÉTERES (Materiales Arrastrables)
// ============================================================================
const CATHETERS = [
  { id: '18G', nombre: '18G (Verde)', colorBase: 'bg-green-500', colorGlow: 'shadow-green-500/50', iconColor: 'text-green-50' },
  { id: '20G', nombre: '20G (Rosa)', colorBase: 'bg-pink-500', colorGlow: 'shadow-pink-500/50', iconColor: 'text-pink-50' },
  { id: '22G', nombre: '22G (Azul)', colorBase: 'bg-blue-500', colorGlow: 'shadow-blue-500/50', iconColor: 'text-blue-50' },
  { id: '24G', nombre: '24G (Amarillo)', colorBase: 'bg-yellow-400', colorGlow: 'shadow-yellow-400/50', iconColor: 'text-yellow-900' },
];

// ============================================================================
// DATOS DE LOS CASOS CLÍNICOS (Zonas de Soltado)
// ============================================================================
const CLINICAL_CASES = [
  {
    id: 'shock',
    title: 'Politraumatismo / Shock',
    description: 'Transfusión masiva de hemoderivados y flujos rápidos (>100 ml/min).',
    correctCatheter: '18G',
  },
  {
    id: 'adulto',
    title: 'Adulto Estándar',
    description: 'Infusión continua de cristaloides y analgesia en hospitalización.',
    correctCatheter: '20G',
  },
  {
    id: 'mayor',
    title: 'Adulto Mayor',
    description: 'Fragilidad capilar y venas colapsables. Requiere soporte isotónico.',
    correctCatheter: '22G',
  },
  {
    id: 'pediatria',
    title: 'Pediatría / Neonato',
    description: 'Terapia de mantenimiento a microgoteo. Venas de calibre reducido.',
    correctCatheter: '24G',
  }
];

export default function Level3DragAndDrop() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  // EFECTO PROTECTOR DE RUTAS
  useEffect(() => {
    const unlocked = parseInt(localStorage.getItem('venotrain_unlockedLevel') || '1');
    if (unlocked < 3) {
      router.replace(`/levels/level-${unlocked}`);
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  const [matches, setMatches] = useState<{ [key: string]: string }>({});
  const [comprobado, setComprobado] = useState(false);
  const [resultado, setResultado] = useState<{ exitoso: boolean, aciertos: number, mensaje?: string } | null>(null);
  const [shuffledCatheters, setShuffledCatheters] = useState(CATHETERS);

  // Estados de Gamificación y Tiempo
  const [gameStarted, setGameStarted] = useState(false);
  const [initialTime, setInitialTime] = useState(40);
  const [timeLeft, setTimeLeft] = useState(40);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    setShuffledCatheters([...CATHETERS].sort(() => Math.random() - 0.5));
  }, []);

  // Efecto del Temporizador
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTimerRunning && timeLeft > 0 && !comprobado) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && !comprobado) {
      setIsTimerRunning(false);
      setComprobado(true);
      setResultado({ exitoso: false, aciertos: Object.keys(matches).length, mensaje: '¡Tiempo agotado! Retrasaste el tratamiento.' });
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, timeLeft, comprobado, matches]);

  const startGame = () => {
    setTimeLeft(initialTime);
    setGameStarted(true);
    setIsTimerRunning(true);
  };

  const handleDragStart = (e: React.DragEvent, catheterId: string) => {
    if (comprobado || !isTimerRunning) return;
    e.dataTransfer.setData('catheterId', catheterId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, caseId: string) => {
    e.preventDefault();
    if (comprobado || !isTimerRunning) return;
    
    const catheterId = e.dataTransfer.getData('catheterId');
    if (catheterId) {
      setMatches(prev => {
        const newMatches = { ...prev };
        for (const key in newMatches) {
          if (newMatches[key] === catheterId) delete newMatches[key];
        }
        return { ...newMatches, [caseId]: catheterId };
      });
    }
  };

  const removeMatch = (caseId: string) => {
    if (comprobado || !isTimerRunning) return;
    setMatches(prev => {
      const newMatches = { ...prev };
      delete newMatches[caseId];
      return newMatches;
    });
  };

  const comprobarRespuestas = async () => {
    setIsTimerRunning(false);
    let aciertos = 0;
    CLINICAL_CASES.forEach(c => {
      if (matches[c.id] === c.correctCatheter) aciertos++;
    });

    const exitoso = aciertos === 4;
    setResultado({ exitoso, aciertos });
    setComprobado(true);

    // DESBLOQUEAR EL SIGUIENTE NIVEL
    if (exitoso) {
      const unlocked = parseInt(localStorage.getItem('venotrain_unlockedLevel') || '1');
      if (unlocked < 4) {
        localStorage.setItem('venotrain_unlockedLevel', '4');
      }
    }

    const puntos = Math.round((aciertos / 4) * 100);
    try {
      await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 3, score: puntos, completed: exitoso, timeSpent: initialTime - timeLeft, userId: localStorage.getItem('venotrain_userId') || 'default-user-id' })
      });
    } catch (e) { console.log(e) }
  };

  const reintentar = () => {
    setMatches({});
    setComprobado(false);
    setResultado(null);
    setInitialTime(prev => Math.max(8, prev - 8)); // Penalización de tiempo
    setGameStarted(false);
  };

  const availableCatheters = shuffledCatheters.filter(
    cat => !Object.values(matches).includes(cat.id)
  );

  const isTimeCritical = timeLeft <= 10 && isTimerRunning;
  const timeColor = isTimeCritical ? 'text-red-500 animate-pulse' : 'text-amber-400';

  if (!isAuthorized) return <div className="min-h-screen bg-[#0B1120]" />;

  return (
    <main className="min-h-screen bg-[#0B1120] p-4 md:p-8 flex flex-col items-center font-sans select-none">
      
      {/* HEADER DINÁMICO */}
      <div className="max-w-5xl w-full mb-8 border-b border-slate-800 pb-4 pt-4 flex flex-col md:flex-row justify-between items-center gap-4 bg-[#0F172A] p-6 rounded-2xl shadow-xl">
        <div className="w-full">
          <h1 className="text-3xl font-bold text-white mb-2">Nivel 3: Selección de Calibres</h1>
          <p className="text-slate-400">Asigna el catéter correcto para cada indicación clínica.</p>
        </div>

        {gameStarted && (
          <div className="flex flex-col items-end flex-shrink-0">
            <span className="text-xs text-slate-500 font-bold tracking-widest uppercase mb-1 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Tiempo Restante
            </span>
            <div className={`text-4xl font-black tabular-nums ${timeColor}`}>
              00:{timeLeft.toString().padStart(2, '0')}
            </div>
          </div>
        )}
      </div>

      {!gameStarted ? (
        /* PANTALLA DE PREPARACIÓN (TEMA AMARILLO/ÁMBAR) */
        <div className="max-w-2xl w-full bg-[#1E293B] p-10 rounded-3xl border border-amber-900/30 text-center shadow-[0_0_40px_rgba(245,158,11,0.1)] mt-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
          <AlertTriangle className="w-20 h-20 text-amber-500 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]" />
          
          <h2 className="text-3xl font-bold text-white mb-4">Aumenta la Dificultad</h2>
          <p className="text-slate-300 text-lg mb-4 leading-relaxed">
            Pasamos de la anatomía a la toma de decisiones. Un catéter incorrecto puede causar hemólisis, infiltración o retrasar una transfusión vital. Arrastra los 4 calibres a su paciente ideal antes de que el tiempo termine.
          </p>
          
          <div className="bg-[#0F172A] p-4 rounded-xl border border-slate-700 mb-8 inline-block">
            <span className="text-slate-400 text-sm block mb-1">Tiempo Asignado:</span>
            <span className={`text-3xl font-black ${initialTime < 40 ? 'text-red-400' : 'text-amber-500'}`}>
              {initialTime} segundos
            </span>
            {initialTime < 40 && (
              <p className="text-xs text-red-400 mt-2 font-bold flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3" /> Penalización de tiempo activa por reintento.
              </p>
            )}
          </div>

          <button onClick={startGame} className="w-full px-12 py-4 bg-amber-600 hover:bg-amber-500 text-white font-black text-xl rounded-xl shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-transform hover:scale-105 flex items-center justify-center gap-3">
            <PlayCircle className="w-6 h-6" /> INICIAR SELECCIÓN CLÍNICA
          </button>
        </div>
      ) : (
        /* TABLERO DE JUEGO */
        <div className="w-full max-w-5xl flex flex-col gap-8 transition-opacity duration-500">
          
          {/* ZONA SUPERIOR: BANCO DE CATÉTERES */}
          <div className="bg-[#0F172A] rounded-2xl border border-slate-800 p-6 shadow-xl">
            <h2 className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <Syringe className="w-4 h-4" /> Materiales Disponibles
            </h2>
            
            <div className="flex flex-wrap gap-4 min-h-[120px] items-center justify-center p-4 bg-[#0B1120] rounded-xl border border-slate-800/50">
              {availableCatheters.length === 0 ? (
                <p className="text-slate-600 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Todos los materiales han sido asignados.
                </p>
              ) : (
                availableCatheters.map(cat => (
                  <div
                    key={cat.id}
                    draggable={!comprobado && isTimerRunning}
                    onDragStart={(e) => handleDragStart(e, cat.id)}
                    className={`w-[140px] flex flex-col items-center gap-3 p-3 rounded-xl cursor-grab active:cursor-grabbing transition-all bg-[#1E293B] border border-slate-600 shadow-lg 
                      ${(!isTimerRunning && !comprobado) ? 'opacity-50 cursor-not-allowed' : `hover:-translate-y-1 hover:${cat.colorGlow}`}`}
                  >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${cat.colorBase} shadow-lg shadow-black/50`}>
                      <Syringe className={`w-7 h-7 ${cat.iconColor} drop-shadow-md`} strokeWidth={2.5} />
                    </div>
                    <span className="text-white font-bold text-sm text-center">{cat.nombre}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ZONA INFERIOR: CASOS CLÍNICOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CLINICAL_CASES.map(caso => {
              const assignedCatheterId = matches[caso.id];
              const assignedCatheter = CATHETERS.find(c => c.id === assignedCatheterId);
              
              let borderColor = 'border-slate-700';
              let bgClass = 'bg-[#0F172A] hover:bg-[#1E293B]';
              
              if (comprobado && assignedCatheterId) {
                const esCorrecto = assignedCatheterId === caso.correctCatheter;
                borderColor = esCorrecto ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
                bgClass = esCorrecto ? 'bg-emerald-950/30' : 'bg-red-950/30';
              } else if (assignedCatheterId) {
                borderColor = 'border-cyan-500/50';
              }

              return (
                <div 
                  key={caso.id}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, caso.id)}
                  className={`relative flex flex-col p-5 rounded-2xl border-2 transition-colors ${borderColor} ${bgClass} ${(!isTimerRunning && !comprobado) ? 'opacity-70' : ''}`}
                >
                  <h3 className="text-lg font-bold text-cyan-300 mb-1 flex items-center gap-2">
                    <Info className="w-4 h-4 text-cyan-500" /> {caso.title}
                  </h3>
                  <p className="text-slate-400 text-sm mb-4 pr-24">{caso.description}</p>

                  <div className="absolute right-4 top-1/2 -translate-y-1/2 w-[90px] h-[90px] rounded-xl border-2 border-dashed border-slate-600 bg-[#0B1120]/50 flex items-center justify-center">
                    {assignedCatheter ? (
                      <div 
                        onClick={() => removeMatch(caso.id)}
                        className={`w-full h-full flex flex-col items-center justify-center p-1 rounded-lg cursor-pointer hover:scale-95 transition-transform ${assignedCatheter.colorBase} shadow-inner`}
                        title="Haz clic para remover"
                      >
                        <Syringe className={`w-8 h-8 mb-1 drop-shadow-md ${assignedCatheter.iconColor}`} strokeWidth={2} />
                        <span className="text-slate-900 font-black text-[11px] text-center leading-tight bg-white/90 px-1.5 py-0.5 rounded shadow-sm">{assignedCatheter.nombre}</span>
                      </div>
                    ) : (
                      <span className="text-slate-500 text-xs text-center px-2">Arrastra aquí</span>
                    )}
                  </div>
                  
                  {comprobado && assignedCatheterId && (
                    <div className={`absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg ${assignedCatheterId === caso.correctCatheter ? 'bg-emerald-500' : 'bg-red-500'}`}>
                      {assignedCatheterId === caso.correctCatheter ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* CONTROLES INFERIORES */}
          <div className="w-full mt-4">
            {!comprobado ? (
              <button 
                onClick={comprobarRespuestas}
                disabled={Object.keys(matches).length < 4 || !isTimerRunning}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg
                  ${Object.keys(matches).length === 4 
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)]' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
              >
                {Object.keys(matches).length === 4 ? 'Comprobar Selección' : `Asigna los 4 catéteres (${Object.keys(matches).length}/4)`}
              </button>
            ) : (
              <div className={`p-6 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl ${resultado?.exitoso ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
                
                <div>
                  <h2 className={`text-2xl font-bold mb-1 flex items-center gap-2 ${resultado?.exitoso ? 'text-emerald-400' : 'text-red-400'}`}>
                    {resultado?.exitoso ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                    {resultado?.exitoso ? '¡Elección Perfecta!' : resultado?.mensaje || `Aciertos: ${resultado?.aciertos} de 4`}
                  </h2>
                  <p className="text-slate-300 text-sm">
                    {resultado?.exitoso 
                      ? 'Dominas la relación entre flujo, calibre y paciente. Preservar el endotelio es clave.' 
                      : 'Revisa los colores. Un catéter grueso daña venas frágiles, y uno fino retrasa una transfusión masiva.'}
                  </p>
                </div>

                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                  {!resultado?.exitoso ? (
                    <button onClick={reintentar} className="w-full md:w-auto px-8 py-3 bg-[#1E293B] hover:bg-[#334155] text-white rounded-lg font-bold border border-slate-700 whitespace-nowrap transition-colors">
                      Reintentar (-8s)
                    </button>
                  ) : (
                    <Link href="/levels/level-4" className="w-full md:w-auto px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white text-center rounded-lg font-bold whitespace-nowrap shadow-lg transition-transform hover:scale-105">
                      Continuar al Nivel 4 ➔
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}