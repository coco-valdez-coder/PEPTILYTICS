import type { Metadata } from 'next'
import RoleSelector from '@/components/auth/RoleSelector'

export const metadata: Metadata = {
  title: 'PeptiLytics — Seguimiento Clínico',
  description: 'Plataforma de seguimiento antropométrico, metabólico y de péptidos terapéuticos',
}

export default function HomePage() {
  return <RoleSelector />
}