import { useRef } from "react";
import "./components.css";

export default function Modal({ isOpen, onClose, title, children }) {
  const skipNextSubmitConfirmRef = useRef(false);

  const requestSecondConfirmation = (message) => window.confirm(message);

  const handleButtonClickCapture = (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const button = target.closest("button");
    if (!button || button.disabled) {
      return;
    }

    if (button.dataset.skipSecondConfirm === "true") {
      return;
    }

    const actionLabel = (
      button.dataset.confirmLabel ||
      button.textContent ||
      ""
    )
      .replace(/\s+/g, " ")
      .trim();

    const confirmed = requestSecondConfirmation(
      actionLabel
        ? `Please confirm again to proceed with \"${actionLabel}\".`
        : "Please confirm again to proceed.",
    );

    if (!confirmed) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    const buttonType = (button.type || "button").toLowerCase();
    if (buttonType === "submit") {
      skipNextSubmitConfirmRef.current = true;
    }
  };

  const handleFormSubmitCapture = (event) => {
    if (event.defaultPrevented) {
      return;
    }

    const form = event.target;
    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    if (form.dataset.skipSecondConfirm === "true") {
      return;
    }

    if (skipNextSubmitConfirmRef.current) {
      skipNextSubmitConfirmRef.current = false;
      return;
    }

    const confirmed = requestSecondConfirmation(
      "Please confirm again before submitting this form.",
    );

    if (!confirmed) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        onClickCapture={handleButtonClickCapture}
        onSubmitCapture={handleFormSubmitCapture}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
