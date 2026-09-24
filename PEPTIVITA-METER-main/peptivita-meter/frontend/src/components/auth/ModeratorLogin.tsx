'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import ModeratorPanel from '@/components/moderator/ModeratorPanel'

export default function ModeratorLogin({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [moderator, setModerator] = useState<any>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 1. Login con Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw new Error('Credenciales incorrectas: ' + authError.message)

      const uid = data.user?.id
      if (!uid) throw new Error('No se pudo obtener el usuario')

      // 2. Buscar moderador — usar maybeSingle para no lanzar error si no existe
      const { data: modData, error: modError } = await supabase
        .from('moderators')
        .select('*')
        .eq('supabase_uid', uid)
        .eq('is_active', true)
        .maybeSingle()

      if (modError) throw new Error('Error al verificar moderador: ' + modError.message)
      if (!modData) throw new Error(`No tienes acceso como moderador. UID: ${uid}`)

      setModerator(modData)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (moderator) return <ModeratorPanel moderator={moderator} onLogout={() => { setModerator(null); supabase.auth.signOut() }} />

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
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '13px', marginBottom: '24px', padding: 0, fontWeight: 500 }}
        >
          ← Volver
        </button>

        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚕️</div>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '24px', fontWeight: 700, margin: '0 0 8px', color: '#0f172a' }}>
            Acceso Moderador
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0, fontWeight: 500 }}>
            Área restringida para especialistas
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', color: '#475569', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              Correo electrónico
            </label>
            <input style={inputStyle} type="email" placeholder="medico@clinica.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '13px', color: '#475569', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              Contraseña
            </label>
            <input style={inputStyle} type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          {error && (
            <div style={{
              background: '#fee2e2', border: '1px solid #fecaca',
              borderRadius: '8px', padding: '12px', marginBottom: '16px',
              color: '#dc2626', fontSize: '13px', wordBreak: 'break-all', fontWeight: 500
            }}>{error}</div>
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
            {loading ? 'Verificando...' : 'Ingresar al Panel'}
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