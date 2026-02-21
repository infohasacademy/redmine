import Pusher from "pusher-js";

export const pusherClient = new Pusher(
  process.env.NEXT_PUBLIC_PUSHER_KEY || "demo-key",
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "us2",
  }
);

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
