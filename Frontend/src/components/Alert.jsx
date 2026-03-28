import { AlertCircle, CheckCircle, Info } from 'lucide-react'
import './components.css'

export default function Alert({ type = 'info', children }) {
  const icons = {
    error: <AlertCircle size={20} />,
    success: <CheckCircle size={20} />,
    info: <Info size={20} />
  }

  return (
    <div className={`alert alert-${type}`}>
      {icons[type]}
      <div>{children}</div>
    </div>
  )
}
