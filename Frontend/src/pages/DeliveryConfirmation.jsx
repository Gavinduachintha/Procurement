import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/client";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import TextArea from "../components/TextArea";
import Alert from "../components/Alert";
import "./DeliveryConfirmation.css";

export default function DeliveryConfirmation() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [delivery, setDelivery] = useState(null);
  const [quantityDelivered, setQuantityDelivered] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [remarks, setRemarks] = useState("");
  const [accepted, setAccepted] = useState(true);

  useEffect(() => {
    loadDeliveryInfo();
  }, [token]);

  const loadDeliveryInfo = async () => {
    setLoading(true);
    setError("");

    try {
      console.log("📦 DeliveryConfirmation: Loading delivery info for token");
      const response = await api.get(
        `/post-procurement/delivery/confirm/${token}`,
      );
      const data = response.data?.data || response.data;

      setDelivery(data);
      setQuantityDelivered(String(data?.quantityOrdered || ""));

      console.log("✅ DeliveryConfirmation: Delivery info loaded", {
        poNumber: data?.poNumber,
        jobNumber: data?.jobNumber,
      });
    } catch (err) {
      const message =
        err.response?.data?.message || "Invalid confirmation link";
      console.error("❌ DeliveryConfirmation: Failed loading token", message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const submitConfirmation = async (e) => {
    e.preventDefault();
    if (!delivery) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      console.log("📤 DeliveryConfirmation: Submitting delivery confirmation", {
        token,
        accepted,
      });

      await api.post(`/post-procurement/delivery/confirm/${token}`, {
        quantityDelivered: Number(quantityDelivered),
        deliveryDate,
        remarks,
        accepted,
      });

      setSuccess(
        accepted
          ? "Delivery confirmed and accepted successfully."
          : "Delivery confirmed successfully.",
      );

      await loadDeliveryInfo();
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to confirm delivery";
      console.error("❌ DeliveryConfirmation: Submit failed", message);
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">Loading delivery confirmation...</div>
    );
  }

  return (
    <div className="delivery-confirmation-page">
      <div className="page-header">
        <h1>Delivery Confirmation</h1>
        <p>Confirm item delivery for purchase order</p>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {delivery ? (
        <>
          <Card>
            <div className="delivery-summary">
              <div>
                <strong>Job Number:</strong> {delivery.jobNumber}
              </div>
              <div>
                <strong>PO Number:</strong> {delivery.poNumber}
              </div>
              <div>
                <strong>Supplier:</strong> {delivery.supplierName}
              </div>
              <div>
                <strong>Item:</strong> {delivery.itemName}
              </div>
              <div>
                <strong>Quantity Ordered:</strong> {delivery.quantityOrdered}
              </div>
              <div>
                <strong>Department:</strong> {delivery.requestingDepartment}
              </div>
              <div>
                <strong>Current Status:</strong>{" "}
                {delivery.currentStatus || "PENDING"}
              </div>
            </div>
          </Card>

          <Card>
            <form onSubmit={submitConfirmation}>
              <Input
                label="Quantity Delivered"
                type="number"
                min="1"
                required
                value={quantityDelivered}
                onChange={(e) => setQuantityDelivered(e.target.value)}
              />

              <Input
                label="Delivery Date"
                type="date"
                required
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />

              <div className="confirmation-choice">
                <label>
                  <input
                    type="radio"
                    name="acceptance"
                    checked={accepted}
                    onChange={() => setAccepted(true)}
                  />
                  Accept delivery
                </label>
                <label>
                  <input
                    type="radio"
                    name="acceptance"
                    checked={!accepted}
                    onChange={() => setAccepted(false)}
                  />
                  Mark as delivered (not fully accepted)
                </label>
              </div>

              <TextArea
                label="Remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add remarks (optional)"
              />

              <div className="modal-actions">
                <Button type="submit" disabled={saving}>
                  {saving ? "Submitting..." : "Confirm Delivery"}
                </Button>
              </div>
            </form>
          </Card>
        </>
      ) : null}
    </div>
  );
}
