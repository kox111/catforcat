"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";

interface UserPlanContextValue {
  plan: string;
  loading: boolean;
  avatarUrl: string | null;
  setAvatarUrl: (url: string | null) => void;
}

const UserPlanContext = createContext<UserPlanContextValue>({
  plan: "free",
  loading: true,
  avatarUrl: null,
  setAvatarUrl: () => {},
});

export function useUserPlan() {
  return useContext(UserPlanContext);
}

export default function UserPlanProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { data: session } = useSession();
  const [plan, setPlan] = useState("free");
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) {
      setLoading(false);
      return;
    }
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.plan) setPlan(data.plan);
        setAvatarUrl(data?.avatarUrl || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session?.user]);

  return (
    <UserPlanContext.Provider value={{ plan, loading, avatarUrl, setAvatarUrl }}>
      {children}
    </UserPlanContext.Provider>
  );
}
