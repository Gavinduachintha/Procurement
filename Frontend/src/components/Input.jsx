import "./components.css";

export default function Input({ label, error, ...props }) {
  return (
    <div className="form-group">
      {label && <label>{label}</label>}
      <input {...props} />
      {error && <span className="error">{error}</span>}
    </div>
  );
}
