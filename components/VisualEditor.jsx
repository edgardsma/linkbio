'use client'

import { useState, useCallback } from 'react'

const FONTS = [
  { id: 'inter',      label: 'Inter',            sample: 'Aa',  style: 'font-sans' },
  { id: 'poppins',    label: 'Poppins',           sample: 'Aa',  style: 'font-sans' },
  { id: 'montserrat', label: 'Montserrat',        sample: 'Aa',  style: 'font-sans' },
  { id: 'playfair',   label: 'Playfair Display',  sample: 'Aa',  style: 'font-serif' },
  { id: 'oswald',     label: 'Oswald',            sample: 'Aa',  style: 'font-sans' },
]

const BUTTON_STYLES = [
  {
    id: 'rounded',
    label: 'Arredondado',
    preview: 'rounded-full',
  },
  {
    id: 'square',
    label: 'Quadrado',
    preview: 'rounded-md',
  },
  {
    id: 'outline',
    label: 'Contorno',
    preview: 'rounded-full border-2',
  },
]

function ColorField({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-9 h-9 rounded-lg cursor-pointer border border-gray-200 dark:border-gray-700 p-0.5 bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => /^#[0-9A-Fa-f]{0,6}$/.test(e.target.value) && onChange(e.target.value)}
          className="w-24 text-xs px-2 py-2 border border-gray-200 dark:border-gray-700 rounded-lg font-mono dark:bg-gray-800 dark:text-white uppercase"
          maxLength={7}
        />
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="border-b border-gray-100 dark:border-gray-800 pb-5 mb-5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
        {title}
      </h3>
      {children}
    </div>
  )
}

export default function VisualEditor({ initialTheme = {}, onThemeChange, onSave, saving }) {
  const [theme, setTheme] = useState({
    primaryColor: '#667eea',
    secondaryColor: '#764ba2',
    backgroundColor: '#f9fafb',
    textColor: '#111827',
    buttonStyle: 'rounded',
    fontFamily: 'inter',
    ...initialTheme,
  })

  const update = useCallback(
    (key, value) => {
      const next = { ...theme, [key]: value }
      setTheme(next)
      onThemeChange?.(next)
    },
    [theme, onThemeChange]
  )

  const btnBaseStyle = (style) => ({
    background:
      style === 'outline'
        ? 'transparent'
        : `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
    borderColor: style === 'outline' ? theme.primaryColor : 'transparent',
    color: style === 'outline' ? theme.primaryColor : '#fff',
  })

  return (
    <div className="w-full space-y-0">
      {/* Cores */}
      <Section title="Cores">
        <div className="space-y-3">
          <ColorField label="Cor primária"    value={theme.primaryColor}    onChange={(v) => update('primaryColor', v)} />
          <ColorField label="Cor secundária"  value={theme.secondaryColor}  onChange={(v) => update('secondaryColor', v)} />
          <ColorField label="Fundo"           value={theme.backgroundColor} onChange={(v) => update('backgroundColor', v)} />
          <ColorField label="Texto"           value={theme.textColor}       onChange={(v) => update('textColor', v)} />
        </div>
      </Section>

      {/* Estilo de botão */}
      <Section title="Estilo dos Botões">
        <div className="grid grid-cols-3 gap-2">
          {BUTTON_STYLES.map((bs) => (
            <button
              key={bs.id}
              type="button"
              onClick={() => update('buttonStyle', bs.id)}
              className={`p-3 rounded-xl border-2 transition flex flex-col items-center gap-2 ${
                theme.buttonStyle === bs.id
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
              }`}
            >
              <div
                className={`w-full text-xs py-1.5 text-center font-medium ${bs.preview}`}
                style={btnBaseStyle(bs.id)}
              >
                Link
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">{bs.label}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* Fonte */}
      <Section title="Fonte">
        <div className="space-y-2">
          {FONTS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => update('fontFamily', f.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border-2 transition ${
                theme.fontFamily === f.id
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
              }`}
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{f.label}</span>
              <span className={`text-lg text-gray-500 ${f.style}`}>{f.sample}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* Botão Salvar */}
      {onSave && (
        <button
          onClick={() => onSave(theme)}
          disabled={saving}
          className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {saving ? 'Salvando...' : 'Salvar personalização'}
        </button>
      )}
    </div>
  )
}
