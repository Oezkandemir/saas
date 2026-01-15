"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { useSupabase } from "@/components/supabase-provider";

interface AvatarContextType {
  avatarUrl: string | null;
  updateAvatarUrl: (url: string) => void;
}

const AvatarContext = createContext<AvatarContextType>({
  avatarUrl: null,
  updateAvatarUrl: () => {},
});

export function AvatarProvider({ children }: { children: ReactNode }) {
  const { session } = useSupabase();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    session?.user?.user_metadata?.avatar_url || null
  );

  // Keep avatar in sync with session changes
  useEffect(() => {
    setAvatarUrl(session?.user?.user_metadata?.avatar_url || null);
  }, [session]);

  // Update avatar URL function to be used by components
  const updateAvatarUrl = (url: string) => {
    setAvatarUrl(url);
  };

  return (
    <AvatarContext.Provider value={{ avatarUrl, updateAvatarUrl }}>
      {children}
    </AvatarContext.Provider>
  );
}

export const useAvatar = () => useContext(AvatarContext);
