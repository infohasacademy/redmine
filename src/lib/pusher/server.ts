import Pusher from "pusher";

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || "demo",
  key: process.env.PUSHER_KEY || "demo-key",
  secret: process.env.PUSHER_SECRET || "demo-secret",
  cluster: process.env.PUSHER_CLUSTER || "us2",
  useTLS: true,
});

export const PUSHER_CHANNELS = {
  CHAT: "chat-channel",
  NOTIFICATIONS: "notifications-channel",
  ACTIVITY: "activity-channel",
};

export const PUSHER_EVENTS = {
  NEW_MESSAGE: "new-message",
  MESSAGE_READ: "message-read",
  TYPING: "typing",
  NOTIFICATION: "notification",
  ACTIVITY: "activity",
  TICKET_UPDATED: "ticket-updated",
};
