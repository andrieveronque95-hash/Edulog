import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { Bell, CheckCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const page = await base44.entities.Notification.filter({}, { sort: "-created_date", limit: 30 });
    setItems(page.items || []);
  };

  useEffect(() => {
    load();
    const unsubscribe = base44.entities.Notification.subscribe(() => {
      load();
    });
    return unsubscribe;
  }, []);

  const isUnread = (notification) => !(notification.read_by || []).includes(user?.id);
  const unread = items.filter(isUnread);

  const markRead = async (notification) => {
    if (!isUnread(notification)) return;
    const readBy = [...(notification.read_by || []), user.id];
    setItems((current) =>
      current.map((item) => (item.id === notification.id ? { ...item, read_by: readBy } : item))
    );
    await base44.entities.Notification.update(notification.id, { read_by: readBy });
  };

  const markAllRead = async () => {
    if (!unread.length) return;
    const updates = unread.map((item) => ({ id: item.id, read_by: [...(item.read_by || []), user.id] }));
    setItems((current) =>
      current.map((item) => (isUnread(item) ? { ...item, read_by: [...(item.read_by || []), user.id] } : item))
    );
    await base44.entities.Notification.bulkUpdate(updates);
  };

  const openNotification = async (notification) => {
    await markRead(notification);
    setOpen(false);
    if (notification.incident_id) navigate(`/incidents/${notification.incident_id}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
              {unread.length > 9 ? "9+" : unread.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[330px] p-0">
        <div className="flex items-center justify-between gap-2 border-b border-border/70 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            <p className="text-[11px] text-muted-foreground">
              {unread.length === 0 ? "All caught up" : `${unread.length} unread`}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={markAllRead}
            disabled={unread.length === 0}
          >
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </Button>
        </div>

        <ul className="max-h-80 overflow-y-auto">
          {items.length === 0 && (
            <li className="px-4 py-10 text-center text-xs text-muted-foreground">
              No notifications yet. New teacher submissions will appear here.
            </li>
          )}
          {items.map((notification) => (
            <li key={notification.id} className="border-b border-border/50 last:border-0">
              <button
                type="button"
                onClick={() => openNotification(notification)}
                className={`w-full px-4 py-3 text-left transition-colors hover:bg-secondary/60 ${
                  isUnread(notification) ? "bg-primary/5" : ""
                }`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                      isUnread(notification) ? "bg-primary" : "bg-transparent"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground">New incident report</p>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {notification.teacher_name} · {notification.category}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {notification.case_number} · {notification.student_name}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {moment(notification.submitted_at || notification.created_date).format("MMM D, YYYY · h:mm A")}
                    </p>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}