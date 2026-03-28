export default function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const variantClass = `btn-${variant}`
  const sizeClass = `btn-${size}`
  return (
    <button className={`btn ${variantClass} ${sizeClass} ${className}`} {...props}>
      {children}
    </button>
  )
}
