'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Activity, HeartPulse, AlertOctagon, ShieldAlert, Award, FileText, ArrowRight, Skull, PlayCircle, AlertCircle, Clock } from 'lucide-react';

// ============================================================================
// PAQUETES DE FASES DE DECISIÓN CRÍTICA (5 escenarios x 3 decisiones)
// ============================================================================
const STAGE_PACKAGES = [
  // PAQUETE 1: Trauma / Shock Hipovolémico
  [
    {
      id: 1,
      title: 'DECISIÓN 1: Calibre y Flujo',
      context: 'Paciente politraumatizado ingresa en Shock Hipovolémico. Se prescribe reposición agresiva de volumen y hemoderivados a flujo rápido.',
      question: 'Según la Ley de Poiseuille, ¿qué catéter seleccionas para maximizar el flujo con menor resistencia?',
      options: [
        { text: 'Catéter 20G (Rosa) - Balance ideal', isCorrect: false, penaltyMsg: 'Flujo insuficiente para un shock. El paciente sigue hipovolémico.' },
        { text: 'Catéter 16G (Gris) o 14G (Naranja)', isCorrect: true },
        { text: 'Catéter 22G (Azul) con bomba de presión', isCorrect: false, penaltyMsg: 'Alta resistencia. La presión romperá los glóbulos rojos (hemólisis) y la vena.' }
      ]
    },
    {
      id: 2,
      title: 'DECISIÓN 2: Aseguramiento',
      context: 'Vía canalizada con éxito. El paciente será trasladado de urgencia a quirófano en camilla móvil.',
      question: '¿Cómo fijas el acceso venoso para resistir movilizaciones bruscas?',
      options: [
        { text: 'Esparadrapo tradicional en forma de corbata', isCorrect: false, penaltyMsg: 'El esparadrapo se humedece y no permite ver el punto de inserción.' },
        { text: 'Vendaje elástico compresivo sobre el brazo', isCorrect: false, penaltyMsg: 'Oculta totalmente la vía y puede generar isquemia distal.' },
        { text: 'Apósito transparente estéril de alta adherencia', isCorrect: true }
      ]
    },
    {
      id: 3,
      title: 'DECISIÓN 3: Alerta de Extravasación',
      context: 'Durante la infusión rápida (bolo), observas tumefacción súbita en el brazo y la bomba de infusión marca alerta de alta resistencia.',
      question: '¿Cuál es la acción inmediata ante la sospecha de extravasación en un paciente crítico?',
      options: [
        { text: 'Lavar la vía inyectando 10cc de suero fisiológico a presión.', isCorrect: false, penaltyMsg: '¡NEGLIGENCIA! Empujaste el líquido al tejido subcutáneo causando necrosis.' },
        { text: 'Detener la infusión, aspirar por el catéter, avisar y canalizar un segundo acceso contralateral.', isCorrect: true },
        { text: 'Retirar el catéter rápidamente y presionar con fuerza por 15 minutos.', isCorrect: false, penaltyMsg: 'Perdiste tiempo vital: nunca retires sin antes aspirar y avisar.' }
      ]
    }
  ],
  // PAQUETE 2: Shock Séptico
  [
    {
      id: 1,
      title: 'DECISIÓN 1: Calibre y Flujo',
      context: 'Paciente con shock séptico e hipotensión refractaria. Protocolo indica reposición de 30 mL/kg de cristaloides en la primera hora.',
      question: '¿Qué catéter eliges para infundir cristaloides con la rapidez que exige el protocolo de sepsis?',
      options: [
        { text: 'Catéter 24G (Amarillo)', isCorrect: false, penaltyMsg: 'Flujo demasiado bajo para reponer 30 mL/kg en una hora.' },
        { text: 'Catéter 16G o 18G en vena de buen calibre', isCorrect: true },
        { text: 'Catéter 14G en una vena distal muy fina', isCorrect: false, penaltyMsg: 'El vaso no soporta ese calibre: riesgo alto de infiltración inmediata.' }
      ]
    },
    {
      id: 2,
      title: 'DECISIÓN 2: Aseguramiento',
      context: 'El paciente está febril y profundamente diaforético (sudoración intensa). El apósito no logra adherirse bien a la piel.',
      question: '¿Qué tipo de fijación usas en este caso?',
      options: [
        { text: 'Apósito transparente de todas formas, porque permite ver el sitio', isCorrect: false, penaltyMsg: 'No se adhiere a piel húmeda: la vía queda inestable y se desaloja fácilmente.' },
        { text: 'Gasa estéril fijada con tela adhesiva hasta que ceda la diaforesis', isCorrect: true },
        { text: 'No fijar nada, ya total se cambiará en unas horas', isCorrect: false, penaltyMsg: 'Sin fijación el catéter se desplaza o se pierde con cualquier movimiento.' }
      ]
    },
    {
      id: 3,
      title: 'DECISIÓN 3: Extravasación de Vasopresor',
      context: 'El paciente recibe norepinefrina por vía periférica. Notas induración, palidez y dolor progresivo alrededor del punto de punción.',
      question: '¿Cuál es la conducta correcta ante la sospecha de extravasación de un vasopresor?',
      options: [
        { text: 'Aumentar la velocidad de infusión para no perder presión arterial', isCorrect: false, penaltyMsg: 'Empeora la vasoconstricción local: el tejido avanza hacia la necrosis.' },
        { text: 'Detener la infusión, dejar el catéter, avisar y aplicar el antídoto (fentolamina) según protocolo', isCorrect: true },
        { text: 'Retirar el catéter de inmediato sin avisar a nadie', isCorrect: false, penaltyMsg: 'Se pierde la vía de acceso para infiltrar el antídoto a tiempo.' }
      ]
    }
  ],
  // PAQUETE 3: Hemorragia Digestiva Alta
  [
    {
      id: 1,
      title: 'DECISIÓN 1: Calibre y Flujo',
      context: 'Paciente con hemorragia digestiva alta masiva y Hb crítica. Se indica transfusión urgente de concentrados de hematíes.',
      question: '¿Qué catéter garantiza una transfusión rápida y segura, sin dañar los eritrocitos?',
      options: [
        { text: 'Catéter 16G o 14G', isCorrect: true },
        { text: 'Catéter 22G con presión manual sobre la bolsa', isCorrect: false, penaltyMsg: 'El calibre pequeño bajo presión hemoliza los glóbulos rojos.' },
        { text: 'Catéter 24G, el único disponible en el carro', isCorrect: false, penaltyMsg: 'Insuficiente para transfusión urgente: el flujo es demasiado lento.' }
      ]
    },
    {
      id: 2,
      title: 'DECISIÓN 2: Aseguramiento',
      context: 'El paciente será trasladado a endoscopía de urgencia para control del sangrado. La vía debe resistir el traslado.',
      question: '¿Cómo aseguras el acceso para el traslado?',
      options: [
        { text: 'Apósito transparente estéril de alta adherencia', isCorrect: true },
        { text: 'Esparadrapo simple sin protección adicional', isCorrect: false, penaltyMsg: 'Se despega fácilmente durante el traslado y la manipulación.' },
        { text: 'Dejar la vía sin cubrir para "que respire"', isCorrect: false, penaltyMsg: 'Sin protección, el catéter se desaloja con cualquier roce.' }
      ]
    },
    {
      id: 3,
      title: 'DECISIÓN 3: Reacción Transfusional',
      context: 'A los pocos minutos de iniciar la transfusión, el paciente presenta fiebre súbita, escalofríos y dolor lumbar.',
      question: '¿Cuál es la primera acción ante la sospecha de una reacción transfusional?',
      options: [
        { text: 'Bajar el goteo y seguir transfundiendo para no desperdiciar la unidad', isCorrect: false, penaltyMsg: 'Continuar la transfusión puede agravar una reacción hemolítica grave.' },
        { text: 'Detener la transfusión de inmediato, mantener la vía con SF y avisar al médico y al banco de sangre', isCorrect: true },
        { text: 'Administrar paracetamol y continuar sin avisar a nadie', isCorrect: false, penaltyMsg: 'Enmascara los síntomas mientras la reacción sigue progresando.' }
      ]
    }
  ],
  // PAQUETE 4: Politraumatismo Pediátrico
  [
    {
      id: 1,
      title: 'DECISIÓN 1: Calibre y Flujo',
      context: 'Niño politraumatizado en shock. Sus venas son notablemente más pequeñas que las de un adulto.',
      question: '¿Qué calibre eliges para el acceso venoso periférico?',
      options: [
        { text: '14G o 16G, igual que en un adulto', isCorrect: false, penaltyMsg: 'Ese calibre puede perforar la pared de una vena pediátrica.' },
        { text: '20G o 22G, el mayor calibre que la vena del niño permita', isCorrect: true },
        { text: '24G, el más fino disponible, "para no lastimarlo"', isCorrect: false, penaltyMsg: 'Insuficiente para la reposición rápida de volumen que exige el shock.' }
      ]
    },
    {
      id: 2,
      title: 'DECISIÓN 2: Aseguramiento',
      context: 'El niño está agitado y llorando. Cualquier movimiento brusco puede desalojar el catéter.',
      question: '¿Cómo aseguras la vía en un paciente pediátrico inquieto?',
      options: [
        { text: 'Apósito transparente + tabla de inmovilización pediátrica en la articulación', isCorrect: true },
        { text: 'Sedar profundamente al niño solo para fijar la vía', isCorrect: false, penaltyMsg: 'Sedación innecesaria y riesgosa solo para un procedimiento de fijación.' },
        { text: 'Fijar con cinta sin ninguna inmovilización de la articulación', isCorrect: false, penaltyMsg: 'Sin inmovilizar la articulación, el catéter se dobla o se sale con el movimiento.' }
      ]
    },
    {
      id: 3,
      title: 'DECISIÓN 3: Fallo de Acceso Venoso',
      context: 'Han pasado más de 90 segundos y dos intentos fallidos de canalización periférica. El niño sigue en shock.',
      question: 'Según el protocolo PALS, ¿qué haces a continuación?',
      options: [
        { text: 'Suspender los intentos periféricos y colocar un acceso intraóseo', isCorrect: true },
        { text: 'Seguir intentando la vía periférica varias veces más', isCorrect: false, penaltyMsg: 'El protocolo PALS indica pasar a vía intraósea tras 2 intentos fallidos o 90 segundos.' },
        { text: 'Esperar a que llegue un especialista en accesos difíciles', isCorrect: false, penaltyMsg: 'La espera retrasa la reanimación de un paciente en shock activo.' }
      ]
    }
  ],
  // PAQUETE 5: Paciente Oncológico Neutropénico
  [
    {
      id: 1,
      title: 'DECISIÓN 1: Selección del Sitio',
      context: 'Paciente con antecedente de mastectomía derecha con vaciamiento axilar, ahora con neutropenia febril post-quimioterapia.',
      question: '¿En qué brazo canalizas la vía venosa periférica?',
      options: [
        { text: 'Brazo izquierdo (contralateral a la cirugía)', isCorrect: true },
        { text: 'Brazo derecho, es igual de válido', isCorrect: false, penaltyMsg: 'Riesgo de linfedema e infección por el vaciamiento axilar de ese lado.' },
        { text: 'Dorso del pie, para no tocar ninguno de los brazos', isCorrect: false, penaltyMsg: 'Mayor riesgo de infección y trombosis; no es un sitio de primera elección en adultos.' }
      ]
    },
    {
      id: 2,
      title: 'DECISIÓN 2: Aseguramiento y Asepsia',
      context: 'Paciente neutropénico: su bajo recuento de glóbulos blancos puede enmascarar los signos habituales de infección local.',
      question: '¿Qué cuidado es prioritario al fijar y vigilar esta vía?',
      options: [
        { text: 'Técnica aséptica estricta y revisión frecuente del sitio, aunque no haya signos evidentes de inflamación', isCorrect: true },
        { text: 'Reutilizar el mismo set de curación en varios pacientes para ahorrar tiempo', isCorrect: false, penaltyMsg: 'Rompe la asepsia y expone al paciente neutropénico a infecciones graves.' },
        { text: 'Espaciar las revisiones porque "no se ve nada raro"', isCorrect: false, penaltyMsg: 'En neutropenia los signos de infección pueden estar ausentes o ser mínimos.' }
      ]
    },
    {
      id: 3,
      title: 'DECISIÓN 3: Reacción de Hipersensibilidad',
      context: 'Durante la infusión del antibiótico, el paciente presenta urticaria súbita, disnea e hipotensión.',
      question: '¿Cuál es la acción inmediata ante una sospecha de anafilaxia?',
      options: [
        { text: 'Bajar el goteo pero seguir infundiendo para no perder el fármaco', isCorrect: false, penaltyMsg: 'Continuar la infusión empeora la reacción anafiláctica en curso.' },
        { text: 'Detener la infusión, mantener la vía con SF, avisar al equipo y preparar adrenalina según protocolo', isCorrect: true },
        { text: 'Administrar paracetamol y esperar a ver cómo evoluciona', isCorrect: false, penaltyMsg: 'La anafilaxia progresa rápido; esperar puede ser fatal.' }
      ]
    }
  ]
];

export default function Level5Critical() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  // EFECTO PROTECTOR DE RUTAS
  useEffect(() => {
    const unlocked = parseInt(localStorage.getItem('venotrain_unlockedLevel') || '1');
    if (unlocked < 5) {
      router.replace(`/levels/level-${unlocked}`);
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  const [stage, setStage] = useState(0); // 0: Inicio, 1-3: Fases, 4: Certificado, -1: Game Over
  const [activeStages, setActiveStages] = useState(STAGE_PACKAGES[0]);
  const [bloodPressure, setBloodPressure] = useState({ sys: 80, dia: 50 });
  const [heartRate, setHeartRate] = useState(128);
  
  // Gamificación y Tiempo
  const [initialTime, setInitialTime] = useState(60); // Tiempo base
  const [timeToCrash, setTimeToCrash] = useState(60); // Contador regresivo
  
  const [fatalError, setFatalError] = useState('');
  const [metrics, setMetrics] = useState({ precision: 100, biosecurity: 100, resolution: 100 });

  // Simulador de Signos Vitales (Degradación constante)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (stage > 0 && stage <= 3 && timeToCrash > 0) {
      timer = setInterval(() => {
        setTimeToCrash(prev => prev - 1);
        
        // Empeorar signos vitales
        if (timeToCrash % 3 === 0) {
          setBloodPressure(prev => ({ sys: Math.max(40, prev.sys - 1), dia: Math.max(20, prev.dia - 1) }));
          setHeartRate(prev => Math.min(180, prev + 1));
        }
      }, 1000);
    } else if (timeToCrash === 0 && stage > 0 && stage <= 3) {
      triggerGameOver('Paro Cardiorrespiratorio irreversible por shock hipovolémico prolongado.');
    }
    return () => clearInterval(timer);
  }, [stage, timeToCrash]);

  const startGame = () => {
    const randomPackage = STAGE_PACKAGES[Math.floor(Math.random() * STAGE_PACKAGES.length)];
    setActiveStages(randomPackage);
    setStage(1);
    setTimeToCrash(initialTime);
    setBloodPressure({ sys: 80, dia: 50 });
    setHeartRate(128);
  };

  const triggerGameOver = (reason: string) => {
    setFatalError(reason);
    setStage(-1);
    
    fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: 5, score: 0, completed: false, timeSpent: initialTime - timeToCrash, userId: localStorage.getItem('venotrain_userId') || 'default-user-id' })
    }).catch(console.error);
  };

  const handleDecision = (isCorrect: boolean, penaltyMsg?: string) => {
    if (!isCorrect) {
      triggerGameOver(penaltyMsg || 'Decisión clínica incorrecta.');
      return;
    }

    // Acierto: Mejorar levemente signos vitales y avanzar
    setBloodPressure(prev => ({ sys: prev.sys + 10, dia: prev.dia + 5 }));
    setHeartRate(prev => prev - 10);

    if (stage === 3) {
      finishGameSuccess();
    } else {
      setStage(stage + 1);
    }
  };

  const finishGameSuccess = () => {
    const finalPrecision = timeToCrash > 20 ? 100 : 85;
    const finalResolution = timeToCrash > 10 ? 100 : 70;
    const finalScore = Math.round((finalPrecision + 100 + finalResolution) / 3);
    
    setMetrics({ precision: finalPrecision, biosecurity: 100, resolution: finalResolution });
    setStage(4);

    fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: 5, score: finalScore, completed: true, timeSpent: initialTime - timeToCrash, userId: localStorage.getItem('venotrain_userId') || 'default-user-id' })
    }).catch(console.error);
  };

  const restartSimulation = () => {
    setStage(0);
    setFatalError('');
    setInitialTime(prev => Math.max(15, prev - 15)); // Penalización de tiempo: mínimo 15s
  };

  const isCritical = bloodPressure.sys <= 65;
  const monitorGlow = isCritical ? 'shadow-[0_0_30px_rgba(239,68,68,0.3)] border-red-900' : 'shadow-[0_0_20px_rgba(6,182,212,0.1)] border-slate-800';

  if (!isAuthorized) return <div className="min-h-screen bg-[#0B1120]" />;

  return (
    <main className="min-h-screen bg-[#0B1120] p-4 md:p-8 flex flex-col items-center font-sans select-none overflow-x-hidden">
      
      {/* HEADER ESTÁNDAR (Visible en Preparación, Game Over y Certificado) */}
      {!(stage > 0 && stage <= 3) && (
        <div className="max-w-6xl w-full mb-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-[#0F172A] p-6 rounded-2xl border border-slate-800 shadow-xl">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Nivel 5: Shock Hipovolémico</h1>
            <p className="text-slate-400">Toma de decisiones críticas en cadena bajo extrema presión.</p>
          </div>
        </div>
      )}

      {/* MONITOR DE SIGNOS VITALES (Reemplaza al header durante el juego) */}
      {(stage > 0 && stage <= 3) && (
        <div className={`w-full max-w-5xl bg-[#050B14] rounded-2xl p-6 flex flex-wrap justify-between items-center mb-8 border-2 transition-all ${monitorGlow}`}>
          
          <div className="flex flex-col px-4 md:px-6 border-r border-slate-800">
            <span className="text-slate-500 text-xs font-black tracking-widest mb-1">NIBP (mmHg)</span>
            <div className={`text-4xl md:text-5xl font-black font-mono tabular-nums ${isCritical ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
              {bloodPressure.sys}<span className="text-2xl md:text-3xl text-slate-400">/{bloodPressure.dia}</span>
            </div>
          </div>

          <div className="flex flex-col px-4 md:px-6 border-r border-slate-800">
            <span className="text-slate-500 text-xs font-black tracking-widest mb-1 flex items-center gap-1">
              <HeartPulse className={isCritical ? 'text-red-500 animate-ping' : 'text-emerald-500'} size={14} /> HR (BPM)
            </span>
            <div className={`text-4xl md:text-5xl font-black font-mono tabular-nums ${isCritical ? 'text-red-500' : 'text-emerald-400'}`}>
              {heartRate}
            </div>
          </div>

          <div className="flex flex-col px-4 md:px-6 items-end">
            <span className="text-slate-500 text-xs font-black tracking-widest mb-1">ESTADO PACIENTE</span>
            <div className={`text-xl md:text-2xl font-black uppercase ${isCritical ? 'text-red-500 animate-pulse' : 'text-amber-500'}`}>
              {isCritical ? 'RIESGO DE PARO' : 'CRISIS CLÍNICA'}
            </div>
            <div className="text-slate-400 text-sm font-mono mt-1 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Colapso en: <span className={timeToCrash <= 15 ? 'text-red-400 font-bold text-lg' : ''}>{timeToCrash}s</span>
            </div>
          </div>
        </div>
      )}

      {/* PANTALLA DE PREPARACIÓN */}
      {stage === 0 && (
        <div className="max-w-3xl w-full bg-[#1E293B] p-10 rounded-3xl border border-red-900/50 text-center shadow-[0_0_40px_rgba(220,38,38,0.15)] mt-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent pointer-events-none" />
          <AlertOctagon className="w-20 h-20 text-red-500 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(220,38,38,0.4)]" />
          
          <h2 className="text-3xl font-bold text-white mb-2">Código Rojo: Reanimación</h2>
          <p className="text-slate-300 text-lg mb-6 leading-relaxed">
            Ingresas a la zona de Trauma. El tiempo es tu peor enemigo. Cada decisión incorrecta causará el colapso hemodinámico del paciente. Tendrás que resolver <span className="font-bold text-white">3 fases críticas en cadena</span>.
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

          <button onClick={startGame} className="w-full md:w-auto px-12 py-4 bg-red-600 hover:bg-red-500 text-white font-black text-xl rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.5)] transition-transform hover:scale-105 flex items-center justify-center gap-3 mx-auto border border-red-500">
            <PlayCircle className="w-6 h-6" /> ASUMIR EL MANDO
          </button>
        </div>
      )}

      {/* FASES CRÍTICAS */}
      {(stage > 0 && stage <= 3) && (
        <div className="w-full max-w-4xl flex flex-col gap-6">
          <div className="bg-[#1E293B] p-8 rounded-2xl border border-slate-700 shadow-2xl">
            <div className="inline-block px-4 py-1 bg-cyan-950 border border-cyan-800 text-cyan-400 rounded-full text-xs font-black tracking-widest mb-4">
              {activeStages[stage - 1].title}
            </div>
            <h3 className="text-xl text-slate-300 mb-6 italic border-l-4 border-slate-600 pl-4">{activeStages[stage - 1].context}</h3>
            <p className="text-2xl font-bold text-white mb-8 leading-snug">
              {activeStages[stage - 1].question}
            </p>

            <div className="flex flex-col gap-4">
              {activeStages[stage - 1].options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleDecision(option.isCorrect, option.penaltyMsg)}
                  className="w-full text-left p-5 bg-[#0F172A] hover:bg-[#334155] border border-slate-700 rounded-xl transition-all hover:translate-x-2 hover:border-cyan-500 group flex items-center justify-between"
                >
                  <span className="text-slate-200 font-medium text-lg group-hover:text-white pr-4">{option.text}</span>
                  <ArrowRight className="text-slate-600 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER (Muerte del Paciente) */}
      {stage === -1 && (
        <div className="max-w-2xl w-full bg-red-950/50 border-2 border-red-600 p-10 rounded-3xl text-center shadow-[0_0_50px_rgba(220,38,38,0.2)] mt-4">
          <Skull className="w-24 h-24 text-red-500 mx-auto mb-6" />
          <h2 className="text-4xl font-black text-white mb-2">SIMULACIÓN FALLIDA</h2>
          <div className="text-red-400 font-bold text-xl mb-6">El paciente no sobrevivió.</div>
          
          <div className="bg-[#0B1120] p-6 rounded-xl border border-red-900/50 mb-8 text-left shadow-inner">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-2">
              <AlertOctagon className="w-4 h-4" /> Causa del fallo crítico:
            </span>
            <p className="text-slate-200 text-lg leading-relaxed">{fatalError}</p>
          </div>

          <button onClick={restartSimulation} className="w-full py-4 bg-red-700 hover:bg-red-600 text-white font-bold text-xl rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2">
            Solicitar Nuevo Ingreso (-15s)
          </button>
        </div>
      )}

      {/* CERTIFICADO DE COMPETENCIA (Victoria) */}
      {stage === 4 && (
        <div className="max-w-3xl w-full bg-slate-900 border border-slate-700 p-1 rounded-3xl mt-4 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-cyan-500/10 pointer-events-none" />
          
          <div className="bg-[#0B1120] p-10 rounded-[22px] border border-slate-800 text-center relative z-10">
            <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full mx-auto flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
              <Award className="w-12 h-12 text-white" strokeWidth={2} />
            </div>
            
            <h4 className="text-amber-500 font-bold tracking-widest uppercase text-sm mb-2">Avalado por Plataforma Educativa</h4>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-8 leading-tight">
              Certificado de Competencia VENOTRAIN
            </h2>
            
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              Has completado con éxito la ruta tecnopedagógica de VENOTRAIN: desde el reconocimiento anatómico asistido hasta el manejo de situaciones críticas en entornos clínicos simulados.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              <div className="bg-[#0F172A] p-4 rounded-xl border border-slate-800 flex flex-col items-center">
                <Activity className="w-6 h-6 text-cyan-500 mb-2" />
                <span className="text-slate-500 text-xs font-bold uppercase mb-1">Precisión Anatómica</span>
                <span className="text-2xl font-black text-white">{metrics.precision}%</span>
              </div>
              <div className="bg-[#0F172A] p-4 rounded-xl border border-slate-800 flex flex-col items-center">
                <ShieldAlert className="w-6 h-6 text-emerald-500 mb-2" />
                <span className="text-slate-500 text-xs font-bold uppercase mb-1">Bioseguridad</span>
                <span className="text-2xl font-black text-white">{metrics.biosecurity}%</span>
              </div>
              <div className="bg-[#0F172A] p-4 rounded-xl border border-slate-800 flex flex-col items-center">
                <FileText className="w-6 h-6 text-amber-500 mb-2" />
                <span className="text-slate-500 text-xs font-bold uppercase mb-1">Resolución Crítica</span>
                <span className="text-2xl font-black text-white">{metrics.resolution}%</span>
              </div>
            </div>

            <Link href="/" className="inline-flex items-center justify-center px-10 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg transition-transform hover:scale-105">
              Volver al Menú Principal
            </Link>
          </div>
        </div>
      )}

    </main>
  );
}