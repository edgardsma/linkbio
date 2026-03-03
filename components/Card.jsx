export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`p-6 border-b border-gray-200 dark:border-gray-700 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardBody({ children, className = '', ...props }) {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`p-6 border-t border-gray-200 dark:border-gray-700 ${className}`} {...props}>
      {children}
    </div>
  )
}
