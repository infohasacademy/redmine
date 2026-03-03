"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  Smile,
  MoreVertical,
  Search,
  Phone,
  Video,
  Users,
} from "lucide-react";

interface Message {
  id: string;
  content: string;
  user: {
    id: string;
    name: string | null;
    image?: string | null;
  };
  createdAt: string;
  edited?: boolean;
}

interface ChatChannel {
  id: string;
  name: string;
  type: "public" | "private" | "direct";
  members: number;
  unread?: number;
}

const sampleChannels: ChatChannel[] = [
  { id: "1", name: "General", type: "public", members: 24, unread: 3 },
  { id: "2", name: "Development", type: "public", members: 12 },
  { id: "3", name: "Design", type: "public", members: 8, unread: 1 },
  { id: "4", name: "Marketing", type: "public", members: 5 },
  { id: "5", name: "Project Updates", type: "private", members: 6 },
  { id: "6", name: "John Doe", type: "direct", members: 2, unread: 2 },
];

const sampleMessages: Message[] = [
  {
    id: "1",
    content: "Hey team! Just pushed the latest updates to the staging environment.",
    user: { id: "1", name: "John Doe" },
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "2",
    content: "Great work! I'll review the changes and provide feedback.",
    user: { id: "2", name: "Alice Smith" },
    createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
  },
  {
    id: "3",
    content: "I noticed a small issue with the responsive layout on mobile devices. Can someone take a look?",
    user: { id: "3", name: "Mike Johnson" },
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "4",
    content: "I'm on it! Should have a fix ready in about an hour.",
    user: { id: "1", name: "John Doe" },
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "5",
    content: "Also, don't forget we have the sprint planning meeting tomorrow at 10 AM. Please make sure to update your task estimates before the meeting.",
    user: { id: "4", name: "Sarah Wilson" },
    createdAt: new Date(Date.now() - 900000).toISOString(),
  },
  {
    id: "6",
    content: "Thanks for the reminder! I've updated my estimates. 👍",
    user: { id: "2", name: "Alice Smith" },
    createdAt: new Date(Date.now() - 600000).toISOString(),
  },
];

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>(sampleMessages);
  const [newMessage, setNewMessage] = useState("");
  const [activeChannel, setActiveChannel] = useState<ChatChannel>(sampleChannels[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      user: { id: "current", name: "You" },
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessageTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    if (isToday) {
      return format(d, "h:mm a");
    }
    return format(d, "MMM d, h:mm a");
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = "";

    messages.forEach((message) => {
      const messageDate = new Date(message.createdAt).toDateString();
      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({ date: currentDate, messages: [message] });
      } else {
        groups[groups.length - 1].messages.push(message);
      }
    });

    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2 px-4">
        <div className="flex items-center gap-3">
          <CardTitle className="text-lg font-semibold">Team Chat</CardTitle>
          <Badge variant="secondary" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            {activeChannel.members}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex p-0 overflow-hidden">
        {/* Channels sidebar */}
        <div className="w-56 border-r flex-shrink-0">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search channels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>
          <ScrollArea className="h-[calc(100vh-420px)]">
            <div className="p-2">
              <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Channels</p>
              {sampleChannels
                .filter((c) => c.type !== "direct")
                .filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => setActiveChannel(channel)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                      activeChannel.id === channel.id
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    )}
                  >
                    <span className="text-muted-foreground">#</span>
                    <span className="flex-1 text-left truncate">{channel.name}</span>
                    {channel.unread && (
                      <Badge variant="default" className="h-5 min-w-5 px-1.5 text-xs">
                        {channel.unread}
                      </Badge>
                    )}
                  </button>
                ))}
              
              <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground mt-4">Direct Messages</p>
              {sampleChannels
                .filter((c) => c.type === "direct")
                .filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => setActiveChannel(channel)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                      activeChannel.id === channel.id
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    )}
                  >
                    <div className="relative">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {channel.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
                    </div>
                    <span className="flex-1 text-left truncate">{channel.name}</span>
                    {channel.unread && (
                      <Badge variant="default" className="h-5 min-w-5 px-1.5 text-xs">
                        {channel.unread}
                      </Badge>
                    )}
                  </button>
                ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Channel header */}
          <div className="px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">#</span>
              <h3 className="font-medium">{activeChannel.name}</h3>
              {activeChannel.type === "private" && (
                <Badge variant="outline" className="text-xs">Private</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeChannel.members} members
            </p>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-4" ref={scrollRef}>
            <div className="py-4 space-y-4">
              {messageGroups.map((group, groupIndex) => (
                <div key={groupIndex}>
                  {/* Date separator */}
                  <div className="flex items-center gap-4 my-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground font-medium">
                      {format(new Date(group.date), "MMMM d, yyyy")}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Messages for this date */}
                  {group.messages.map((message, index) => {
                    const showAvatar =
                      index === 0 ||
                      group.messages[index - 1].user.id !== message.user.id;

                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-3",
                          !showAvatar && "mt-1"
                        )}
                      >
                        {showAvatar ? (
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={message.user.image || undefined} />
                            <AvatarFallback className="text-xs">
                              {message.user.name?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-8 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          {showAvatar && (
                            <div className="flex items-baseline gap-2">
                              <span className="font-medium text-sm">
                                {message.user.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatMessageTime(message.createdAt)}
                              </span>
                            </div>
                          )}
                          <p className="text-sm break-words">{message.content}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Input area */}
          <div className="p-4 border-t">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <div className="relative">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pr-24"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Smile className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </div>
              <Button onClick={sendMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
