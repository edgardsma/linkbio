export function Input({ className = '', label, helperText, error, ...props }) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${className} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
        {...props}
      />
      {helperText && (
        <p className={`mt-1 text-sm ${error ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
          {helperText}
        </p>
      )}
    </div>
  )
}
