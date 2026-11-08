import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

/**
 * Resolves the signed-in user's role and staff profile.
 * Admins (guidance counselors) have full access.
 * Teachers need an active staff profile created by an administrator.
 */
export function useAccess() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!user) {
        setLoading(false);
        return;
      }
      if (user.role === "admin") {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { items } = await base44.entities.TeacherProfile.filter({ email: user.email }, { limit: 1 });
        if (!cancelled) setProfile(items?.[0] || null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const isAdmin = user?.role === "admin";

  return {
    user,
    isAdmin,
    profile,
    loading,
    allowed: isAdmin || profile?.active === true,
  };
}