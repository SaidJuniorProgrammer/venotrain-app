'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Clock, PlayCircle, Activity, CheckCircle, XCircle, AlertCircle, Pointer } from 'lucide-react';

const VENAS_DATA = {
  cefalica: {
    id: 'cefalica',
    nombre: 'Vena Cefálica',
    descripcion: 'Corre por el lado lateral (externo) del antebrazo. Se origina en el dorso de la mano y asciende por el lado del pulgar.'
  },
  mediana: {
    id: 'mediana',
    nombre: 'Vena Mediana Cubital',
    descripcion: 'Comunica la vena cefálica con la vena basílica. Es la vena más frecuente y visible en la fosa antecubital.'
  },
  basilica: {
    id: 'basilica',
    nombre: 'Vena Basílica',
    descripcion: 'Corre por el lado medial (interno) del antebrazo. Se origina en el dorso de la mano, del lado del meñique.'
  }
};

export default function Level1DragAndDrop() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // EFECTO PROTECTOR Y DETECCIÓN TÁCTIL
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);

    const unlocked = parseInt(localStorage.getItem('venotrain_unlockedLevel') || '1');
    if (unlocked < 1) {
      router.replace(`/levels/level-${unlocked}`);
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  const [zonas, setZonas] = useState<{ [key: string]: string | null }>({
    cefalica: null, mediana: null, basilica: null
  });
  const [banco, setBanco] = useState<string[]>(['cefalica', 'mediana', 'basilica']);
  const [comprobado, setComprobado] = useState(false);
  const [resultado, setResultado] = useState<{ exitoso: boolean, aciertos: number, mensaje?: string } | null>(null);
  
  const [venaSeleccionada, setVenaSeleccionada] = useState<string | null>(null);

  // Tiempo base: 30 segundos
  const [gameStarted, setGameStarted] = useState(false);
  const [initialTime, setInitialTime] = useState(30);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Efecto del Temporizador
  useEffect(() => {
    if (!isTimerRunning || comprobado) return;

    if (timeLeft <= 0) {
      setIsTimerRunning(false);
      setComprobado(true);
      setVenaSeleccionada(null);
      setResultado({
        exitoso: false,
        aciertos: 0,
        mensaje: '¡Tiempo agotado! El retraso compromete la hidratación del paciente.'
      });
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning, timeLeft, comprobado]);

  const startGame = () => {
    setZonas({ cefalica: null, mediana: null, basilica: null });
    setBanco(['cefalica', 'mediana', 'basilica']);
    setComprobado(false);
    setResultado(null);
    setVenaSeleccionada(null);
    setTimeLeft(initialTime);
    setGameStarted(true);
    setIsTimerRunning(true);
  };

  // =======================================================================
  // LÓGICA HÍBRIDA: Drag (PC) + Tap (Móvil)
  // =======================================================================

  const handleDragStart = (e: React.DragEvent, idVena: string, origen: string) => {
    if (comprobado || !isTimerRunning || isTouchDevice) return;
    setVenaSeleccionada(null); 
    e.dataTransfer.setData('idVena', idVena);
    e.dataTransfer.setData('origen', origen);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (e: React.DragEvent, zonaDestino: string) => {
    e.preventDefault();
    if (comprobado || !isTimerRunning || isTouchDevice) return;

    const idVena = e.dataTransfer.getData('idVena');
    const origen = e.dataTransfer.getData('origen');
    if (idVena && origen) {
      ejecutarMovimiento(idVena, origen, zonaDestino);
    }
  };

  const handleZoneClick = (zonaDestino: string) => {
    if (comprobado || !isTimerRunning || !venaSeleccionada) return;
    ejecutarMovimiento(venaSeleccionada, 'banco', zonaDestino);
    setVenaSeleccionada(null);
  };

  const ejecutarMovimiento = (idVena: string, origen: string, zonaDestino: string) => {
    if (origen === zonaDestino) return;

    if (origen === 'banco') {
      const venaOcupandoDestino = zonas[zonaDestino];
      setZonas(prev => ({ ...prev, [zonaDestino]: idVena }));
      setBanco(prev => {
        const nuevoBanco = prev.filter(v => v !== idVena);
        if (venaOcupandoDestino) nuevoBanco.push(venaOcupandoDestino);
        return nuevoBanco;
      });
    } else {
      const venaOcupandoDestino = zonas[zonaDestino];
      setZonas(prev => ({
        ...prev,
        [zonaDestino]: idVena,
        [origen]: venaOcupandoDestino
      }));
    }
  };

  const devolverAlBanco = (zona: string) => {
    if (comprobado || !isTimerRunning) return;
    const idVena = zonas[zona];
    if (idVena) {
      setZonas(prev => ({ ...prev, [zona]: null }));
      setBanco(prev => [...prev, idVena]);
    }
  };

  // =======================================================================

  const comprobarRespuestas = async () => {
    setIsTimerRunning(false);
    setVenaSeleccionada(null);
    
    const aciertos = 
      (zonas.cefalica === 'cefalica' ? 1 : 0) +
      (zonas.mediana === 'mediana' ? 1 : 0) +
      (zonas.basilica === 'basilica' ? 1 : 0);

    const exitoso = aciertos === 3;
    setResultado({ exitoso, aciertos });
    setComprobado(true);

    if (exitoso) {
      const unlocked = parseInt(localStorage.getItem('venotrain_unlockedLevel') || '1');
      if (unlocked < 2) {
        localStorage.setItem('venotrain_unlockedLevel', '2');
      }
    }

    const puntos = Math.round((aciertos / 3) * 100);
    try {
      await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 1,
          score: puntos,
          completed: exitoso,
          timeSpent: initialTime - timeLeft,
          userId: localStorage.getItem('venotrain_userId') || 'default-user-id'
        })
      });
    } catch (error) { console.error('Error al guardar:', error); }
  };

  const reintentar = () => {
    const nuevoTiempo = Math.max(5, initialTime - 5);
    setIsTimerRunning(false);
    setZonas({ cefalica: null, mediana: null, basilica: null });
    setBanco(['cefalica', 'mediana', 'basilica']);
    setComprobado(false);
    setResultado(null);
    setVenaSeleccionada(null);
    setInitialTime(nuevoTiempo);
    setTimeLeft(nuevoTiempo);
    setGameStarted(false);
  };

  const EtiquetaVena = ({ idVena, origen }: { idVena: string, origen: string }) => {
    const isSelected = venaSeleccionada === idVena;
    const enZona = origen !== 'banco';
    
    return (
      <div
        draggable={!isTouchDevice && !comprobado && isTimerRunning}
        onDragStart={(e) => handleDragStart(e, idVena, origen)}
        onClick={(e) => {
          e.stopPropagation();
          if (comprobado || !isTimerRunning) return;
          if (origen === 'banco') {
            setVenaSeleccionada(prev => prev === idVena ? null : idVena);
          } else {
            devolverAlBanco(origen);
          }
        }}
        className={`${enZona ? 'px-1.5 py-1 text-[10px] sm:text-xs w-full h-full justify-center' : 'px-3 py-2 text-sm'} rounded-md font-semibold cursor-pointer text-center shadow-md transition-all flex items-center gap-1.5
          ${isSelected ? 'ring-2 ring-cyan-400 scale-105 bg-[#334155] text-cyan-300' : ''}
          ${comprobado 
            ? (zonas[origen] === origen ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white') 
            : !isSelected ? 'bg-[#1E293B] text-cyan-400 hover:bg-[#334155] hover:text-cyan-300 border border-slate-600' : ''
          } ${(!isTimerRunning && !comprobado) && 'opacity-50 cursor-not-allowed'}
        `}
      >
        <Activity className="w-3.5 h-3.5 opacity-70 flex-shrink-0" />
        <span className="leading-tight line-clamp-2">{VENAS_DATA[idVena as keyof typeof VENAS_DATA].nombre}</span>
      </div>
    );
  };

  const isTimeCritical = timeLeft <= 10 && isTimerRunning;
  const timeColor = isTimeCritical ? 'text-red-500 animate-pulse' : 'text-cyan-400';

  if (!isAuthorized) return <div className="min-h-screen bg-[#0B1120]" />;

  return (
    <main className="min-h-screen bg-[#0B1120] p-4 md:p-8 flex flex-col items-center font-sans select-none overflow-x-hidden">
      
      {/* HEADER */}
      <div className="max-w-6xl w-full mb-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-[#0F172A] p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Nivel 1: Mapeo Anatómico</h1>
          <p className="text-slate-400">Identifica la red venosa de la fosa antecubital (Brazo Derecho).</p>
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
        /* PANTALLA DE PREPARACIÓN */
        <div className="max-w-2xl w-full bg-[#1E293B] p-10 rounded-3xl border border-slate-700 text-center shadow-2xl mt-10">
          <Activity className="w-20 h-20 text-cyan-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">Preparación de Insumos</h2>
          <p className="text-slate-300 text-lg mb-4 leading-relaxed">
            Tu primer objetivo es identificar las 3 venas principales de la fosa antecubital en el <span className="text-cyan-400 font-bold">brazo derecho</span>. Arrastra (PC) o Toca (Móvil) las etiquetas hacia su lugar correspondiente antes de que el tiempo se agote.
          </p>
          
          <div className="bg-[#0F172A] p-4 rounded-xl border border-slate-700 mb-8 inline-block">
            <span className="text-slate-400 text-sm block mb-1">Tiempo Asignado:</span>
            <span className={`text-3xl font-black ${initialTime < 30 ? 'text-amber-500' : 'text-cyan-400'}`}>
              {initialTime} segundos
            </span>
            {initialTime < 30 && (
              <p className="text-xs text-red-400 mt-2 font-bold flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3" /> Penalización de tiempo activa por reintento (-5s).
              </p>
            )}
          </div>

          <button onClick={startGame} className="w-full px-12 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xl rounded-xl shadow-[0_0_30px_rgba(8,145,178,0.4)] transition-transform hover:scale-105 flex items-center justify-center gap-3">
            <PlayCircle className="w-6 h-6" /> INICIAR MAPEO
          </button>
        </div>
      ) : (
        /* TABLERO DE JUEGO */
        <div className="flex flex-col lg:flex-row gap-8 max-w-6xl w-full items-start">
          
          {/* Panel Izquierdo: Imagen interactiva */}
          <div className="relative w-full lg:w-1/2 flex flex-col items-center bg-[#0F172A] rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-2xl overflow-hidden">
            
            {/* TÍTULO SUPERIOR: SOLO BRAZO DERECHO */}
            <div className="w-full flex justify-center mb-3">
              <div className="px-5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs sm:text-sm font-extrabold uppercase tracking-widest shadow-md">
                Brazo Derecho
              </div>
            </div>

            <div className="relative w-full max-w-[370px] aspect-[4/5]">
              <img 
                src="/images/brazo convenas.png" 
                alt="Anatomía del brazo derecho con venas" 
                className={`w-full h-full object-contain drop-shadow-xl transition-opacity ${!isTimerRunning && !comprobado ? 'opacity-50' : 'opacity-100'}`}
              />

              {/* REFERENCIAS ANATÓMICAS INTEGRADAS AL TEMA DEL JUEGO */}
              <div className="absolute top-[16%] right-[2%] px-2.5 py-1 rounded-md bg-[#0B1120]/85 border border-slate-700/80 backdrop-blur-sm shadow-md flex items-center gap-1.5 pointer-events-none z-10">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                <span className="text-slate-300 font-bold text-[10px] sm:text-xs uppercase tracking-widest">
                  Parte Interna
                </span>
              </div>

              <div className="absolute bottom-[32%] left-[2%] px-2.5 py-1 rounded-md bg-[#0B1120]/85 border border-slate-700/80 backdrop-blur-sm shadow-md flex items-center gap-1.5 pointer-events-none z-10">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                <span className="text-slate-300 font-bold text-[10px] sm:text-xs uppercase tracking-widest">
                  Parte Externa
                </span>
              </div>

              {/* ZONA DE DROP 1: Vena Cefálica (Parte Externa / Izquierda) */}
              <div 
                onClick={() => handleZoneClick('cefalica')}
                onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'cefalica')}
                className={`absolute top-[25%] left-[1%] w-[33%] h-[52px] p-1 border-2 border-dashed rounded-lg flex items-center justify-center bg-[#0B1120]/90 backdrop-blur-sm z-20 cursor-pointer transition-colors
                  ${comprobado ? (zonas.cefalica === 'cefalica' ? 'border-emerald-500' : 'border-red-500') 
                  : (venaSeleccionada && !zonas.cefalica ? 'border-amber-400 bg-amber-900/30' : 'border-cyan-500/60')}`}
              >
                {zonas.cefalica ? <EtiquetaVena idVena={zonas.cefalica} origen="cefalica" /> : <span className="text-[11px] sm:text-xs text-slate-500 font-medium">Vacío</span>}
                {/* Línea hacia Vena Cefálica */}
                <div className="absolute left-full top-1/2 -translate-y-1/2 w-[25%] h-[2px] bg-cyan-400/80 pointer-events-none flex items-center justify-end">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] translate-x-1/2" />
                </div>
              </div>

              {/* ZONA DE DROP 2: Vena Mediana Cubital (Centro Fosa) */}
              <div 
                onClick={() => handleZoneClick('mediana')}
                onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'mediana')}
                className={`absolute top-[41%] right-[1%] w-[35%] h-[52px] p-1 border-2 border-dashed rounded-lg flex items-center justify-center bg-[#0B1120]/90 backdrop-blur-sm z-20 cursor-pointer transition-colors
                  ${comprobado ? (zonas.mediana === 'mediana' ? 'border-emerald-500' : 'border-red-500') 
                  : (venaSeleccionada && !zonas.mediana ? 'border-amber-400 bg-amber-900/30' : 'border-cyan-500/60')}`}
              >
                {zonas.mediana ? <EtiquetaVena idVena={zonas.mediana} origen="mediana" /> : <span className="text-[11px] sm:text-xs text-slate-500 font-medium">Vacío</span>}
                {/* Línea ajustada exactamente al punto rojo de la Vena Mediana Cubital */}
                <div className="absolute right-full top-1/2 -translate-y-1/2 w-[35%] h-[2px] bg-cyan-400/80 pointer-events-none flex items-center justify-start">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] -translate-x-1/2" />
                </div>
              </div>

              {/* ZONA DE DROP 3: Vena Basílica (Parte Interna / Derecha) */}
              <div 
                onClick={() => handleZoneClick('basilica')}
                onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'basilica')}
                className={`absolute bottom-[18%] right-[1%] w-[35%] h-[52px] p-1 border-2 border-dashed rounded-lg flex items-center justify-center bg-[#0B1120]/90 backdrop-blur-sm z-20 cursor-pointer transition-colors
                  ${comprobado ? (zonas.basilica === 'basilica' ? 'border-emerald-500' : 'border-red-500') 
                  : (venaSeleccionada && !zonas.basilica ? 'border-amber-400 bg-amber-900/30' : 'border-cyan-500/60')}`}
              >
                {zonas.basilica ? <EtiquetaVena idVena={zonas.basilica} origen="basilica" /> : <span className="text-[11px] sm:text-xs text-slate-500 font-medium">Vacío</span>}
                {/* Línea ajustada exactamente al punto rojo de la Vena Basílica */}
                <div className="absolute right-full top-1/2 -translate-y-1/2 w-[20%] h-[2px] bg-cyan-400/80 pointer-events-none flex items-center justify-start">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] -translate-x-1/2" />
                </div>
              </div>
            </div>
          </div>

          {/* Panel Derecho: Controles */}
          <div className="w-full lg:w-1/2 flex flex-col gap-6">
            
            <div className="bg-[#0F172A] p-6 rounded-2xl border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest">Banco de Etiquetas</h3>
                <span className="text-xs text-cyan-500/70 hidden md:flex items-center gap-1"><Pointer className="w-3 h-3"/> Arrastra o Toca</span>
                <span className="text-xs text-cyan-500/70 md:hidden flex items-center gap-1"><Pointer className="w-3 h-3"/> 1. Toca  2. Asigna</span>
              </div>
              
              <div 
                onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'banco')}
                className={`flex flex-wrap gap-3 min-h-[70px] p-4 rounded-xl border border-dashed transition-colors
                  ${venaSeleccionada ? 'bg-cyan-950/20 border-cyan-800' : 'bg-[#0B1120] border-slate-700'}`}
              >
                {banco.length === 0 && <span className="text-slate-500 text-sm italic w-full text-center flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4" /> Todas las etiquetas ubicadas</span>}
                {banco.map(id => (
                  <EtiquetaVena key={id} idVena={id} origen="banco" />
                ))}
              </div>
            </div>

            {!comprobado ? (
              <button 
                onClick={comprobarRespuestas}
                disabled={banco.length > 0 || !isTimerRunning}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg
                  ${banco.length === 0 
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(8,145,178,0.4)]' 
                    : 'bg-[#1E293B] text-slate-500 cursor-not-allowed border border-slate-700'}`}
              >
                Comprobar Respuestas
              </button>
            ) : (
              <div className={`p-6 rounded-2xl border shadow-xl ${resultado?.exitoso ? 'bg-emerald-950/30 border-emerald-500/50' : 'bg-red-950/30 border-red-500/50'}`}>
                
                <h2 className={`text-2xl font-bold mb-4 flex items-center gap-2 ${resultado?.exitoso ? 'text-emerald-400' : 'text-red-400'}`}>
                  {resultado?.exitoso ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                  {resultado?.exitoso ? '¡Excelente precisión!' : resultado?.mensaje || `Aciertos: ${resultado?.aciertos} de 3`}
                </h2>
                
                <div className="mt-4 space-y-3">
                  {Object.entries(zonas).map(([zona, idVena]) => (
                    idVena && zona === idVena && (
                      <div key={zona} className="bg-[#0B1120] p-4 rounded-xl border border-slate-800">
                        <span className="text-cyan-400 font-bold block mb-1 flex items-center gap-2"><Activity className="w-4 h-4"/> {VENAS_DATA[idVena as keyof typeof VENAS_DATA].nombre}</span>
                        <span className="text-slate-300 text-sm leading-relaxed">{VENAS_DATA[idVena as keyof typeof VENAS_DATA].descripcion}</span>
                      </div>
                    )
                  ))}
                </div>

                <div className="mt-6 flex flex-col md:flex-row gap-4">
                  {!resultado?.exitoso && (
                    <button onClick={reintentar} className="w-full py-3 bg-[#1E293B] hover:bg-[#334155] text-white rounded-xl font-bold border border-slate-700 transition-colors">
                      Reintentar (-5s)
                    </button>
                  )}
                  {resultado?.exitoso && (
                    <Link href="/levels/level-2" className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white text-center rounded-xl font-bold shadow-lg transition-transform hover:scale-105">
                      Siguiente Nivel ➔
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