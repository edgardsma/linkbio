'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, CardBody, CardHeader, Input } from '@/components'
import AvatarUpload from '@/components/AvatarUpload'
import BackgroundUpload from '@/components/BackgroundUpload'

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    bio: '',
    image: '',
    background: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (session?.user) {
      loadProfile()
    }
  }, [session, status, router])

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setFormData({
          name: data.name || '',
          username: data.username || '',
          bio: data.bio || '',
          image: data.image || '',
          background: data.background || '',
        })
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar perfil')
      }

      setSuccess('Perfil atualizado com sucesso!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  const profileUrl = `${window.location.origin}/${formData.username}`

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <a href="/" className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            LinkBio Brasil
          </a>
          <nav className="flex gap-4 items-center">
            <a href="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400">
              Dashboard
            </a>
            <a href="/profile" className="text-purple-600 dark:text-purple-400 font-semibold">
              Meu Perfil
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Editar Perfil
        </h1>

        {/* Profile Form Card */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Informações do Perfil
            </h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Image Preview */}
              <AvatarUpload
                currentAvatar={formData.image}
                onAvatarChange={(url) => setFormData({ ...formData, image: url })}
              />

              {/* Background Image */}
              <BackgroundUpload
                currentBackground={formData.background}
                onBackgroundChange={(url) => setFormData({ ...formData, background: url })}
              />

              {/* Name */}
              <Input
                label="Nome completo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Seu nome"
                required
              />

              {/* Username */}
              <Input
                label="Nome de usuário"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="@usuario"
                required
                pattern="^[a-zA-Z0-9_-]+$"
                helperText="Apenas letras, números, hífens e sublinhados"
              />

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Biografia
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                  placeholder="Conte um pouco sobre você..."
                  rows={3}
                  maxLength={200}
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {formData.bio.length}/200 caracteres
                </p>
              </div>

              {/* Error and Success Messages */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg text-sm">
                  {success}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={saving}
              >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* Profile URL Card */}
        <Card className="mt-6">
          <CardHeader>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Seu Link
            </h2>
          </CardHeader>
          <CardBody>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Sua página estará disponível em:
              </p>
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 dark:text-purple-400 font-semibold hover:underline break-all"
              >
                {profileUrl}
              </a>
            </div>
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block w-full text-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
            >
              Visualizar Página
            </a>
          </CardBody>
        </Card>

        {/* Danger Zone */}
        <Card className="mt-6 border-red-200 dark:border-red-800">
          <CardHeader>
            <h2 className="text-xl font-bold text-red-600 dark:text-red-400">
              Zona de Perigo
            </h2>
          </CardHeader>
          <CardBody>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Estas ações são irreversíveis. Tenha cuidado.
            </p>
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                if (confirm('Tem certeza que deseja excluir todos os seus links?')) {
                  // Implementar exclusão de todos os links
                }
              }}
            >
              Excluir Todos os Links
            </Button>
          </CardBody>
        </Card>
      </main>
    </div>
  )
}
