import { supabase } from '@data/supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY
  || 'BLMu0x1a_rMoWMFSRMl0ibywqFYJU8-upD-zLnLZ1RllJGUMv4hHef-l6x5rISo5Upg7M93W3X_DGSoFa35XNCY';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export class PushService {
  static isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  static getVapidKey(): string {
    return VAPID_PUBLIC_KEY;
  }

  static async getPermissionState(): Promise<NotificationPermission> {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
  }

  static async subscribe(): Promise<PushSubscription | null> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported in this browser.');
    }
    if (!VAPID_PUBLIC_KEY) {
      throw new Error('VAPID public key is not configured.');
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    const subscriptionJSON = subscription.toJSON();
    const { data, error } = await supabase
      .from('push_subscriptions')
      .insert({
        endpoint: subscriptionJSON.endpoint,
        p256dh: subscriptionJSON.keys?.p256dh || '',
        auth: subscriptionJSON.keys?.auth || '',
      })
      .select()
      .maybeSingle();

    if (error) throw error;
    return data as PushSubscription | null;
  }

  static async unsubscribe(): Promise<void> {
    if (!this.isSupported()) return;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
    }

    const { data: existing } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint');

    if (existing && existing.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('id', existing.map((s: { id: string }) => s.id));
    }
  }

  static async isSubscribed(): Promise<boolean> {
    if (!this.isSupported()) return false;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  }
}
