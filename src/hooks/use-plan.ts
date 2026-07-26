import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDevPro } from "@/hooks/use-dev-pro";

export function usePlan() {
  const { devPro } = useDevPro();
  const { data, isLoading } = useQuery({
    queryKey: ["my-plan"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return { tier: "free" as const, signedIn: false };
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_status")
        .eq("id", auth.user.id)
        .maybeSingle();
      return { tier: (profile?.subscription_status ?? "free") as string, signedIn: true };
    },
    staleTime: 60_000,
  });
  return {
    isLoading,
    signedIn: data?.signedIn ?? false,
    isPro: (data?.tier ?? "free") !== "free",
  };
}
