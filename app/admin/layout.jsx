import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'
import './admin.css'

export const metadata = { title: 'Painel Admin — LinkBio Brasil' }

export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="admin-shell">
      <AdminSidebar user={session.user} />
      <div className="admin-main">
        <header className="admin-topbar">
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Painel Administrativo — LinkBio Brasil
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#7c3aed',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '0.875rem',
              }}
            >
              {session.user.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#0f172a' }}>
              {session.user.name || session.user.email}
            </span>
          </div>
        </header>
        <div className="admin-content">
          {children}
        </div>
      </div>
    </div>
  )
}
