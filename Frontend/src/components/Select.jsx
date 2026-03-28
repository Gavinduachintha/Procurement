import './components.css'

export default function Select({ label, options, error, ...props }) {
  return (
    <div className="form-group">
      {label && <label>{label}</label>}
      <select {...props}>
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="error">{error}</span>}
    </div>
  )
}
