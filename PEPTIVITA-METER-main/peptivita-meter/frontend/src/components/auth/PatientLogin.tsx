'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import PatientDashboard from '@/components/patient/PatientDashboard'

export default function PatientLogin({ onBack }: { onBack: () => void }) {
  const [cedula, setCedula] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [patient, setPatient] = useState<any>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Login por cédula: el email es cedula@peptivita.local
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: `${cedula}@peptivita.local`,
        password,
      })
      if (authError) throw new Error('Cédula o contraseña incorrectos')

      // Buscar datos del paciente
      const { data: patientData, error: patError } = await supabase
        .from('patients')
        .select('*')
        .eq('cedula', cedula)
        .single()

      if (patError || !patientData) throw new Error('Paciente no encontrado')
      setPatient(patientData)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (patient) return <PatientDashboard patient={patient} onLogout={() => { setPatient(null); supabase.auth.signOut() }} />

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      color: '#0f172a'
    }}>
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', width: '100%', maxWidth: '420px', padding: '40px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        {/* Header */}
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '13px', marginBottom: '24px', padding: 0, fontWeight: 500 }}
        >
          ← Volver
        </button>

        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>👤</div>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '24px', fontWeight: 700, margin: '0 0 8px', color: '#0f172a' }}>
            Acceso Paciente
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0, fontWeight: 500 }}>
            Ingresa con tu número de cédula
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', color: '#475569', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              Número de Cédula
            </label>
            <input
              style={inputStyle}
              type="text"
              placeholder="0000000000"
              value={cedula}
              onChange={e => setCedula(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '13px', color: '#475569', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              Contraseña
            </label>
            <input
              style={inputStyle}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div style={{
              background: '#fee2e2', border: '1px solid #fecaca',
              borderRadius: '8px', padding: '12px', marginBottom: '16px',
              color: '#dc2626', fontSize: '14px', fontWeight: 500
            }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            style={{ 
              width: '100%', padding: '11px', background: '#2563eb', color: '#ffffff', 
              border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
            }}
          >
            {loading ? 'Verificando...' : 'Ingresar al Dashboard'}
          </button>
        </form>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  color: '#0f172a',
  outline: 'none',
  fontSize: '14px',
  boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
}