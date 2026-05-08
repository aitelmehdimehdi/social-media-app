import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { apiGet } from "../utils/api";
import { getSocket, getNotifSocket } from "../utils/socket";

export type LatestMessage = {
  senderId: string;
  senderUsername: string;
  content: string;
  avatar: string | null;
};

export type LatestNotification = {
  id: string;
  type: "like" | "comment" | "follow";
  senderId: string;
  senderUsername: string;
  senderAvatar: string | null;
  postId?: string;
};

type UnreadContextType = {
  unreadDMs: number;
  latestMessage: LatestMessage | null;
  resetUnreadDMs: () => void;
  clearLatestMessage: () => void;
  unreadNotifs: number;
  latestNotification: LatestNotification | null;
  resetUnreadNotifs: () => void;
  clearLatestNotification: () => void;
};

const UnreadContext = createContext<UnreadContextType>({
  unreadDMs: 0,
  latestMessage: null,
  resetUnreadDMs: () => {},
  clearLatestMessage: () => {},
  unreadNotifs: 0,
  latestNotification: null,
  resetUnreadNotifs: () => {},
  clearLatestNotification: () => {},
});

export function useUnread() {
  return useContext(UnreadContext);
}

type ApiMessage = {
  senderId: string;
  content: string;
  sender?: { username: string; avatar: string | null };
};

type Conversation = { unread: number };
type ApiNotification = { isRead: boolean };

export function UnreadProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [unreadDMs, setUnreadDMs] = useState(0);
  const [latestMessage, setLatestMessage] = useState<LatestMessage | null>(null);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [latestNotification, setLatestNotification] = useState<LatestNotification | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    // Fetch initial DM unread count
    apiGet<Conversation[]>("/chat/conversations")
      .then((convs) => setUnreadDMs(convs.reduce((sum, c) => sum + c.unread, 0)))
      .catch(() => {});

    // Fetch initial notification unread count
    apiGet<ApiNotification[]>("/notifications")
      .then((notifs) => setUnreadNotifs(notifs.filter((n) => !n.isRead).length))
      .catch(() => {});

    const chatSock = getSocket(user.id);
    const notifSock = getNotifSocket(user.id);

    const handleNewMessage = (msg: ApiMessage) => {
      if (msg.senderId === user.id) return;
      setUnreadDMs((prev) => prev + 1);
      setLatestMessage({
        senderId: msg.senderId,
        senderUsername: msg.sender?.username ?? "Someone",
        content: msg.content,
        avatar: msg.sender?.avatar ?? null,
      });
    };

    const handleNotification = (payload: LatestNotification) => {
      setUnreadNotifs((prev) => prev + 1);
      setLatestNotification(payload);
    };

    chatSock.on("newMessage", handleNewMessage);
    notifSock.on("notification", handleNotification);

    return () => {
      chatSock.off("newMessage", handleNewMessage);
      notifSock.off("notification", handleNotification);
    };
  }, [user?.id]);

  const resetUnreadDMs = useCallback(() => setUnreadDMs(0), []);
  const clearLatestMessage = useCallback(() => setLatestMessage(null), []);
  const resetUnreadNotifs = useCallback(() => setUnreadNotifs(0), []);
  const clearLatestNotification = useCallback(() => setLatestNotification(null), []);

  return (
    <UnreadContext.Provider
      value={{
        unreadDMs,
        latestMessage,
        resetUnreadDMs,
        clearLatestMessage,
        unreadNotifs,
        latestNotification,
        resetUnreadNotifs,
        clearLatestNotification,
      }}
    >
      {children}
    </UnreadContext.Provider>
  );
}
