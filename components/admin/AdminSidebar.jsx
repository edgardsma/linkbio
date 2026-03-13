'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_SECTIONS = [
  {
    label: 'GERAL',
    items: [
      { label: 'Dashboard',  icon: '📊', href: '/admin',            exact: true  },
      { label: 'Usuários',   icon: '👥', href: '/admin/usuarios',   exact: false },
      { label: 'Contas',     icon: '🏢', href: '/admin/contas',     exact: false },
    ],
  },
  {
    label: 'FINANCEIRO',
    items: [
      { label: 'Assinaturas', icon: '💳', href: '/admin/assinaturas', exact: false },
      { label: 'Receita',     icon: '💰', href: '/admin/receita',     exact: false },
      { label: 'Financeiro',  icon: '📈', href: '/admin/financeiro',  exact: false },
      { label: 'Planos',      icon: '🎯', href: '/admin/planos',      exact: false },
    ],
  },
  {
    label: 'FERRAMENTAS',
    items: [
      { label: 'Cupons',   icon: '🎟️', href: '/admin/cupons',   exact: false },
      { label: 'Suporte',  icon: '🎧', href: '/admin/suporte',  exact: false },
    ],
  },
]

export default function AdminSidebar({ user }) {
  const pathname = usePathname()

  function isActive(href, exact) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside className="admin-sidebar">
      {/* Logo */}
      <div className="admin-sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: '0.5rem',
              background: 'linear-gradient(135deg, #dc2626, #ea580c)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '800',
              fontSize: '0.65rem',
              letterSpacing: '0.05em',
              flexShrink: 0,
            }}
          >
            ADM
          </div>
          <div>
            <div style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '0.95rem', lineHeight: 1.2 }}>
              LinkBio Brasil
            </div>
            <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Painel Administrativo</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="admin-nav">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="admin-nav-section">
            <span className="admin-nav-label">{section.label}</span>
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-item${isActive(item.href, item.exact) ? ' active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        ))}

        {/* Divider and back link */}
        <div style={{ borderTop: '1px solid #1e293b', paddingTop: '1rem', marginTop: '0.5rem' }}>
          <Link href="/dashboard" className="admin-nav-item">
            <span className="nav-icon">←</span>
            <span>Voltar ao Dashboard</span>
          </Link>
        </div>
      </nav>
    </aside>
  )
}
