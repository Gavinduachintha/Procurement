import { useEffect, useState } from "react";
import { dashboardApi } from "../../api/dashboardApi";
import { useAuth } from "../../hooks/useAuth";
import { Card } from "../../components/ui/Card";
import type { NotificationItem } from "../../types/models";

export function NotificationsPanel() {
  const { token } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      const data = await dashboardApi.notifications(token);
      setItems(data.slice(0, 10));
    };
    void load();
  }, [token]);

  return (
    <Card title="Latest Notifications">
      <ul className="list">
        {items.map((item) => (
          <li key={item.id}>
            <strong>{item.subject}</strong>
            <p>{item.message}</p>
          </li>
        ))}
        {!items.length && <li>No notifications yet.</li>}
      </ul>
    </Card>
  );
}
