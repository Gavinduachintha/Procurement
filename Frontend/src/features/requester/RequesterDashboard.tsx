import { useEffect, useState } from "react";
import { requestApi } from "../../api/requestApi";
import { specificationApi } from "../../api/specificationApi";
import { dashboardApi } from "../../api/dashboardApi";
import { FUNDING_SOURCES, ITEM_TYPES } from "../../config/constants";
import { useAuth } from "../../hooks/useAuth";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { InputField, TextAreaField } from "../../components/ui/Field";
import type { PurchaseRequest } from "../../types/models";

export function RequesterDashboard() {
  const { token, user } = useAuth();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [stats, setStats] = useState<Array<{ status: string; count: number }>>(
    [],
  );
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    itemName: "",
    itemDescription: "",
    technicalSpecifications: "",
    itemType: "IT" as "IT" | "NON_IT",
    quantity: 1,
    estimatedCost: 0,
    fundingSource: "MPP" as "MPP" | "SELF_FUND" | "SPECIAL_FUND",
    justification: "",
    department: user?.department || "",
    requiredDate: "",
    attachments: "",
  });

  const reload = async () => {
    if (!token) return;
    const [mine, requesterStats] = await Promise.all([
      requestApi.mine(token),
      dashboardApi.requester(token),
    ]);
    setRequests(mine);
    setStats(requesterStats);
  };

  useEffect(() => {
    void reload();
  }, [token]);

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const payload = {
      ...form,
      attachments: form.attachments
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    await requestApi.create(token, payload);
    setMessage("Request submitted");
    await reload();
  };

  const confirmSpec = async (
    requestId: number,
    action: "ACCEPT" | "REQUEST_MODIFICATION",
  ) => {
    if (!token) return;
    await specificationApi.requesterConfirm(token, requestId, action);
    await reload();
  };

  return (
    <div className="dashboard-grid">
      <Card title="Submit Purchase Request">
        <form className="grid" onSubmit={submitRequest}>
          <InputField
            label="Item Name"
            value={form.itemName}
            onChange={(e) =>
              setForm((s) => ({ ...s, itemName: e.target.value }))
            }
            required
          />
          <InputField
            label="Item Description"
            value={form.itemDescription}
            onChange={(e) =>
              setForm((s) => ({ ...s, itemDescription: e.target.value }))
            }
          />
          <TextAreaField
            label="Technical Specifications"
            value={form.technicalSpecifications}
            onChange={(e) =>
              setForm((s) => ({
                ...s,
                technicalSpecifications: e.target.value,
              }))
            }
            required
          />

          <label className="field">
            <span>Item Type</span>
            <select
              value={form.itemType}
              onChange={(e) =>
                setForm((s) => ({
                  ...s,
                  itemType: e.target.value as "IT" | "NON_IT",
                }))
              }
            >
              {ITEM_TYPES.map((itemType) => (
                <option key={itemType} value={itemType}>
                  {itemType}
                </option>
              ))}
            </select>
          </label>

          <InputField
            label="Quantity"
            type="number"
            value={form.quantity}
            onChange={(e) =>
              setForm((s) => ({ ...s, quantity: Number(e.target.value) }))
            }
            min={1}
            required
          />
          <InputField
            label="Estimated Cost"
            type="number"
            value={form.estimatedCost}
            onChange={(e) =>
              setForm((s) => ({ ...s, estimatedCost: Number(e.target.value) }))
            }
            min={0}
            required
          />

          <label className="field">
            <span>Funding Source</span>
            <select
              value={form.fundingSource}
              onChange={(e) =>
                setForm((s) => ({
                  ...s,
                  fundingSource: e.target.value as
                    | "MPP"
                    | "SELF_FUND"
                    | "SPECIAL_FUND",
                }))
              }
            >
              {FUNDING_SOURCES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>

          <TextAreaField
            label="Justification"
            value={form.justification}
            onChange={(e) =>
              setForm((s) => ({ ...s, justification: e.target.value }))
            }
            required
          />
          <InputField
            label="Department"
            value={form.department}
            onChange={(e) =>
              setForm((s) => ({ ...s, department: e.target.value }))
            }
            required
          />
          <InputField
            label="Required Date"
            type="date"
            value={form.requiredDate}
            onChange={(e) =>
              setForm((s) => ({ ...s, requiredDate: e.target.value }))
            }
            required
          />
          <InputField
            label="Attachments (comma-separated names/urls)"
            value={form.attachments}
            onChange={(e) =>
              setForm((s) => ({ ...s, attachments: e.target.value }))
            }
          />

          <Button type="submit">Submit</Button>
          {message && <p className="success">{message}</p>}
        </form>
      </Card>

      <Card title="My Request Status Summary">
        <ul className="list">
          {stats.map((s) => (
            <li key={s.status}>
              <strong>{s.status}</strong>: {s.count}
            </li>
          ))}
        </ul>
      </Card>

      <Card title="My Requests">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Item</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td>{r.request_id}</td>
                <td>{r.item_name}</td>
                <td>{r.status}</td>
                <td>
                  {r.status === "SPEC_RETURNED_TO_REQUESTER" ? (
                    <div className="row">
                      <Button onClick={() => void confirmSpec(r.id, "ACCEPT")}>
                        Accept
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          void confirmSpec(r.id, "REQUEST_MODIFICATION")
                        }
                      >
                        Request Modification
                      </Button>
                    </div>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
