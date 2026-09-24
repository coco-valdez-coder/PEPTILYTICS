'use client'

import { useState } from 'react'
import { supabase, type Patient } from '@/lib/supabase'

export default function NewPatientForm({
  moderatorId,
  onSuccess,
}: {
  moderatorId: string
  onSuccess: (patient: Patient) => void
}) {
  const [form, setForm] = useState({
    cedula: '', full_name: '', email: '', phone: '',
    birth_date: '', gender: 'M', goal_weight: '', goal_fat_pct: '',
    initial_weight: '', notes_general: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload: any = {
        cedula: form.cedula.trim(),
        full_name: form.full_name.trim(),
        email: form.email || null,
        phone: form.phone || null,
        birth_date: form.birth_date || null,
        gender: form.gender,
        goal_weight: form.goal_weight ? Number(form.goal_weight) : null,
        goal_fat_pct: form.goal_fat_pct ? Number(form.goal_fat_pct) : null,
        initial_weight: form.initial_weight ? Number(form.initial_weight) : null,
        notes_general: form.notes_general || null,
      }

      const { data, error: dbErr } = await supabase
        .from('patients')
        .insert(payload)
        .select()
        .single()

      if (dbErr) throw new Error(dbErr.message)

      // Crear usuario de auth para que el paciente pueda hacer login
      await fetch('/api/create-patient-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula: form.cedula, patientId: data.id }),
      })

      onSuccess(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: '720px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '24px', fontWeight: 700, margin: '0 0 6px', color: '#0f172a' }}>
          Registrar Nuevo Paciente
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0, fontWeight: 500 }}>
          El paciente recibirá acceso con su cédula como usuario
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <h3 style={sectionStyle}>👤 Datos Personales</h3>
          <div style={gridStyle}>
            <Field label="Número de Cédula *" required>
              <input style={inputStyle} placeholder="0000000000"
                value={form.cedula} onChange={e => set('cedula', e.target.value)} required />
            </Field>
            <Field label="Nombre completo *" required>
              <input style={inputStyle} placeholder="Nombre y apellidos"
                value={form.full_name} onChange={e => set('full_name', e.target.value)} required />
            </Field>
            <Field label="Correo electrónico">
              <input style={inputStyle} type="email" placeholder="paciente@email.com"
                value={form.email} onChange={e => set('email', e.target.value)} />
            </Field>
            <Field label="Teléfono">
              <input style={inputStyle} placeholder="+593 99 000 0000"
                value={form.phone} onChange={e => set('phone', e.target.value)} />
            </Field>
            <Field label="Fecha de nacimiento">
              <input style={inputStyle} type="date"
                value={form.birth_date} onChange={e => set('birth_date', e.target.value)} />
            </Field>
            <Field label="Género">
              <select style={inputStyle} value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="Other">Otro</option>
              </select>
            </Field>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <h3 style={sectionStyle}>🎯 Metas y Datos Iniciales</h3>
          <div style={gridStyle}>
            <Field label="Peso inicial (kg)">
              <input style={inputStyle} type="number" step="0.1" placeholder="ej: 95.5"
                value={form.initial_weight} onChange={e => set('initial_weight', e.target.value)} />
            </Field>
            <Field label="Meta de peso (kg)">
              <input style={inputStyle} type="number" step="0.1" placeholder="ej: 75.0"
                value={form.goal_weight} onChange={e => set('goal_weight', e.target.value)} />
            </Field>
            <Field label="Meta % Grasa Corporal">
              <input style={inputStyle} type="number" step="0.1" placeholder="ej: 18.0"
                value={form.goal_fat_pct} onChange={e => set('goal_fat_pct', e.target.value)} />
            </Field>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <h3 style={sectionStyle}>📋 Notas Generales</h3>
          <textarea style={{ ...inputStyle, resize: 'vertical', height: '120px' }} rows={4}
            placeholder="Antecedentes, condiciones relevantes, alergias..."
            value={form.notes_general} onChange={e => set('notes_general', e.target.value)}
          />
        </div>

        {error && (
          <div style={{
            background: '#fee2e2', border: '1px solid #fecaca',
            borderRadius: '8px', padding: '12px', marginBottom: '16px',
            color: '#dc2626', fontSize: '14px', fontWeight: 500,
          }}>{error}</div>
        )}

        <button 
          type="submit" 
          disabled={saving}
          style={{ 
            padding: '10px 20px', background: '#2563eb', color: '#ffffff', 
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          {saving ? 'Registrando...' : '✅ Registrar Paciente'}
        </button>
      </form>
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

const sectionStyle: React.CSSProperties = {
  fontFamily: 'DM Sans, sans-serif', fontSize: '15px', fontWeight: 700,
  margin: '0 0 16px', color: '#0f172a',
}
const gridStyle: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px',
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
        {label}{required && <span style={{ color: '#dc2626', marginLeft: '2px' }}>*</span>}
      </label>
      {children}
    </div>
  )
}