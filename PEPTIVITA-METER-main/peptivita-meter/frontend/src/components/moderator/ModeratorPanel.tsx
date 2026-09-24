'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase, type Patient } from '@/lib/supabase'
import ConsultationForm from './ConsultationForm'
import ConsultationHistory from './ConsultationHistory'
import NewPatientForm from './NewPatientForm'

export default function ModeratorPanel({
  moderator, onLogout
}: {
  moderator: any
  onLogout: () => void
}) {
  const [view, setView] = useState('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [foundPatient, setFoundPatient] = useState<Patient | null>(null)
  const [allPatients, setAllPatients] = useState<Patient[]>([])
  const [loadingPatients, setLoadingPatients] = useState(true)

  useEffect(() => { loadAllPatients() }, [])

  async function loadAllPatients() {
    setLoadingPatients(true)
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('full_name', { ascending: true })
      
      if (error) console.error('Error cargando pacientes:', error)
      if (data) setAllPatients(data)
    } catch (e) {
      console.error('Error de red:', e)
    } finally {
      setLoadingPatients(false)
    }
  }

  const filteredPatients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return allPatients
    return allPatients.filter(p =>
      (p.full_name || '').toLowerCase().includes(q) ||
      (p.cedula || '').includes(q)
    )
  }, [searchQuery, allPatients])

  const groupedPatients = useMemo(() => {
    const groups: Record<string, Patient[]> = {}
    filteredPatients.forEach(p => {
      const name = p.full_name || '?'
      const letter = name.charAt(0).toUpperCase()
      if (!groups[letter]) groups[letter] = []
      groups[letter].push(p)
    })
    return groups
  }, [filteredPatients])

  const alphabet = Object.keys(groupedPatients).sort()

  function selectPatient(p: Patient) {
    setFoundPatient(p)
    setView('history')
  }

  const navItems = [
    { id: 'search', icon: '🔍', label: 'Pacientes' },
    { id: 'new-patient', icon: '➕', label: 'Nuevo Paciente' },
  ]

  const subTabs = [
    { id: 'history', label: 'Ver Historial', icon: '📋' },
    { id: 'consultation', label: '+ Nueva Consulta', icon: '📝' },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', color: '#1e293b' }}>
      <aside style={{ width: '240px', minWidth: '240px', background: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <span style={{ fontSize: '22px' }}>🧬</span>
          <span style={{ fontFamily: 'sans-serif', fontWeight: 700, fontSize: '16px', color: '#0f172a' }}>PeptiLytics</span>
        </div>
        <nav style={{ flex: 1 }}>
          {navItems.map(item => (
            <button key={item.id}
              onClick={() => { setView(item.id); setFoundPatient(null) }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: view === item.id ? '#eff6ff' : 'transparent',
                color: view === item.id ? '#2563eb' : '#64748b',
                fontSize: '14px', fontWeight: view === item.id ? 600 : 400,
                marginBottom: '4px', textAlign: 'left',
              }}
            >
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', fontWeight: 500 }}>
            {moderator?.full_name || 'Moderador'}
          </div>
          <button onClick={onLogout} style={{ width: '100%', padding: '8px', fontSize: '13px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#475569', cursor: 'pointer', fontWeight: 500 }}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'auto', padding: '32px', background: '#f8fafc' }}>
        {view === 'new-patient' && (
          <NewPatientForm moderatorId={moderator.id} onSuccess={(p) => selectPatient(p)} />
        )}

        {view === 'search' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px', color: '#0f172a' }}>Pacientes</h1>
              <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>{allPatients.length} pacientes registrados</p>
            </div>
            <div style={{ position: 'relative', marginBottom: '24px', maxWidth: '480px' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>🔍</span>
              <input
                style={{ width: '100%', padding: '10px 12px 10px 38px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', outline: 'none', fontSize: '15px' }}
                placeholder="Buscar por nombre o cédula..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' }}>×</button>
              )}
            </div>

            {loadingPatients ? (
              <div style={{ color: '#64748b', fontSize: '14px' }}>Cargando pacientes...</div>
            ) : filteredPatients.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
                <div style={{ fontWeight: 600, marginBottom: '8px', color: '#334155' }}>No se encontró "{searchQuery}"</div>
                <button onClick={() => setView('new-patient')} style={{ marginTop: '8px', padding: '10px 16px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>+ Registrar nuevo paciente</button>
              </div>
            ) : (
              <div>
                {alphabet.map(letter => (
                  <div key={letter} style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb', letterSpacing: '1px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #e2e8f0' }}>{letter}</div>
                    <div style={{ display: 'grid', gap: '6px' }}>
                      {groupedPatients[letter].map(p => (
                        <PatientRow key={p.id} patient={p} searchQuery={searchQuery} onClick={() => selectPatient(p)} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(view === 'history' || view === 'consultation') && foundPatient && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <button onClick={() => { setFoundPatient(null); setView('search') }} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '13px', marginBottom: '6px', padding: 0, display: 'block', fontWeight: 500 }}>← Volver a Pacientes</button>
                <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 2px', color: '#0f172a' }}>{foundPatient.full_name || 'Paciente sin nombre'}</h1>
                <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>CI: {foundPatient.cedula || 'N/A'}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              {subTabs.map(t => (
                <button key={t.id} onClick={() => setView(t.id)}
                  style={{
                    padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
                    background: view === t.id ? '#eff6ff' : '#ffffff',
                    color: view === t.id ? '#2563eb' : '#64748b',
                    boxShadow: view === t.id ? '0 1px 2px rgba(37,99,235,0.1)' : '0 1px 2px rgba(0,0,0,0.05)',
                    border: view === t.id ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                  }}
                >{t.icon} {t.label}</button>
              ))}
            </div>

            {view === 'history' && <ConsultationHistory patient={foundPatient} />}
            {view === 'consultation' && <ConsultationForm patient={foundPatient} moderatorId={moderator.id} />}
          </div>
        )}
      </main>
    </div>
  )
}

function PatientRow({ patient, searchQuery, onClick }: { patient: Patient; searchQuery: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const initial = patient.full_name ? patient.full_name.charAt(0).toUpperCase() : '?'

  return (
    <button onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 16px', borderRadius: '10px', width: '100%', textAlign: 'left',
        border: `1px solid ${hovered ? '#93c5fd' : '#e2e8f0'}`,
        background: hovered ? '#f0fdf4' : '#ffffff',
        cursor: 'pointer', boxShadow: hovered ? '0 4px 6px -1px rgba(0,0,0,0.05)' : '0 1px 2px rgba(0,0,0,0.02)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: hovered ? '#2563eb' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 700, color: hovered ? '#ffffff' : '#475569' }}>
          {initial}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px', color: '#0f172a' }}>{patient.full_name || 'Paciente Sin Nombre'}</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>CI: {patient.cedula || 'N/A'}</div>
        </div>
      </div>
      <span style={{ color: '#2563eb', fontSize: '16px', opacity: hovered ? 1 : 0 }}>→</span>
    </button>
  )
}