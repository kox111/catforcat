"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useSession } from "next-auth/react";

interface UserPlanContextValue {
  plan: string;
  loading: boolean;
}

const UserPlanContext = createContext<UserPlanContextValue>({ plan: "free", loading: true });

export function useUserPlan() {
  return useContext(UserPlanContext);
}

export default function UserPlanProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [plan, setPlan] = useState("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) {
      setLoading(false);
      return;
    }
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.plan) setPlan(data.plan);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session?.user]);

  return (
    <UserPlanContext.Provider value={{ plan, loading }}>
      {children}
    </UserPlanContext.Provider>
  );
}
