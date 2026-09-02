import { createContext, ReactNode, useState } from "react";
import type { UserPresence } from "@chat-x/shared";

interface PresenceContextValue {
  presences: Record<string, UserPresence>;
  setPresence: (presence: UserPresenceUpdate) => void;
}

type UserPresenceUpdate = Partial<UserPresence> & Pick<UserPresence, "userId">;

const PresenceContext = createContext<PresenceContextValue | null>(null);

function PresenceProvider({ children }: { children: ReactNode }) {
  const [userPresences, setUserPresences] = useState<Record<string, UserPresence>>({});

  const setPresence = ({ userId, isOnline, userName }: UserPresenceUpdate) => {
    setUserPresences((prev) => {
      const existing = prev[userId];
      return {
        ...prev,
        [userId]: {
          ...existing,
          userId,
          isOnline: isOnline ?? existing?.isOnline,
          userName: userName ?? existing?.userName,
        },
      };
    });
  };

  const context: PresenceContextValue = {
    presences: userPresences,
    setPresence,
  };

  return <PresenceContext value={context}>{children}</PresenceContext>;
}

export { PresenceContext, PresenceProvider };
