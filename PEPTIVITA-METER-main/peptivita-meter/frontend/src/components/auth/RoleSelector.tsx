'use client'

import { useState } from 'react'
import PatientLogin from './PatientLogin'
import ModeratorLogin from './ModeratorLogin'

export default function RoleSelector() {
  const [role, setRole] = useState<'patient' | 'moderator' | null>(null)

  if (role === 'patient')   return <PatientLogin onBack={() => setRole(null)} />
  if (role === 'moderator') return <ModeratorLogin onBack={() => setRole(null)} />

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
      color: '#0f172a'
    }}>
      {/* ECG Background SVG */}
      <svg
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.04 }}
        viewBox="0 0 1200 400" preserveAspectRatio="none"
      >
        <polyline
          points="0,200 100,200 120,200 140,80 160,320 180,200 220,200 240,160 260,240 280,200 400,200 420,200 440,50 460,350 480,200 550,200 600,200 620,170 640,230 660,200 800,200 820,200 840,60 860,340 880,200 1000,200 1020,180 1040,220 1060,200 1200,200"
          fill="none"
          stroke="#2563eb"
          strokeWidth="2"
        />
      </svg>

      {/* Logo + Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px', zIndex: 1 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
        }}>
          <div style={{
            width: '48px', height: '48px',
            background: 'linear-gradient(135deg, #2563eb, #0284c7)',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px',
            boxShadow: '0 4px 6px -1px rgba(37,99,235,0.2)'
          }}>🧬</div>
          <span style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '28px',
            fontWeight: 700,
            color: '#0f172a',
            letterSpacing: '-0.5px',
          }}>PeptiLytics</span>
        </div>
        <p style={{ color: '#64748b', fontSize: '15px', marginTop: 0, fontWeight: 500 }}>
          Plataforma de seguimiento clínico y optimización
        </p>
      </div>

      {/* Role Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '20px',
        width: '100%',
        maxWidth: '600px',
        zIndex: 1,
      }}>
        <RoleCard
          emoji="👤"
          title="Paciente"
          description="Consulta tu progreso, analíticas y tratamiento activo"
          accentColor="#16a34a"
          dimColor="#f0fdf4"
          onClick={() => setRole('patient')}
        />
        <RoleCard
          emoji="⚕️"
          title="Moderador"
          description="Gestión de pacientes, ingreso de datos y reportes"
          accentColor="#2563eb"
          dimColor="#eff6ff"
          onClick={() => setRole('moderator')}
        />
      </div>

      <p style={{
        marginTop: '40px',
        color: '#94a3b8',
        fontSize: '12px',
        zIndex: 1,
        fontWeight: 500
      }}>
        Datos médicos protegidos · Acceso seguro por rol
      </p>
    </div>
  )
}

function RoleCard({
  emoji, title, description, accentColor, dimColor, onClick
}: {
  emoji: string
  title: string
  description: string
  accentColor: string
  dimColor: string
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? dimColor : '#ffffff',
        border: `1px solid ${hovered ? accentColor : '#e2e8f0'}`,
        borderRadius: '16px',
        padding: '32px 24px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s ease',
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered ? '0 12px 20px -3px rgba(0,0,0,0.05)' : '0 1px 3px rgba(0,0,0,0.02)',
      }}
    >
      <div style={{ fontSize: '36px', marginBottom: '16px' }}>{emoji}</div>
      <div style={{
        fontFamily: 'DM Sans, sans-serif',
        fontSize: '20px',
        fontWeight: 700,
        color: hovered ? accentColor : '#0f172a',
        marginBottom: '8px',
        transition: 'color 0.2s',
      }}>{title}</div>
      <div style={{
        fontSize: '14px',
        color: '#64748b',
        lineHeight: '1.5',
      }}>{description}</div>
      <div style={{
        marginTop: '20px',
        color: accentColor,
        fontSize: '13px',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.2s',
      }}>
        Ingresar →
      </div>
    </button>
  )
}