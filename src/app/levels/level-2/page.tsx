'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Clock, PlayCircle, Activity, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const ANATOMIA_MANO_DATA = [
  { id: 'vena_cefalica', nombre: 'Vena Cefálica' },
  { id: 'vena_basilica', nombre: 'Vena Dorsal Basílica' },
  { id: 'vena_metacarpo', nombre: 'Venas Dorsales del Metacarpo' },
  { id: 'digital_indice', nombre: 'Vena Dorsal Digital (Anular)' },
  { id: 'digital_menique', nombre: 'Vena Dorsal Digital (Índice)' }
];

const PUNTOS_IMAGEN = [
  { id: 'vena_cefalica', cx: '45%', cy: '13%', color: '#22d3ee' },
  { id: 'vena_basilica', cx: '15%', cy: '24%', color: '#22d3ee' }, 

  { id: 'vena_metacarpo', cx: '45%', cy: '35%', color: '#22d3ee' },

  { id: 'digital_indice', cx: '36%', cy: '66%', color: '#22d3ee' },
  { id: 'digital_menique', cx: '66%', cy: '50%', color: '#22d3ee' }
];

// Ajuste para Desktop (5 etiquetas): 3 a la izquierda (15%, 50%, 85%) y 2 a la derecha (32%, 68%)
const DESKTOP_POSITIONS = [
  'md:left-[2%] lg:left-[4%] md:top-[15%] md:-translate-y-1/2',
  'md:left-[2%] lg:left-[4%] md:top-[50%] md:-translate-y-1/2',
  'md:left-[2%] lg:left-[4%] md:top-[85%] md:-translate-y-1/2',
  'md:right-[2%] lg:right-[4%] md:top-[32%] md:-translate-y-1/2',
  'md:right-[2%] lg:right-[4%] md:top-[68%] md:-translate-y-1/2'
];

export default function Level2LineConnector() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const unlocked = parseInt(localStorage.getItem('venotrain_unlockedLevel') || '1');
    if (unlocked < 2) {
      router.replace(`/levels/level-${unlocked}`);
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  const [etiquetas, setEtiquetas] = useState<{ [key: number]: string }>({});
  const [conexiones, setConexiones] = useState<{ slotId: number, puntoId: string }[]>([]);
  const [seleccion, setSeleccion] = useState<{ tipo: 'slot' | 'punto', id: any } | null>(null);
  const [comprobado, setComprobado] = useState(false);
  const [resultado, setResultado] = useState<{ exitoso: boolean, aciertos: number, mensaje?: string } | null>(null);

  const [gameStarted, setGameStarted] = useState(false);
  const [initialTime, setInitialTime] = useState(30);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const slotsRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});
  const puntosRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [lineasCoords, setLineasCoords] = useState<{ id: string, x1: number, y1: number, x2: number, y2: number, color: string }[]>([]);

  useEffect(() => {
    const barajadas = [...ANATOMIA_MANO_DATA].sort(() => Math.random() - 0.5);
    const nuevasEtiquetas: { [key: number]: string } = {};
    barajadas.forEach((item, index) => { nuevasEtiquetas[index] = item.id; });
    setEtiquetas(nuevasEtiquetas);
  }, []);

  // Efecto del Temporizador corregido para evitar que el error se quede guardado al reintentar
  useEffect(() => {
    if (!isTimerRunning || comprobado) return;

    if (timeLeft <= 0) {
      setIsTimerRunning(false);
      setComprobado(true);
      setSeleccion(null);
      setResultado({ exitoso: false, aciertos: conexiones.length, mensaje: '¡Tiempo agotado!' });
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning, timeLeft, comprobado, conexiones.length]);

  const startGame = () => {
    setConexiones([]);
    setLineasCoords([]);
    setSeleccion(null);
    setComprobado(false);
    setResultado(null);
    setTimeLeft(initialTime);
    setGameStarted(true);
    setIsTimerRunning(true);
  };

  const actualizarLineas = () => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const isMobile = window.innerWidth < 768; 
    
    const nuevasLineas = conexiones.map(c => {
      const btnSlot = slotsRefs.current[c.slotId];
      const btnPunto = puntosRefs.current[c.puntoId];
      if (!btnSlot || !btnPunto) return null;

      const slotRect = btnSlot.getBoundingClientRect();
      const puntoRect = btnPunto.getBoundingClientRect();
      
      let x1, y1;

      if (isMobile) {
        x1 = (slotRect.left + slotRect.width / 2) - containerRect.left;
        y1 = slotRect.top - containerRect.top;
      } else {
        const isLeftSlot = c.slotId < 3;
        x1 = isLeftSlot ? (slotRect.right - containerRect.left) : (slotRect.left - containerRect.left);
        y1 = (slotRect.top + (slotRect.height / 2)) - containerRect.top;
      }

      const x2 = (puntoRect.left + (puntoRect.width / 2)) - containerRect.left;
      const y2 = (puntoRect.top + (puntoRect.height / 2)) - containerRect.top;

      const esCorrecto = etiquetas[c.slotId] === c.puntoId;
      let colorLinea = '#06b6d4'; 
      if (comprobado) { colorLinea = esCorrecto ? '#10b981' : '#ef4444'; } 
      
      return { id: `line-${c.slotId}-${c.puntoId}`, x1, y1, x2, y2, color: colorLinea };
    }).filter(Boolean) as any[];
    setLineasCoords(nuevasLineas);
  };

  useEffect(() => {
    actualizarLineas();
    const handleResize = () => setTimeout(actualizarLineas, 50);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [conexiones, comprobado, etiquetas]);

  const manejarClicSlot = (slotId: number) => {
    if (comprobado || !isTimerRunning) return;
    if (seleccion?.tipo === 'punto') { crearConexion(slotId, seleccion.id); } 
    else { setSeleccion(seleccion?.id === slotId ? null : { tipo: 'slot', id: slotId }); }
  };

  const manejarClicPunto = (puntoId: string) => {
    if (comprobado || !isTimerRunning) return;
    if (seleccion?.tipo === 'slot') { crearConexion(seleccion.id, puntoId); } 
    else { setSeleccion(seleccion?.id === puntoId ? null : { tipo: 'punto', id: puntoId }); }
  };

  const crearConexion = (slotId: number, puntoId: string) => {
    setConexiones(prev => {
      const filtradas = prev.filter(c => c.slotId !== slotId && c.puntoId !== puntoId);
      return [...filtradas, { slotId, puntoId }];
    });
    setSeleccion(null);
  };

  const borrarConexion = (e: React.MouseEvent, slotId: number) => {
    e.stopPropagation();
    if (comprobado || !isTimerRunning) return;
    setConexiones(prev => prev.filter(c => c.slotId !== slotId));
  };

  const comprobarRespuestas = async () => {
    setIsTimerRunning(false);
    setSeleccion(null);
    let aciertos = 0;
    conexiones.forEach(c => { if (etiquetas[c.slotId] === c.puntoId) aciertos++; });
    const exitoso = aciertos === 5;
    setResultado({ exitoso, aciertos });
    setComprobado(true);

    if (exitoso) {
      const unlocked = parseInt(localStorage.getItem('venotrain_unlockedLevel') || '1');
      if (unlocked < 3) {
        localStorage.setItem('venotrain_unlockedLevel', '3');
      }
    }
    
    const puntos = Math.round((aciertos / 5) * 100);
    try {
      await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 2, score: puntos, completed: exitoso, timeSpent: initialTime - timeLeft, userId: localStorage.getItem('venotrain_userId') || 'default-user-id' })
      });
    } catch (e) { console.log(e) }
  };

  const reintentar = () => {
    const nuevoTiempo = Math.max(5, initialTime - 5);
    setIsTimerRunning(false);
    setConexiones([]);
    setLineasCoords([]);
    setSeleccion(null);
    setComprobado(false);
    setResultado(null);
    const barajadas = [...ANATOMIA_MANO_DATA].sort(() => Math.random() - 0.5);
    const nuevasEtiquetas: { [key: number]: string } = {};
    barajadas.forEach((item, index) => { nuevasEtiquetas[index] = item.id; });
    setEtiquetas(nuevasEtiquetas);
    setInitialTime(nuevoTiempo);
    setTimeLeft(nuevoTiempo);
    setGameStarted(false);
  };

  const isTimeCritical = timeLeft <= 15 && isTimerRunning;
  const timeColor = isTimeCritical ? 'text-red-500 animate-pulse' : 'text-cyan-400';

  if (!isAuthorized) return <div className="min-h-screen bg-[#0B1120]" />;

  return (
    <main className="min-h-screen bg-[#0B1120] p-4 md:p-8 flex flex-col items-center font-sans select-none overflow-x-hidden">
      
      <div className="max-w-6xl w-full mb-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-[#0F172A] p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Nivel 2: Mapeo de la Mano</h1>
          <p className="text-slate-400">Selecciona una etiqueta y toca la vena correspondiente para trazar una línea.</p>
        </div>

        {gameStarted && (
          <div className="flex flex-col items-end">
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
        <div className="max-w-2xl w-full bg-[#1E293B] p-10 rounded-3xl border border-slate-700 text-center shadow-2xl mt-10">
          <Activity className="w-20 h-20 text-cyan-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">Reconocimiento Dorsal</h2>
          <p className="text-slate-300 text-lg mb-4 leading-relaxed">
            Identifica las 5 estructuras venosas del dorso de la mano. Toca una etiqueta y luego toca el punto anatómico correcto para conectarlas.
          </p>

          <div className="bg-[#0F172A] p-4 rounded-xl border border-slate-700 mb-8 inline-block">
            <span className="text-slate-400 text-sm block mb-1">Tiempo Asignado:</span>
            <span className={`text-3xl font-black ${initialTime < 30 ? 'text-amber-500' : 'text-cyan-400'}`}>
              {initialTime} segundos
            </span>
            {initialTime < 30 && (
              <p className="text-xs text-red-400 mt-2 font-bold flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3" /> Penalización de tiempo activa por reintento.
              </p>
            )}
          </div>

          <button onClick={startGame} className="w-full px-12 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xl rounded-xl shadow-[0_0_30px_rgba(8,145,178,0.4)] transition-transform hover:scale-105 flex items-center justify-center gap-3">
            <PlayCircle className="w-6 h-6" /> INICIAR MAPEO
          </button>
        </div>
      ) : (
        <div className="w-full max-w-6xl flex flex-col xl:flex-row gap-8">
          
          {/* CONTENEDOR PRINCIPAL */}
          <div ref={containerRef} className="relative w-full xl:w-[75%] flex flex-col md:block min-h-[650px] md:h-[600px] bg-[#0F172A] rounded-2xl border border-slate-800 shadow-2xl p-4 md:p-0">
            
            {/* SVG OVERLAY */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              {lineasCoords.map(linea => (
                <line key={linea.id} x1={linea.x1} y1={linea.y1} x2={linea.x2} y2={linea.y2} stroke={linea.color} strokeWidth="2.5" strokeLinecap="round" className="animate-pulse drop-shadow-md" />
              ))}
            </svg>

            {/* IMAGEN DE LA MANO */}
            <div className="relative md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full max-w-[280px] md:max-w-[320px] h-[350px] md:h-[450px] mx-auto z-10 mb-6 md:mb-0">
              <img src="/images/Mano con venas.png" alt="Anatomía Mano Venas" className={`w-full h-full object-cover opacity-90 drop-shadow-2xl pointer-events-none transition-opacity ${!isTimerRunning && !comprobado ? 'opacity-50' : 'opacity-100'}`} />
              
              {PUNTOS_IMAGEN.map(punto => {
                const estaConectado = conexiones.some(c => c.puntoId === punto.id);
                const esSeleccionado = seleccion?.tipo === 'punto' && seleccion.id === punto.id;
                
                return (
                  <button
                    key={`punto-${punto.id}`} 
                    ref={el => { puntosRefs.current[punto.id] = el; }} 
                    onClick={() => manejarClicPunto(punto.id)}
                    className={`absolute w-6 h-6 md:w-7 md:h-7 rounded-full border-[3px] z-30 transition-transform cursor-pointer
                      ${(!isTimerRunning && !comprobado) ? 'cursor-not-allowed opacity-50' : 'hover:scale-125'}
                      ${esSeleccionado ? 'scale-150 ring-4 ring-white/50' : ''} 
                      ${estaConectado ? 'bg-[#0F172A]' : 'bg-white'}
                    `}
                    style={{ left: punto.cx, top: punto.cy, borderColor: punto.color, boxShadow: `0 0 15px ${punto.color}`, transform: 'translate(-50%, -50%)' }}
                  />
                )
              })}
            </div>

            {/* ZONA DE ETIQUETAS */}
            <div className="w-full grid grid-cols-2 gap-2 sm:gap-3 mt-auto md:mt-0 md:block md:static z-20">
              {[0, 1, 2, 3, 4].map(index => {
                const idAnatomia = etiquetas[index];
                const dataAnatomia = ANATOMIA_MANO_DATA.find(d => d.id === idAnatomia);
                const conexion = conexiones.find(c => c.slotId === index);
                const esSeleccionado = seleccion?.tipo === 'slot' && seleccion.id === index;
                
                let bgClass = 'bg-[#1E293B]'; let borderClass = 'border-slate-600'; let textClass = 'text-slate-300';
                
                if (comprobado && conexion) {
                  const esCorrecto = etiquetas[index] === conexion.puntoId;
                  bgClass = esCorrecto ? 'bg-emerald-900' : 'bg-red-900'; borderClass = esCorrecto ? 'border-emerald-500' : 'border-red-500'; textClass = 'text-white font-bold';
                } else if (esSeleccionado) { 
                  borderClass = 'border-cyan-400'; bgClass = 'bg-[#334155]'; textClass = 'text-cyan-300';
                } else if (conexion) { 
                  borderClass = 'border-cyan-600'; 
                }

                return (
                  <div key={`slot-${index}`} className={`relative w-full flex justify-center z-20 md:absolute md:w-auto ${index === 4 ? 'col-span-2 md:col-span-1' : ''} ${DESKTOP_POSITIONS[index]} ${(!isTimerRunning && !comprobado) ? 'opacity-50 pointer-events-none' : ''}`}>
                    <button 
                      ref={el => { slotsRefs.current[index] = el; }} 
                      onClick={() => manejarClicSlot(index)} 
                      className={`w-full h-[50px] md:w-[220px] lg:w-[240px] xl:w-[260px] md:h-[52px] rounded-lg border flex items-center justify-center px-1 sm:px-3 transition-all shadow-lg text-[10px] sm:text-xs md:text-sm shadow-black/50 hover:bg-[#334155] ${bgClass} ${borderClass} ${textClass}`}
                    >
                      <span className="text-center leading-tight font-medium line-clamp-2">{dataAnatomia?.nombre || '...'}</span>
                    </button>
                    {conexion && !comprobado && (
                      <button onClick={(e) => borrarConexion(e, index)} className={`absolute -top-2 -right-2 md:w-6 md:h-6 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] md:text-xs shadow-lg hover:scale-110 z-30 md:${DESKTOP_POSITIONS[index].includes('right') ? '-left-2' : '-right-2'}`}>✕</button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* PANEL DE CONTROL DERECHO */}
          <div className="w-full xl:w-[25%] flex flex-col gap-6">
            <div className="bg-[#0F172A] p-6 rounded-2xl border border-slate-800 shadow-xl h-full flex flex-col justify-center">
              <div className="text-center mb-8">
                <h3 className="text-slate-400 text-sm uppercase tracking-widest font-bold mb-2">Progreso</h3>
                <div className="text-4xl font-black text-cyan-400">{conexiones.length} <span className="text-2xl text-slate-600">/ 5</span></div>
              </div>
              {!comprobado ? (
                <button onClick={comprobarRespuestas} disabled={conexiones.length < 5 || !isTimerRunning} className={`w-full py-4 rounded-xl font-bold text-base transition-all shadow-lg ${conexiones.length === 5 ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(8,145,178,0.4)]' : 'bg-[#1E293B] text-slate-500 cursor-not-allowed border border-slate-700'}`}>Comprobar</button>
              ) : (
                <div className={`p-5 rounded-xl border flex flex-col items-center text-center ${resultado?.exitoso ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4 ${resultado?.exitoso ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {resultado?.exitoso ? <CheckCircle className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                  </div>
                  <h2 className={`text-xl font-bold mb-2 ${resultado?.exitoso ? 'text-emerald-400' : 'text-red-400'}`}>{resultado?.exitoso ? '¡Mapeo Perfecto!' : resultado?.mensaje || `${resultado?.aciertos} Aciertos de 5`}</h2>
                  <div className="w-full flex flex-col gap-3 mt-2">
                    {!resultado?.exitoso && <button onClick={reintentar} className="w-full py-3 bg-[#1E293B] hover:bg-[#334155] text-white rounded-lg font-semibold border border-slate-700">Reintentar (-5s)</button>}
                    {resultado?.exitoso && <Link href="/levels/level-3" className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold shadow-lg">Siguiente Nivel ➔</Link>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}