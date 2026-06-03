"use client";

import { useEffect } from "react";
import { trackClientEvent } from "@/lib/analytics-client";

export function FounderProfileTracker({ founderUserId }: { founderUserId: string }) {
  useEffect(() => {
    trackClientEvent("founder_profile_viewed", {
      profile_user_id: founderUserId,
    });
  }, [founderUserId]);

  return null;
}
