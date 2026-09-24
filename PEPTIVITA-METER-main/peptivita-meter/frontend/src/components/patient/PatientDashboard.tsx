'use client'

import { useState, useEffect } from 'react'
import { supabase, type Patient, classifyWHR, classifyFrameSize } from '@/lib/supabase'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from 'recharts'

// ── IMC Widget ───────────────────────────────────────────────
function IMCPatientWidget({ weight, height, goalWeight, initialWeight, isMobile }: {
  weight: number; height: number; goalWeight?: number; initialWeight?: number; isMobile: boolean
}) {
  const imc = weight / Math.pow(height / 100, 2)
  const idealMin = Math.round(20 * Math.pow(height / 100, 2) * 10) / 10
  const idealMax = Math.round(25 * Math.pow(height / 100, 2) * 10) / 10
  const diff = weight - idealMax
  const kgToIdeal = diff > 0 ? diff : 0

  const getCategory = (v: number) => {
    if (v < 18.5) return { label: 'Bajo peso',   color: '#0284c7',  emoji: '💙', msg: 'Trabajando para alcanzar el peso óptimo.' }
    if (v < 25)   return { label: 'Normal ✓',    color: '#16a34a', emoji: '💚', msg: '¡En rango ideal! Mantén el ritmo.' }
    if (v < 30)   return { label: 'Sobrepeso',   color: '#d97706', emoji: '🌟', msg: 'Vas por buen camino. Cada kg menos es una victoria.' }
    if (v < 35)   return { label: 'Obesidad I',  color: '#ea580c',       emoji: '🔥', msg: '¡Tu dedicación está dando resultados!' }
    if (v < 40)   return { label: 'Obesidad II', color: '#dc2626',   emoji: '💪', msg: 'El camino es largo pero ya empezaste.' }
    return               { label: 'Obesidad III',color: '#dc2626',   emoji: '🚀', msg: 'Has dado el paso más importante: comenzar.' }
  }

  const cat = getCategory(imc)
  const imcBarPct = Math.min(100, Math.max(0, ((imc - 15) / 30) * 100))

  let progressPct = 100
  if (initialWeight && initialWeight > idealMax && diff > 0) {
    const totalToLose = initialWeight - idealMax
    const lost = initialWeight - weight
    progressPct = Math.min(100, Math.max(0, (lost / totalToLose) * 100))
  } else if (diff <= 0) {
    progressPct = 100
  }

  return (
    <div style={{
      background: '#ffffff', border: `1px solid ${cat.color}40`,
      borderRadius: '16px', padding: isMobile ? '20px' : '24px', marginBottom: '24px', position: 'relative', overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
    }}>
      <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: `${cat.color}10`, filter: 'blur(40px)' }} />
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '20px' : '24px', position: 'relative' }}>
        {/* IMC */}
        <div>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '8px' }}>ÍNDICE DE MASA CORPORAL</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '42px', fontWeight: 700, fontFamily: 'monospace', color: cat.color, lineHeight: 1 }}>{imc.toFixed(1)}</span>
            <span style={{ fontSize: '14px', color: '#64748b' }}>kg/m²</span>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: `${cat.color}15`, color: cat.color, padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>
            {cat.emoji} {cat.label}
          </div>
          <div style={{ position: 'relative', marginBottom: '6px' }}>
            <div style={{ height: '10px', borderRadius: '999px', overflow: 'hidden', display: 'flex', background: '#e2e8f0' }}>
              <div style={{ width: '23%', background: '#0284c7', opacity: 0.7 }} />
              <div style={{ width: '22%', background: '#16a34a', opacity: 0.7 }} />
              <div style={{ width: '17%', background: '#d97706', opacity: 0.7 }} />
              <div style={{ width: '17%', background: '#ea580c', opacity: 0.7 }} />
              <div style={{ width: '21%', background: '#dc2626', opacity: 0.7 }} />
            </div>
            <div style={{ position: 'absolute', top: '-3px', left: `calc(${imcBarPct}% - 8px)`, width: '16px', height: '16px', borderRadius: '50%', background: cat.color, border: '2px solid #ffffff', boxShadow: `0 0 8px ${cat.color}` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
            <span>15</span><span>18.5</span><span>25</span><span>30</span><span>35</span><span>45</span>
          </div>
          <div style={{ marginTop: '12px', fontSize: '13px', color: '#475569' }}>
            Rango ideal: <span style={{ color: '#16a34a', fontWeight: 600 }}>{idealMin} – {idealMax} kg</span>
          </div>
        </div>
        {/* Progreso */}
        <div>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '8px' }}>PROGRESO HACIA PESO IDEAL</div>
          {progressPct >= 100 ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '8px' }}>🏆</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#16a34a' }}>¡Meta alcanzada!</div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                <span style={{ fontSize: '32px', fontWeight: 700, fontFamily: 'monospace', color: '#16a34a' }}>{progressPct.toFixed(0)}%</span>
                {kgToIdeal > 0 && <span style={{ fontSize: '13px', color: '#475569' }}>Faltan <b style={{ color: '#d97706' }}>{kgToIdeal.toFixed(1)} kg</b></span>}
              </div>
              <div style={{ background: '#e2e8f0', borderRadius: '999px', height: '12px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{ height: '100%', borderRadius: '999px', width: `${progressPct}%`, background: 'linear-gradient(90deg, #2563eb, #16a34a)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', marginBottom: '12px' }}>
                <span>Inicio</span><span>25%</span><span>50%</span><span>75%</span><span>Meta ✓</span>
              </div>
            </div>
          )}
          <div style={{ background: `${cat.color}10`, border: `1px solid ${cat.color}30`, borderRadius: '10px', padding: '12px', fontSize: '13px', color: '#334155', lineHeight: '1.5', fontStyle: 'italic' }}>
            {cat.emoji} {cat.msg}
          </div>
        </div>
      </div>
    </div>
  )
}

type Tab = 'dashboard' | 'measurements' | 'labs' | 'photos' | 'history'

export default function PatientDashboard({ patient, onLogout }: { patient: Patient; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [consultations, setConsultations] = useState<any[]>([])
  const [anthropoHistory, setAnthroHistory] = useState<any[]>([])
  const [latestAnthro, setLatestAnthro] = useState<any>(null)
  const [latestNotes, setLatestNotes] = useState('')
  const [activePeptides, setActivePeptides] = useState<any[]>([])
  const [labResults, setLabResults] = useState<any[]>([])
  const [photos, setPhotos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Detector de pantallas móviles
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const { data: consults, error: consultErr } = await supabase
      .from('consultations').select('*')
      .eq('patient_id', patient.id)
      .order('consultation_date', { ascending: true })

    if (consultErr) console.error('Error consultations:', consultErr)
    setConsultations(consults || [])

    if (consults && consults.length > 0) {
      const ids = consults.map((c: any) => c.id)
      const dateById: Record<string, string> = {}
      consults.forEach((c: any) => { dateById[c.id] = c.consultation_date })

      const latest = consults[consults.length - 1]
      setLatestNotes(latest.notes_specialist || '')

      const { data: anthrosRaw, error: anthroErr } = await supabase
        .from('anthropometrics').select('*')
        .in('consultation_id', ids)
      if (anthroErr) console.error('Error anthropometrics:', anthroErr)

      const anthros = (anthrosRaw || []).map((a: any) => ({
        ...a, consultations: { consultation_date: dateById[a.consultation_id] }
      }))
      const sorted = anthros.sort((a: any, b: any) =>
        new Date(a.consultations.consultation_date).getTime() - new Date(b.consultations.consultation_date).getTime()
      )
      setAnthroHistory(sorted)
      if (sorted.length > 0) setLatestAnthro(sorted[sorted.length - 1])

      const { data: peps, error: pepErr } = await supabase
        .from('peptide_treatments').select('*')
        .in('consultation_id', ids).eq('is_active', true)
      if (pepErr) console.error('Error peptides:', pepErr)
      setActivePeptides(peps || [])

      const { data: labsRaw, error: labErr } = await supabase
        .from('lab_results').select('*')
        .in('consultation_id', ids)
      if (labErr) console.error('Error labs:', labErr)

      const labs = (labsRaw || []).map((l: any) => ({
        ...l, consultations: { consultation_date: dateById[l.consultation_id] }
      }))
      setLabResults(labs)

      const { data: ph, error: phErr } = await supabase
        .from('progress_photos').select('*')
        .eq('patient_id', patient.id).order('photo_date', { ascending: false })
      if (phErr) console.error('Error photos:', phErr)
      setPhotos(ph || [])
    }
    setLoading(false)
  }

  const initialWeight = patient.initial_weight || anthropoHistory[0]?.weight_kg
  const currentWeight = latestAnthro?.weight_kg
  const pctLost = initialWeight && currentWeight
    ? ((initialWeight - currentWeight) / initialWeight * 100).toFixed(1) : null
  const goalWeight = patient.goal_weight
  const progressToGoal = initialWeight && goalWeight && currentWeight
    ? Math.min(100, Math.max(0, ((initialWeight - currentWeight) / (initialWeight - goalWeight) * 100))) : null
  const whr = latestAnthro?.waist_hip_ratio
  const whrClass = whr && patient.gender ? classifyWHR(whr, patient.gender as any) : null

  const chartData = anthropoHistory.map((a: any) => ({
    date: a.consultations?.consultation_date?.slice(0, 10) || '',
    peso: a.weight_kg, grasa: a.body_fat_pct, musculo: a.muscle_mass_kg,
  }))

  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: 'dashboard',    icon: '🏠', label: 'Resumen' },
    { id: 'measurements', icon: '📏', label: 'Medidas' },
    { id: 'labs',         icon: '🧪', label: 'Laboratorio' },
    { id: 'photos',       icon: '📸', label: 'Progreso' },
    { id: 'history',      icon: '📋', label: 'Historial' },
  ]

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧬</div>
        <p style={{ color: '#64748b', fontWeight: 500 }}>Cargando tu dashboard...</p>
      </div>
    </div>
  )

  const firstName = patient.full_name?.split(' ')[0] || 'Paciente'

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '100dvh', background: '#f8fafc', color: '#0f172a' }}>
      
      {/* ── HEADER MÓVIL ── */}
      {isMobile && (
        <header style={{ padding: '16px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🧬</span>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>{firstName}</div>
          </div>
          <button 
            onClick={onLogout} 
            style={{ fontSize: '12px', padding: '6px 12px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#475569', cursor: 'pointer', fontWeight: 500 }}
          >
            Salir
          </button>
        </header>
      )}

      {/* ── SIDEBAR ESCRITORIO ── */}
      {!isMobile && (
        <aside style={{ width: '220px', minWidth: '220px', background: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', padding: '24px 16px' }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '20px' }}>🧬</span>
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>PeptiLytics</span>
            </div>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600, marginBottom: '2px' }}>BIENVENIDO/A</div>
              <div style={{ fontSize: '14px', fontWeight: 700, lineHeight: 1.3, color: '#0f172a' }}>{patient.full_name}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>CI: {patient.cedula}</div>
            </div>
          </div>
          <nav style={{ flex: 1 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: tab === t.id ? '#eff6ff' : 'transparent', color: tab === t.id ? '#2563eb' : '#64748b', fontSize: '14px', fontWeight: tab === t.id ? 600 : 500, marginBottom: '4px', textAlign: 'left', transition: 'all 0.15s' }}>
                {t.icon} {t.label}
              </button>
            ))}
          </nav>
          <button 
            onClick={onLogout} 
            style={{ width: '100%', padding: '8px', fontSize: '13px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#475569', cursor: 'pointer', fontWeight: 500 }}
          >
            Cerrar sesión
          </button>
        </aside>
      )}

      {/* ── CONTENIDO PRINCIPAL ── */}
      <main style={{ 
        flex: 1, overflowY: 'auto', overflowX: 'hidden', 
        padding: isMobile ? '20px 16px calc(80px + env(safe-area-inset-bottom)) 16px' : '32px',
        WebkitOverflowScrolling: 'touch' 
      }}>

        {/* DASHBOARD */}
        {tab === 'dashboard' && (
          <div>
            <div style={{ marginBottom: isMobile ? '20px' : '28px' }}>
              <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: isMobile ? '22px' : '26px', fontWeight: 700, margin: '0 0 4px', color: '#0f172a' }}>
                Hola, {firstName} 👋
              </h1>
              <p style={{ color: '#64748b', fontSize: '14px', margin: 0, fontWeight: 500 }}>Tu resumen de progreso</p>
            </div>

            {latestNotes && (
              <div style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.04), rgba(2,132,199,0.04))', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
                <div style={{ fontSize: '12px', color: '#2563eb', fontWeight: 700, marginBottom: '8px', letterSpacing: '0.5px' }}>📋 NOTAS DEL ESPECIALISTA</div>
                <p style={{ margin: 0, lineHeight: '1.6', fontSize: '14px', color: '#334155' }}>{latestNotes}</p>
              </div>
            )}

            {/* KPIs adaptables */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: isMobile ? '12px' : '16px', marginBottom: '24px' }}>
              <KPICard icon="⚖️" label="Peso Actual" value={currentWeight ? `${currentWeight} kg` : '—'} sub={initialWeight ? `Inicial: ${initialWeight} kg` : undefined} color="#2563eb" />
              <KPICard icon="🔥" label="Grasa Corporal" value={latestAnthro?.body_fat_pct ? `${latestAnthro.body_fat_pct}%` : '—'} sub={patient.goal_fat_pct ? `Meta: ${patient.goal_fat_pct}%` : undefined} color="#d97706" />
              <KPICard icon="📉" label="Peso Perdido" value={pctLost ? `${pctLost}%` : '—'} sub={pctLost ? `${(Number(pctLost)/100*(initialWeight||0)).toFixed(1)} kg totales` : undefined} color="#16a34a" />
              <KPICard icon="💪" label="Masa Muscular" value={latestAnthro?.muscle_mass_kg ? `${latestAnthro.muscle_mass_kg} kg` : '—'} color="#7c3aed" />
              {whr && <KPICard icon="📐" label="ICC" value={whr.toFixed(3)} sub={whrClass?.label} color={whrClass?.color || '#2563eb'} />}
            </div>

            {/* Progreso */}
            {progressToGoal !== null && (
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>🎯 Hacia tu meta</span>
                  <span style={{ color: '#16a34a', fontWeight: 700, fontFamily: 'monospace' }}>{progressToGoal.toFixed(0)}%</span>
                </div>
                <div style={{ background: '#e2e8f0', borderRadius: '999px', height: '10px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: '999px', width: `${progressToGoal}%`, background: '#16a34a' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: '#64748b' }}>
                  <span>Inicio: {initialWeight} kg</span><span>Meta: {goalWeight} kg</span>
                </div>
              </div>
            )}

            {/* Widget IMC */}
            {latestAnthro?.weight_kg && latestAnthro?.height_cm && (
              <IMCPatientWidget weight={latestAnthro.weight_kg} height={latestAnthro.height_cm} goalWeight={patient.goal_weight} initialWeight={initialWeight} isMobile={isMobile} />
            )}

            {/* Gráficos apilados en móvil */}
            {chartData.length > 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <ChartCard title="📈 Evolución de Peso" color="#2563eb">
                  <AreaChart data={chartData}>
                    <defs><linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} width={30} />
                    <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a' }} />
                    <Area type="monotone" dataKey="peso" stroke="#2563eb" fill="url(#wGrad)" strokeWidth={2} name="Peso (kg)" />
                  </AreaChart>
                </ChartCard>
                <ChartCard title="🔥 % Grasa Corporal" color="#d97706">
                  <AreaChart data={chartData}>
                    <defs><linearGradient id="fGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#d97706" stopOpacity={0.2}/><stop offset="95%" stopColor="#d97706" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} width={30} />
                    <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a' }} />
                    <Area type="monotone" dataKey="grasa" stroke="#d97706" fill="url(#fGrad)" strokeWidth={2} name="% Grasa" />
                  </AreaChart>
                </ChartCard>
              </div>
            )}

            {/* Péptidos */}
            {activePeptides.length > 0 && (
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '16px', fontWeight: 700, margin: '0 0 16px', color: '#0f172a' }}>💉 Tratamiento Activo</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                  {activePeptides.map((pep: any) => (
                    <div key={pep.id} style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: 700, marginBottom: '8px', color: '#2563eb' }}>{pep.peptide_name}</div>
                      <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.8 }}>
                        <div>💊 Dosis: <b>{pep.dose_value} {pep.dose_unit}</b></div>
                        <div>🔄 Frecuencia: <b>{pep.frequency}</b></div>
                        <div>💉 Vía: <b>{pep.administration_route}</b></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── COMPONENTES SECUNDARIOS PASANDO isMobile ── */}
        {tab === 'measurements' && <MeasurementsPanel anthropoHistory={anthropoHistory} consultations={consultations} isMobile={isMobile} />}
        {tab === 'labs' && <LabPanel labResults={labResults} isMobile={isMobile} />}
        {tab === 'photos' && <PhotosPanel photos={photos} isMobile={isMobile} />}
        {tab === 'history' && <HistoryPanel consultations={consultations} anthropoHistory={anthropoHistory} isMobile={isMobile} />}
      </main>

      {/* ── NAVEGACIÓN INFERIOR MÓVIL (iOS Safe Area) ── */}
      {isMobile && (
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#ffffff', borderTop: '1px solid #e2e8f0',
          display: 'flex', justifyContent: 'space-around', alignItems: 'center',
          height: 'calc(65px + env(safe-area-inset-bottom))',
          paddingBottom: 'env(safe-area-inset-bottom)',
          zIndex: 1000, boxShadow: '0 -4px 20px rgba(0,0,0,0.05)'
        }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                padding: '8px', border: 'none', background: 'none', flex: 1,
                color: tab === t.id ? '#2563eb' : '#94a3b8',
                cursor: 'pointer', transition: 'all 0.15s'
              }}>
              <span style={{ fontSize: '20px', opacity: tab === t.id ? 1 : 0.6 }}>{t.icon}</span>
              <span style={{ fontSize: '10px', fontWeight: tab === t.id ? 700 : 500 }}>{t.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}

// ── Sub-components ajustados para móvil ───────────────────────────────────────────

function KPICard({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub?: string; color: string }) {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
      <div style={{ fontSize: '20px', marginBottom: '6px' }}>{icon}</div>
      <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '2px' }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: '20px', fontWeight: 700, color, fontFamily: 'monospace', marginBottom: '2px' }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: '#64748b' }}>{sub}</div>}
    </div>
  )
}

function ChartCard({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
      <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 700, margin: '0 0 16px', color: '#0f172a' }}>{title}</h3>
      <ResponsiveContainer width="100%" height={180}>{children as any}</ResponsiveContainer>
    </div>
  )
}

function MeasurementsPanel({ anthropoHistory, consultations, isMobile }: { anthropoHistory: any[], consultations: any[], isMobile: boolean }) {
  const sortedConsultations = [...consultations].reverse()
  const [selectedConsultId, setSelectedConsultId] = useState<string>(sortedConsultations[0]?.id || '')

  const currentAnthro = anthropoHistory.find((a: any) => a.consultation_id === selectedConsultId) || anthropoHistory[anthropoHistory.length - 1] || {}

  const measurementFields = [
    { section: 'Medidas Básicas y Composición', items: [
      { key: 'age', label: 'Edad', unit: ' años' },
      { key: 'height_cm', label: 'Altura', unit: ' cm' },
      { key: 'weight_kg', label: 'Peso actual', unit: ' kg' },
      { key: 'body_fat_pct', label: '% Grasa Corporal', unit: '%' },
      { key: 'muscle_mass_kg', label: 'Masa Muscular', unit: ' kg' },
      { key: 'bmi', label: 'IMC', unit: '' },
    ]},
    { section: 'Perímetros Corporales', items: [
      { key: 'neck_cm', label: 'Cuello', unit: ' cm' },
      { key: 'wrist_cm', label: 'Muñeca', unit: ' cm' },
      { key: 'chest_cm', label: 'Pecho', unit: ' cm' },
      { key: 'waist_cm', label: 'Cintura', unit: ' cm' },
      { key: 'hip_cm', label: 'Cadera', unit: ' cm' },
      { key: 'waist_hip_ratio', label: 'Índice Cintura/Cadera (WHR)', unit: '' },
    ]},
    { section: 'Bíceps', items: [
      { key: 'bicep_left_cm', label: 'Bíceps Izquierdo (Relajado)', unit: ' cm' },
      { key: 'bicep_left_flex_cm', label: 'Bíceps Izquierdo (Flexionado)', unit: ' cm' },
      { key: 'bicep_right_cm', label: 'Bíceps Derecho (Relajado)', unit: ' cm' },
      { key: 'bicep_right_flex_cm', label: 'Bíceps Derecho (Flexionado)', unit: ' cm' },
    ]},
    { section: 'Muslos', items: [
      { key: 'thigh_left_cm', label: 'Muslo Izquierdo (Relajado)', unit: ' cm' },
      { key: 'thigh_left_flex_cm', label: 'Muslo Izquierdo (Flexionado)', unit: ' cm' },
      { key: 'thigh_right_cm', label: 'Muslo Derecho (Relajado)', unit: ' cm' },
      { key: 'thigh_right_flex_cm', label: 'Muslo Derecho (Flexionado)', unit: ' cm' },
    ]}
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexDirection: isMobile ? 'column' : 'row', gap: '12px', alignItems: isMobile ? 'flex-start' : 'center' }}>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: isMobile ? '20px' : '24px', fontWeight: 700, margin: 0, color: '#0f172a' }}>📏 Medidas Antropométricas</h1>
        {sortedConsultations.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>Fecha:</span>
            <select 
              style={{ padding: '8px 12px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', outline: 'none', fontSize: '14px', fontWeight: 500 }}
              value={selectedConsultId}
              onChange={e => setSelectedConsultId(e.target.value)}
            >
              {sortedConsultations.map((c: any, i: number) => (
                <option key={c.id} value={c.id}>Consulta #{sortedConsultations.length - i} · {c.consultation_date}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {anthropoHistory.length === 0 ? (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '32px', textAlign: 'center', color: '#64748b' }}>
          No hay registros antropométricos disponibles todavía.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {measurementFields.map(sec => (
            <div key={sec.section} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '15px', fontWeight: 700, margin: '0 0 16px', color: '#2563eb', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                {sec.section}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {sec.items.map(item => {
                  const val = currentAnthro[item.key]
                  return (
                    <div key={item.key} style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>{item.label}</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>
                        {val !== undefined && val !== null && val !== '' ? `${typeof val === 'number' ? val.toFixed(1) : val}${item.unit}` : '—'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function LabPanel({ labResults, isMobile }: { labResults: any[], isMobile: boolean }) {
  const [selectedParam, setSelectedParam] = useState<string | null>(null)
  const grouped: Record<string, any[]> = {}
  labResults.forEach((lr: any) => {
    const key = lr.custom_parameter || String(lr.parameter_id)
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(lr)
  })
  const params = Object.keys(grouped)
  const classColors: Record<string, string> = { NORMAL: '#16a34a', LOW: '#0284c7', HIGH: '#dc2626', UNCLASSIFIED: '#64748b' }
  const classBg: Record<string, string> = { NORMAL: '#f0fdf4', LOW: '#f0f9ff', HIGH: '#fef2f2', UNCLASSIFIED: '#f8fafc' }

  return (
    <div>
      <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: isMobile ? '20px' : '24px', fontWeight: 700, margin: '0 0 20px', color: '#0f172a' }}>🧪 Laboratorio</h1>
      {params.length === 0 && <p style={{ color: '#64748b' }}>Aún no hay resultados de laboratorio.</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginBottom: '28px' }}>
        {params.map(param => {
          const entries = grouped[param]
          const latest = entries[entries.length - 1]
          const cls = latest.classification || 'UNCLASSIFIED'
          return (
            <button key={param} onClick={() => setSelectedParam(selectedParam === param ? null : param)}
              style={{ background: selectedParam === param ? classBg[cls] : '#ffffff', border: `1px solid ${selectedParam === param ? classColors[cls] : '#e2e8f0'}`, borderRadius: '10px', padding: '12px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>{param}</div>
              <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'monospace', color: classColors[cls] }}>{latest.value_numeric ?? latest.value_text ?? '—'}</div>
            </button>
          )
        })}
      </div>
      {selectedParam && grouped[selectedParam].length > 1 && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 700, margin: '0 0 16px', color: '#0f172a' }}>Evolución: {selectedParam}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={grouped[selectedParam].map((lr: any) => ({ date: lr.consultations?.consultation_date?.slice(0, 10), valor: lr.value_numeric }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} width={30} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a' }} />
              <Line type="monotone" dataKey="valor" stroke="#2563eb" strokeWidth={2} dot={{ fill: '#2563eb', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function PhotosPanel({ photos, isMobile }: { photos: any[], isMobile: boolean }) {
  const [compareMode, setCompareMode] = useState(false)
  const byAngle = { front: photos.filter((p: any) => p.angle === 'front'), side: photos.filter((p: any) => p.angle === 'side'), back: photos.filter((p: any) => p.angle === 'back') }
  function getUrl(path: string) { const { data } = supabase.storage.from('progress-photos').getPublicUrl(path); return data.publicUrl }
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexDirection: isMobile ? 'column' : 'row', gap: '12px', alignItems: isMobile ? 'flex-start' : 'center' }}>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: isMobile ? '20px' : '24px', fontWeight: 700, margin: 0, color: '#0f172a' }}>📸 Progreso</h1>
        <button 
          onClick={() => setCompareMode(!compareMode)} 
          style={{ fontSize: '12px', padding: '8px 16px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', cursor: 'pointer', fontWeight: 600 }}
        >
          {compareMode ? '📋 Ver Galería' : '🔁 Comparar Antes/Después'}
        </button>
      </div>
      {(['front','side','back'] as const).map(angle => {
        const anglePhotos = byAngle[angle]
        if (!anglePhotos.length) return null
        const labels = { front: 'Frente', side: 'Perfil', back: 'Espalda' }
        return (
          <div key={angle} style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '12px', letterSpacing: '0.5px' }}>{labels[angle].toUpperCase()}</h3>
            {compareMode && anglePhotos.length >= 2 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxWidth: '500px' }}>
                {[anglePhotos[anglePhotos.length - 1], anglePhotos[0]].map((ph: any, idx: number) => (
                  <div key={ph.id}>
                    <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '6px', fontWeight: 600 }}>{idx === 0 ? '✅ ACTUAL' : '⏮ INICIAL'}</div>
                    <img src={getUrl(ph.storage_path)} alt={angle} style={{ width: '100%', borderRadius: '10px', objectFit: 'cover', aspectRatio: '3/4', border: '2px solid #e2e8f0' }} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '12px', WebkitOverflowScrolling: 'touch' }}>
                {anglePhotos.map((ph: any) => (
                  <div key={ph.id} style={{ minWidth: isMobile ? '130px' : '150px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', fontWeight: 500 }}>{ph.photo_date}</div>
                    <img src={getUrl(ph.storage_path)} alt={angle} style={{ width: '100%', aspectRatio: '3/4', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0' }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function HistoryPanel({ consultations, anthropoHistory, isMobile }: { consultations: any[]; anthropoHistory: any[]; isMobile: boolean }) {
  const [compareA, setCompareA] = useState<string | null>(null)
  const [compareB, setCompareB] = useState<string | null>(null)
  const [mode, setMode] = useState<'list' | 'compare'>('list')

  const sorted = [...consultations].reverse()

  const fields = [
    { key: 'weight_kg',       label: 'Peso',         unit: 'kg',  better: 'down' },
    { key: 'body_fat_pct',    label: '% Grasa',      unit: '%',   better: 'down' },
    { key: 'muscle_mass_kg',  label: 'Músculo',      unit: 'kg',  better: 'up'   },
    { key: 'waist_cm',        label: 'Cintura',      unit: 'cm',  better: 'down' },
    { key: 'bmi',             label: 'IMC',          unit: '',    better: 'down' },
  ]

  function getAnthro(consultId: string) { return anthropoHistory.find((a: any) => a.consultation_id === consultId) }

  function getDiff(valA: number, valB: number, better: string) {
    const diff = valB - valA
    if (diff === 0) return { text: '=', color: '#64748b' }
    if (better === 'down') return diff < 0
      ? { text: `▼${Math.abs(diff).toFixed(1)}`, color: '#16a34a' }
      : { text: `▲${diff.toFixed(1)}`, color: '#dc2626' }
    return diff > 0
      ? { text: `▲${diff.toFixed(1)}`, color: '#16a34a' }
      : { text: `▼${Math.abs(diff).toFixed(1)}`, color: '#dc2626' }
  }

  const anthroA = compareA ? getAnthro(compareA) : null
  const anthroB = compareB ? getAnthro(compareB) : null
  const consultA = compareA ? consultations.find((c: any) => c.id === compareA) : null
  const consultB = compareB ? consultations.find((c: any) => c.id === compareB) : null

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexDirection: isMobile ? 'column' : 'row', gap: '12px', alignItems: isMobile ? 'flex-start' : 'center' }}>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: isMobile ? '20px' : '24px', fontWeight: 700, margin: 0, color: '#0f172a' }}>📋 Historial</h1>
        {consultations.length >= 2 && (
          <button 
            onClick={() => setMode(mode === 'list' ? 'compare' : 'list')} 
            style={{ fontSize: '12px', padding: '8px 16px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', cursor: 'pointer', fontWeight: 600 }}
          >
            {mode === 'list' ? '⚖️ Comparar' : '📋 Ver Lista'}
          </button>
        )}
      </div>

      {mode === 'compare' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            {[{ label: 'Consulta A (Base)', val: compareA, set: setCompareA, color: '#2563eb' },
              { label: 'Consulta B (Comparar)', val: compareB, set: setCompareB, color: '#16a34a' }].map(col => (
              <div key={col.label}>
                <div style={{ fontSize: '12px', color: col.color, fontWeight: 700, marginBottom: '6px' }}>{col.label}</div>
                <select 
                  style={{ width: '100%', padding: '10px 12px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', outline: 'none', fontSize: '14px' }} 
                  value={col.val || ''} 
                  onChange={e => col.set(e.target.value || null)}
                >
                  <option value="">— Seleccionar —</option>
                  {sorted.map((c: any, i: number) => (
                    <option key={c.id} value={c.id}>#{sorted.length - i} · {c.consultation_date}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {anthroA && anthroB && (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ minWidth: isMobile ? '320px' : 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '0', marginBottom: '8px' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>MEDICIÓN</div>
                  <div style={{ fontSize: '10px', color: '#2563eb', textAlign: 'center', fontWeight: 600 }}>{consultA?.consultation_date.slice(5)}</div>
                  <div style={{ fontSize: '10px', color: '#16a34a', textAlign: 'center', fontWeight: 600 }}>{consultB?.consultation_date.slice(5)}</div>
                  <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'center', fontWeight: 600 }}>DIF</div>
                </div>
                {fields.map(f => {
                  const vA = anthroA[f.key], vB = anthroB[f.key]
                  if (!vA && !vB) return null
                  const diff = vA && vB ? getDiff(Number(vA), Number(vB), f.better) : null
                  return (
                    <div key={f.key} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '0', borderTop: '1px solid #e2e8f0', padding: '10px 0', alignItems: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#475569', fontWeight: 500 }}>{f.label}</div>
                      <div style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: '12px', color: '#2563eb', fontWeight: 600 }}>{vA ? Number(vA).toFixed(1) : '—'}</div>
                      <div style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>{vB ? Number(vB).toFixed(1) : '—'}</div>
                      <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 600, color: diff?.color || '#64748b' }}>{diff?.text || '—'}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'list' && (
        <div style={{ display: 'grid', gap: '10px' }}>
          {sorted.map((c: any, i: number) => {
            const anthro = getAnthro(c.id)
            const [isOpen, setIsOpen] = useState(i === 0)
            return (
              <div key={c.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <button onClick={() => setIsOpen(!isOpen)}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>Consulta #{sorted.length - i}</div>
                    <div style={{ color: '#64748b', fontSize: '12px', marginTop: '2px', fontWeight: 500 }}>{c.consultation_date}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {anthro?.weight_kg && !isMobile && <span style={{ fontSize: '13px', color: '#2563eb', fontFamily: 'monospace', fontWeight: 600 }}>{anthro.weight_kg}kg</span>}
                    <span style={{ color: '#94a3b8', fontSize: '16px' }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                </button>
                {isOpen && (
                  <div style={{ padding: '0 16px 16px', borderTop: '1px solid #e2e8f0' }}>
                    {anthro && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px', paddingTop: '12px' }}>
                        {fields.map(f => {
                          const val = anthro[f.key]
                          if (!val) return null
                          return (
                            <div key={f.key} style={{ background: '#f8fafc', borderRadius: '8px', padding: '8px', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px', fontWeight: 600 }}>{f.label}</div>
                              <div style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '13px', color: '#0f172a' }}>{Number(val).toFixed(1)}{f.unit}</div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {c.notes_specialist && (
                      <div style={{ marginTop: '12px', background: '#eff6ff', borderRadius: '8px', padding: '12px', borderLeft: '3px solid #2563eb', fontSize: '13px', lineHeight: 1.5, color: '#334155' }}>
                        <strong style={{ color: '#2563eb' }}>Nota:</strong> {c.notes_specialist}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}