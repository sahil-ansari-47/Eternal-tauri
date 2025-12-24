// utils/time.ts
export function getRelativeTime(input: Date): string {
  const now = Date.now();
  const then = new Date(input).getTime();

  let seconds = Math.floor((now - then) / 1000);

  // Future dates or invalid -> treat as just now
  if (seconds < 60) return "just now";

  const units = [
    { abbr: "y", seconds: 365 * 24 * 60 * 60 }, // year
    { abbr: "mo", seconds: 30 * 24 * 60 * 60 }, // month (approx)
    { abbr: "w", seconds: 7 * 24 * 60 * 60 }, // week
    { abbr: "d", seconds: 24 * 60 * 60 }, // day
    { abbr: "h", seconds: 60 * 60 }, // hour
    { abbr: "m", seconds: 60 }, // minute
  ];

  for (const u of units) {
    if (seconds >= u.seconds) {
      const value = Math.floor(seconds / u.seconds);
      return `${value}${u.abbr} ago`;
    }
  }

  return "just now";
}

export async function showNotification(title: string, body: string) {
  // Check if we're in a Tauri environment
  const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  
  if (isTauri) {
    try {
      const {
        isPermissionGranted,
        requestPermission,
        sendNotification,
      } = await import("@tauri-apps/plugin-notification");
      
      let permissionGranted = await isPermissionGranted();
      console.log("Permission granted:", permissionGranted);
      if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === "granted";
      }
      if (permissionGranted) {
        sendNotification({
          title,
          body,
        });
      }
    } catch (error) {
      console.warn("Tauri notification failed, falling back to browser:", error);
      // Fall through to browser notification
      fallbackBrowserNotification(title, body);
    }
  } else {
    // Use browser's native notification API
    fallbackBrowserNotification(title, body);
  }
}

function fallbackBrowserNotification(title: string, body: string) {
  // Check if browser supports notifications
  if (!("Notification" in window)) {
    console.log("Notifications not supported in this browser");
    return;
  }

  // Check if permission is already granted
  if (Notification.permission === "granted") {
    new Notification(title, { body });
  } else if (Notification.permission !== "denied") {
    // Request permission
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification(title, { body });
      }
    });
  }
}
