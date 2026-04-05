import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// VAPID public key for web push - stored in Supabase secrets
// This is the public key that was generated and stored
const VAPID_PUBLIC_KEY = "BAoXgnD9JAMfOOUJwD-_b_K0-KueJfzGNp7vWSYjh2OD-VUTzi6A1BJjjyHPN5ulxpd1tPSwDIwOePy2xwAeQ5w";

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
};

export const usePushNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [vapidKey, setVapidKey] = useState<string | null>(null);

  useEffect(() => {
    const checkSupport = async () => {
      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      setIsSupported(supported);

      if ("Notification" in window) {
        setPermission(Notification.permission);
      }

      // Fetch VAPID key from config or use default
      if (supported) {
        try {
          // Try to get from app_config table
          const { data } = await supabase
            .from("app_config")
            .select("config_value")
            .eq("config_key", "vapid_public_key")
            .single();

          setVapidKey(data?.config_value || VAPID_PUBLIC_KEY);
        } catch {
          setVapidKey(VAPID_PUBLIC_KEY);
        }
      }
    };

    checkSupport();
  }, []);

  const subscriptionsQuery = useQuery({
    queryKey: ["push-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("push_subscriptions").select("*").eq("user_id", user?.id!);

      if (error) throw error;
      return data;
    },
    enabled: !!user && isSupported,
  });

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast.error("Push notifications are not supported in this browser");
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === "granted") {
      toast.success("Notifications enabled!");
      return true;
    } else if (result === "denied") {
      toast.error("Notification permission denied");
      return false;
    }
    return false;
  }, [isSupported]);

  const subscribe = useMutation({
    mutationFn: async () => {
      if (!isSupported) {
        throw new Error("Push notifications not supported");
      }

      if (!vapidKey) {
        throw new Error("Push notifications not configured - VAPID key missing");
      }

      // Don't register again - just wait for the existing service worker
      const registration = await navigator.serviceWorker.ready;

      console.log("[Push] Service worker ready:", registration.scope);

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const subscriptionJson = subscription.toJSON();

      // Save to database
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: user?.id,
          endpoint: subscription.endpoint,
          p256dh_key: subscriptionJson.keys?.p256dh || "",
          auth_key: subscriptionJson.keys?.auth || "",
        },
        {
          onConflict: "user_id,endpoint",
        },
      );

      if (error) throw error;
      return subscription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["push-subscriptions"] });
      toast.success("Push notifications enabled!");
    },
    onError: (error) => {
      console.error("Subscribe error:", error);
      toast.error("Failed to enable notifications");
    },
  });

  const unsubscribe = useMutation({
    mutationFn: async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;

      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();

        // Remove from database
        const { error } = await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", user?.id!)
          .eq("endpoint", subscription.endpoint);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["push-subscriptions"] });
      toast.success("Push notifications unsubscribed");
    },
    onError: (error) => {
      console.error("Unsubscribe error:", error);
      toast.error("Failed to unsubscribe");
    },
  });

  return {
    isSupported,
    permission,
    isSubscribed: (subscriptionsQuery.data?.length ?? 0) > 0,
    isLoading: subscriptionsQuery.isLoading,
    requestPermission,
    subscribe,
    unsubscribe,
  };
};
