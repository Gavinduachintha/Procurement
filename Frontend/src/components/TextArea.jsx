import "./components.css";

export default function TextArea({ label, error, ...props }) {
  return (
    <div className="form-group">
      {label && <label>{label}</label>}
      <textarea {...props} />
      {error && <span className="error">{error}</span>}
    </div>
  );
}
