'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, Clock, Activity, CheckCircle, XCircle, ShieldAlert, AlertCircle, PlayCircle } from 'lucide-react';

// ============================================================================
// BASE DE DATOS LOCAL DE CASOS DE EMERGENCIA (5 Escenarios Aleatorios)
// ============================================================================
const EMERGENCY_CASES = [
  {
    id: 'flebitis',
    patient: 'Laura, 42 años',
    title: 'Flebitis Mecánica/Química Grado 2',
    description: 'Recibe analgesia intravenosa en bolo lento. Refiere ardor intenso y quemazón durante la infusión. A la inspección: eritema a lo largo del trayecto venoso y edema leve.',
    actions: [
      { id: 'f_1', text: 'Detener la infusión de forma inmediata.', isCorrect: true, order: 1 },
      { id: 'f_2', text: 'Retirar el catéter periférico con técnica aséptica.', isCorrect: true, order: 2 },
      { id: 'f_3', text: 'Aplicar compresas tibias y elevar el miembro.', isCorrect: true, order: 3 },
      { id: 'f_4', text: 'Registrar la flebitis y canalizar una vía en el brazo contrario.', isCorrect: true, order: 4 },
      { id: 'f_t1', text: 'Administrar un bolo de suero fisiológico a presión para destapar la vía.', isCorrect: false, order: 99 },
      { id: 'f_t2', text: 'Dar masaje vigoroso sobre la zona enrojecida para bajar la hinchazón.', isCorrect: false, order: 99 }
    ]
  },
  {
    id: 'infiltracion',
    patient: 'Mateo, 8 años',
    title: 'Infiltración de Solución no Vesicante',
    description: 'Paciente pediátrico con infusión continua. La bomba de infusión marca "Oclusión". La zona de punción está pálida, fría al tacto y presenta inflamación evidente (edema).',
    actions: [
      { id: 'i_1', text: 'Detener inmediatamente la infusión de la bomba.', isCorrect: true, order: 1 },
      { id: 'i_2', text: 'Retirar el catéter cuidadosamente.', isCorrect: true, order: 2 },
      { id: 'i_3', text: 'Elevar la extremidad para favorecer la reabsorción del líquido.', isCorrect: true, order: 3 },
      { id: 'i_4', text: 'Aplicar frío o calor local según el fluido infiltrado y documentar el evento.', isCorrect: true, order: 4 },
      { id: 'i_t1', text: 'Aumentar el flujo de la bomba para vencer la resistencia.', isCorrect: false, order: 99 },
      { id: 'i_t2', text: 'Vendar fuertemente el brazo para exprimir el líquido infiltrado.', isCorrect: false, order: 99 }
    ]
  },
  {
    id: 'extravasacion',
    patient: 'Roberto, 55 años',
    title: 'Extravasación de Fármaco Vesicante',
    description: 'Paciente oncológico recibiendo quimioterapia. Refiere dolor punzante extremo. Hay ausencia de retorno venoso y signos de necrosis tisular inminente.',
    actions: [
      { id: 'e_1', text: 'Detener la infusión INMEDIATAMENTE y desconectar el equipo, dejando el catéter colocado.', isCorrect: true, order: 1 },
      { id: 'e_2', text: 'NO RETIRAR el catéter aún. Aspirar la sangre y el fármaco residual por el catéter.', isCorrect: true, order: 2 },
      { id: 'e_3', text: 'Avisar al médico y administrar el antídoto según protocolo y orden médica.', isCorrect: true, order: 3 },
      { id: 'e_4', text: 'Retirar el catéter, elevar la extremidad y aplicar frío o calor según el fármaco.', isCorrect: true, order: 4 },
      { id: 'e_t1', text: 'Retirar el catéter de un tirón ante el primer síntoma de dolor.', isCorrect: false, order: 99 },
      { id: 'e_t2', text: 'Inyectar anestesia local en la zona sin orden médica.', isCorrect: false, order: 99 }
    ]
  },
  {
    id: 'arterial',
    patient: 'Sofía, 28 años',
    title: 'Punción Arterial Accidental',
    description: 'Durante un intento de canalización profunda en fosa antecubital, observas un retorno de sangre rojo brillante, pulsátil y a alta presión que empuja el émbolo.',
    actions: [
      { id: 'a_1', text: 'No avanzar el catéter y retirar la aguja/catéter inmediatamente.', isCorrect: true, order: 1 },
      { id: 'a_2', text: 'Aplicar presión directa y firme sobre el sitio de punción.', isCorrect: true, order: 2 },
      { id: 'a_3', text: 'Mantener la presión mínimo 5 a 10 minutos (más tiempo si usa anticoagulantes).', isCorrect: true, order: 3 },
      { id: 'a_4', text: 'Colocar vendaje compresivo y reevaluar el pulso distal.', isCorrect: true, order: 4 },
      { id: 'a_t1', text: 'Avanzar el catéter de todas formas porque ya hay retorno de sangre.', isCorrect: false, order: 99 },
      { id: 'a_t2', text: 'Poner un torniquete arterial en el brazo para detener el sangrado.', isCorrect: false, order: 99 }
    ]
  },
  {
    id: 'aire',
    patient: 'Don Carlos, 70 años',
    title: 'Embolia Gaseosa por Desconexión',
    description: 'Encuentras una vía venosa de grueso calibre desconectada del equipo de suero. El paciente presenta tos súbita, disnea (falta de aire) y cianosis.',
    actions: [
      { id: 'g_1', text: 'Pinzar o tapar el catéter inmediatamente para evitar más entrada de aire.', isCorrect: true, order: 1 },
      { id: 'g_2', text: 'Colocar al paciente en decúbito lateral izquierdo y Trendelenburg (maniobra de Durant).', isCorrect: true, order: 2 },
      { id: 'g_3', text: 'Administrar oxígeno suplementario al 100%.', isCorrect: true, order: 3 },
      { id: 'g_4', text: 'Activar código de emergencia y avisar al médico de urgencia.', isCorrect: true, order: 4 },
      { id: 'g_t1', text: 'Sentar al paciente a 90 grados para que pueda respirar mejor.', isCorrect: false, order: 99 },
      { id: 'g_t2', text: 'Reconectar el suero rápidamente y aumentar el flujo para purgar el aire.', isCorrect: false, order: 99 }
    ]
  }
];

export default function Level4Urgency() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  // EFECTO PROTECTOR DE RUTAS
  useEffect(() => {
    const unlocked = parseInt(localStorage.getItem('venotrain_unlockedLevel') || '1');
    if (unlocked < 4) {
      router.replace(`/levels/level-${unlocked}`);
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  const [activeCase, setActiveCase] = useState<any>(null);
  const [availableActions, setAvailableActions] = useState<any[]>([]);
  const [slots, setSlots] = useState<{ [key: number]: string }>({});
  const [comprobado, setComprobado] = useState(false);
  const [resultado, setResultado] = useState<{ exitoso: boolean, mensaje: string } | null>(null);

  // Gamificación y Tiempo
  const [gameStarted, setGameStarted] = useState(false);
  const [initialTime, setInitialTime] = useState(60); // Tiempo inicial para Código Rojo
  const [timeLeft, setTimeLeft] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Efecto del Temporizador
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTimerRunning && timeLeft > 0 && !comprobado) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && !comprobado) {
      setIsTimerRunning(false);
      setComprobado(true);
      setResultado({ exitoso: false, mensaje: '¡Tiempo agotado! La demora en actuar puso al paciente en riesgo grave.' });
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, timeLeft, comprobado]);

  // Iniciar Juego y Elegir Caso Aleatorio
  const startGame = () => {
    const randomCase = EMERGENCY_CASES[Math.floor(Math.random() * EMERGENCY_CASES.length)];
    setActiveCase(randomCase);
    setAvailableActions([...randomCase.actions].sort(() => Math.random() - 0.5));
    setTimeLeft(initialTime); 
    setGameStarted(true);
    setIsTimerRunning(true);
  };

  // ============================================================================
  // DRAG & DROP
  // ============================================================================
  const handleDragStart = (e: React.DragEvent, actionId: string) => {
    if (comprobado || !isTimerRunning) return;
    e.dataTransfer.setData('actionId', actionId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    if (comprobado || !isTimerRunning) return;
    
    const actionId = e.dataTransfer.getData('actionId');
    if (actionId) {
      setSlots(prev => {
        const newSlots = { ...prev };
        Object.keys(newSlots).forEach(key => {
          if (newSlots[parseInt(key)] === actionId) delete newSlots[parseInt(key)];
        });
        newSlots[slotIndex] = actionId;
        return newSlots;
      });
    }
  };

  const removeActionFromSlot = (slotIndex: number) => {
    if (comprobado || !isTimerRunning) return;
    setSlots(prev => {
      const newSlots = { ...prev };
      delete newSlots[slotIndex];
      return newSlots;
    });
  };

  // ============================================================================
  // VALIDACIÓN
  // ============================================================================
  const comprobarProtocolo = async () => {
    setIsTimerRunning(false);
    setComprobado(true);

    let isPerfect = true;
    let errorMsg = '';

    if (Object.keys(slots).length < 4) {
      isPerfect = false;
      errorMsg = 'Protocolo incompleto. Debes establecer 4 acciones de emergencia.';
    } else {
      for (let i = 1; i <= 4; i++) {
        const actionId = slots[i];
        const action = activeCase.actions.find((a: any) => a.id === actionId);
        
        if (!action?.isCorrect) {
          isPerfect = false;
          errorMsg = `¡ERROR CRÍTICO! "${action?.text}" empeorará severamente la situación del paciente.`;
          break;
        }
        if (action.order !== i) {
          isPerfect = false;
          errorMsg = 'Las acciones son correctas, pero el ORDEN es incorrecto en el protocolo de emergencia.';
          break;
        }
      }
    }

    setResultado({ exitoso: isPerfect, mensaje: isPerfect ? '¡Excelente! Protocolo aplicado correctamente. Paciente estabilizado.' : errorMsg });

    // DESBLOQUEAR EL SIGUIENTE NIVEL
    if (isPerfect) {
      const unlocked = parseInt(localStorage.getItem('venotrain_unlockedLevel') || '1');
      if (unlocked < 5) {
        localStorage.setItem('venotrain_unlockedLevel', '5');
      }
      
      try {
        await fetch('/api/scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ level: 4, score: 100, completed: true, timeSpent: initialTime - timeLeft, userId: localStorage.getItem('venotrain_userId') || 'default-user-id' })
        });
      } catch (e) { console.log(e) }
    }
  };

  const reintentar = () => {
    setSlots({});
    setComprobado(false);
    setResultado(null);
    setInitialTime(prev => Math.max(10, prev - 10)); // Penalización: -10s por intento (mínimo 10s)
    setGameStarted(false); // Vuelve a la pantalla de preparación
  };

  const isTimeCritical = timeLeft <= 10 && isTimerRunning;
  const timeColor = isTimeCritical ? 'text-red-500 animate-pulse' : 'text-cyan-400';
  const containerBg = isTimeCritical && !comprobado ? 'bg-red-950/20 border-red-900/50' : 'bg-[#0B1120] border-slate-900';

  if (!isAuthorized) return <div className="min-h-screen bg-[#0B1120]" />;

  return (
    <main className={`min-h-screen ${containerBg} p-4 md:p-8 flex flex-col items-center font-sans select-none transition-colors duration-500 border-[10px]`}>
      
      {/* HEADER DE EMERGENCIA */}
      <div className="max-w-6xl w-full mb-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-[#0F172A] p-6 rounded-2xl border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-4 w-full">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)] flex-shrink-0">
            <AlertTriangle className="w-8 h-8 text-red-500" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-wide">CÓDIGO DE URGENCIA</h1>
            <p className="text-slate-400 font-medium text-sm md:text-base">Resolución de Complicaciones Periféricas</p>
          </div>
        </div>
        
        {/* TEMPORIZADOR VISIBLE SOLO AL INICIAR */}
        {gameStarted && (
          <div className="flex flex-col items-end flex-shrink-0">
            <span className="text-xs text-slate-500 font-bold tracking-widest uppercase mb-1 flex items-center gap-2">
              <Clock className="w-3 h-3" /> Tiempo Restante
            </span>
            <div className={`text-5xl font-black tabular-nums ${timeColor}`}>
              00:{timeLeft.toString().padStart(2, '0')}
            </div>
          </div>
        )}
      </div>

      {!gameStarted ? (
        /* PANTALLA DE PREPARACIÓN (TEMA ROJO URGENCIA) */
        <div className="max-w-3xl w-full bg-[#1E293B] p-10 rounded-3xl border border-red-900/50 text-center shadow-[0_0_40px_rgba(220,38,38,0.15)] mt-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent pointer-events-none" />
          <ShieldAlert className="w-20 h-20 text-red-500 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(220,38,38,0.4)]" />
          
          <h2 className="text-3xl font-bold text-white mb-2">Simulador de Eventos Adversos</h2>
          <p className="text-slate-300 text-lg mb-6 leading-relaxed">
            Al iniciar, el sistema generará <span className="font-bold text-white">1 de 5 complicaciones clínicas</span> al azar. Tendrás que ordenar el protocolo correcto y descartar las trampas mortales antes de que colapse el paciente.
          </p>

          <div className="bg-[#0F172A] p-4 rounded-xl border border-slate-700 mb-8 inline-block">
            <span className="text-slate-400 text-sm block mb-1">Tiempo Límite Asignado:</span>
            <span className={`text-3xl font-black ${initialTime < 45 ? 'text-red-600 animate-pulse' : 'text-red-400'}`}>
              {initialTime} segundos
            </span>
            {initialTime < 45 && (
              <p className="text-xs text-red-400 mt-2 font-bold flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3" /> Tiempo penalizado por fallos previos.
              </p>
            )}
          </div>

          <button onClick={startGame} className="w-full md:w-auto px-12 py-4 bg-red-600 hover:bg-red-500 text-white font-black text-xl rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.5)] transition-transform hover:scale-105 flex items-center justify-center gap-3 mx-auto">
            <PlayCircle className="w-6 h-6" /> GENERAR CASO CLÍNICO
          </button>
        </div>
      ) : (
        /* TABLERO DE JUEGO */
        <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 transition-opacity duration-500">
          
          {/* PANEL IZQUIERDO: ACCIONES DISPONIBLES */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            
            <div className="bg-[#1E293B] p-5 rounded-xl border border-slate-700 shadow-md mb-2">
              <h3 className="text-cyan-400 font-bold text-lg mb-1">{activeCase.title}</h3>
              <h4 className="text-white font-medium mb-2">Paciente: {activeCase.patient}</h4>
              <p className="text-slate-300 text-sm leading-relaxed">{activeCase.description}</p>
            </div>

            <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1 px-2">Acciones Clínicas</h3>
            
            <div className="flex flex-col gap-3">
              {availableActions.filter((a: any) => !Object.values(slots).includes(a.id)).map((action: any) => (
                <div
                  key={action.id}
                  draggable={!comprobado && isTimerRunning}
                  onDragStart={(e) => handleDragStart(e, action.id)}
                  className={`p-4 rounded-xl cursor-grab active:cursor-grabbing border bg-[#1E293B] border-slate-600 shadow-md transition-colors flex items-center gap-3
                    ${(!isTimerRunning && !comprobado) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#334155]'}`}
                >
                  <Activity className="w-5 h-5 text-cyan-500 flex-shrink-0" />
                  <span className="text-slate-200 font-medium text-sm md:text-base leading-snug">{action.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* PANEL DERECHO: PROTOCOLO (ZONAS DE SOLTADO) */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-2 px-2 mt-2 lg:mt-0">Prioridad de Actuación</h3>
            
            <div className="bg-[#0F172A] p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col gap-3">
              {[1, 2, 3, 4].map(stepIndex => {
                const actionId = slots[stepIndex];
                const actionData = activeCase.actions.find((a: any) => a.id === actionId);

                let borderColor = 'border-slate-700';
                if (comprobado && actionData) {
                  borderColor = (actionData.isCorrect && actionData.order === stepIndex) ? 'border-emerald-500 bg-emerald-950/20' : 'border-red-500 bg-red-950/20';
                }

                return (
                  <div 
                    key={`slot-${stepIndex}`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, stepIndex)}
                    className={`relative min-h-[72px] flex items-center p-3 rounded-xl border-2 border-dashed transition-colors 
                      ${(!isTimerRunning && !comprobado) ? 'opacity-70 pointer-events-none' : ''}
                      ${actionId ? 'border-solid border-cyan-700 bg-[#1E293B]' : 'bg-[#0B1120]/50'} ${borderColor}`}
                  >
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-[#0F172A] border-2 border-slate-600 rounded-full flex items-center justify-center text-slate-400 font-black text-sm z-10">
                      {stepIndex}
                    </div>

                    <div className="w-full pl-6 pr-8">
                      {actionData ? (
                        <span className="text-white font-medium text-sm">{actionData.text}</span>
                      ) : (
                        <span className="text-slate-600 text-sm italic">Arrastra el paso {stepIndex} aquí...</span>
                      )}
                    </div>

                    {actionData && !comprobado && (
                      <button onClick={() => removeActionFromSlot(stepIndex)} className="absolute right-3 w-6 h-6 bg-slate-700 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-xs transition-colors">
                        ✕
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {/* BOTONES DE CONTROL */}
            <div className="mt-4">
              {!comprobado ? (
                <button 
                  onClick={comprobarProtocolo}
                  disabled={Object.keys(slots).length < 4 || !isTimerRunning}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg
                    ${Object.keys(slots).length === 4 
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]' 
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                >
                  EJECUTAR PROTOCOLO
                </button>
              ) : (
                <div className={`p-6 rounded-xl border flex flex-col gap-4 shadow-xl ${resultado?.exitoso ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
                  <div>
                    <h2 className={`text-2xl font-bold mb-2 flex items-center gap-2 ${resultado?.exitoso ? 'text-emerald-400' : 'text-red-400'}`}>
                      {resultado?.exitoso ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                      {resultado?.exitoso ? 'Paciente estabilizado/a' : 'Protocolo incorrecto'}
                    </h2>
                    <p className="text-slate-300 text-sm font-medium">{resultado?.mensaje}</p>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-4">
                    {!resultado?.exitoso ? (
                      <button onClick={reintentar} className="w-full py-3 bg-[#1E293B] hover:bg-[#334155] text-white rounded-lg font-bold border border-slate-700 transition-colors">
                        Intentar Otro Caso (-10s)
                      </button>
                    ) : (
                      <>
                        <button onClick={reintentar} className="w-full md:w-1/2 py-3 bg-[#1E293B] hover:bg-[#334155] text-white rounded-lg font-bold border border-slate-700 transition-colors">
                          Jugar Otro Caso
                        </button>
                        <Link href="/levels/level-5" className="w-full md:w-1/2 py-3 bg-cyan-600 hover:bg-cyan-500 text-white text-center rounded-lg font-bold shadow-lg transition-transform hover:scale-105">
                          Avanzar al Nivel 5 ➔
                        </Link>
                      </>
                    )}
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