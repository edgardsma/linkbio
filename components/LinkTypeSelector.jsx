export default function LinkTypeSelector({ value, onChange }) {
  const linkTypes = [
    { value: 'url', label: 'Link Genérico', icon: '🔗', placeholder: 'https://meusite.com' },
    { value: 'whatsapp', label: 'WhatsApp', icon: '💬', placeholder: '551199998888' },
    { value: 'email', label: 'Email', icon: '📧', placeholder: 'email@exemplo.com' },
    { value: 'phone', label: 'Telefone', icon: '📞', placeholder: '551199998888' },
  ]

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Tipo de Link
      </label>
      <div className="grid grid-cols-2 gap-2">
        {linkTypes.map(type => (
          <button
            key={type.value}
            type="button"
            onClick={() => onChange(type.value)}
            className={`p-3 border-2 rounded-lg transition flex items-center gap-3 ${
              value === type.value
                ? 'border-purple-600 bg-purple-50 dark:bg-purple-900'
                : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
            }`}
          >
            <span className="text-2xl">{type.icon}</span>
            <span className="font-medium">{type.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function getLinkPlaceholder(linkType) {
  const placeholders = {
    url: 'https://meusite.com',
    whatsapp: '551199998888',
    email: 'email@exemplo.com',
    phone: '551199998888',
  }
  return placeholders[linkType] || placeholders.url
}

export function formatLinkUrl(linkType, value) {
  switch (linkType) {
    case 'whatsapp':
      // Remove caracteres não numéricos
      const phone = value.replace(/\D/g, '')
      return `https://wa.me/55${phone}`
    case 'email':
      return `mailto:${value}`
    case 'phone':
      const phoneNumber = value.replace(/\D/g, '')
      return `tel:+55${phoneNumber}`
    default:
      return value
  }
}
