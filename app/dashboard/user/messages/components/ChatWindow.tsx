// app/(dashboard)/user/messages/components/ChatWindow.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { format } from "date-fns";
import {
  Send,
  MoreVertical,
  Phone,
  Video,
  Info,
  Image as ImageIcon,
  Paperclip,
  AlertTriangle,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { pusherClient } from "@/lib/pusher";
import { toast } from 'react-hot-toast';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  media_url?: string;
  created_at: string;
  is_read: boolean;
}

interface ChatWindowProps {
  userId: string;
}

export function ChatWindow({ userId }: ChatWindowProps) {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const chatId = searchParams.get("chat");

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [otherUser, setOtherUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageBlocked, setMessageBlocked] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!chatId) return;

    fetchMessages();
    markMessagesAsRead();

    // Subscribe to Pusher for real-time messages
    const channel = pusherClient.subscribe(`chat-${chatId}`);

    channel.bind("new-message", (data: any) => {
      // Only add messages from other users (current user messages are added in sendMessage)
      if (data.message && data.message.sender_id !== session?.user?.id) {
        setMessages((prev) => [...prev, data.message]);
        scrollToBottom();
      }
    });

    channel.bind("message-read", (data: any) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId ? { ...msg, is_read: true } : msg,
        ),
      );
    });

    return () => {
      channel.unsubscribe();
    };
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages/${chatId}`);
      const data = await response.json();
      setMessages(data.messages);
      setOtherUser(data.otherUser);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await fetch(`/api/messages/${chatId}/read`, { method: "POST" });
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && !fileInputRef.current?.files?.length) return;

    setSending(true);
    try {
      let mediaUrl;
      if (fileInputRef.current?.files?.[0]) {
        const formData = new FormData();
        formData.append("file", fileInputRef.current.files[0]);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadResponse.json();
        mediaUrl = uploadData.url;
      }

      const response = await fetch(`/api/messages/conversations/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newMessage,
          messageType: mediaUrl ? 'image' : 'text',
          mediaUrl,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Success: add message immediately to avoid double-add from Pusher
        setMessages((prev) => [...prev, data]);
        // Clear input
        setNewMessage("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else if (data.blocked) {
        // Blocked: clear input immediately and show visual feedback
        console.log("[v0] Message blocked, clearing input");
        setNewMessage(""); // Force clear
        setTimeout(() => setNewMessage(""), 0); // Ensure it clears even if state is batched
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setMessageBlocked(true);
        setTimeout(() => setMessageBlocked(false), 2000);
        
        // Show single clear message
        const categories = data.toxic_categories?.length > 0 ? ` (${data.toxic_categories.join(', ')})` : '';
        toast.error(`${data.error || 'Your message contains inappropriate content'}${categories}`, {
          duration: 5000,
          icon: '🚫',
        });
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Your Messages</h3>
          <p className="text-gray-500 mb-4">
            Send private photos and messages to a friend
          </p>
          <Button>Send Message</Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar src={otherUser?.avatar_url} alt={otherUser?.username} />
            {otherUser?.is_online && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
            )}
          </div>
          <div>
            <p className="font-semibold">
              {otherUser?.full_name || otherUser?.username}
            </p>
            <p className="text-xs text-gray-500">
              {otherUser?.is_online ? "Active now" : "Offline"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Info className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Profile</DropdownMenuItem>
              <DropdownMenuItem>Clear Chat</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                Block User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          const isOwn = message.sender_id === userId;
          const showDate =
            index === 0 ||
            new Date(message.created_at).toDateString() !==
              new Date(messages[index - 1].created_at).toDateString();

          return (
            <div key={message.id}>
              {showDate && (
                <div className="flex justify-center my-4">
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-3 py-1 rounded-full">
                    {format(new Date(message.created_at), "MMMM d, yyyy")}
                  </span>
                </div>
              )}

              <div
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] ${
                    isOwn
                      ? "bg-primary text-white rounded-tl-lg rounded-tr-lg rounded-bl-lg"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-lg rounded-tr-lg rounded-br-lg"
                  } p-3`}
                >
                  {message.media_url && (
                    <div className="mb-2">
                      <Image
                        src={message.media_url}
                        alt="Shared image"
                        width={200}
                        height={200}
                        className="rounded-lg"
                      />
                    </div>
                  )}
                  {message.content && <p>{message.content}</p>}
                  <div
                    className={`text-xs mt-1 ${isOwn ? "text-white/70" : "text-gray-500"}`}
                  >
                    {format(new Date(message.created_at), "h:mm a")}
                    {isOwn && message.is_read && (
                      <span className="ml-2">✓✓</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-end space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <Textarea
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className={`min-h-[40px] max-h-[120px] resize-none transition-all ${
                messageBlocked ? 'border-red-500 bg-red-50 dark:bg-red-950' : ''
              }`}
            />
          </div>
          <Button
            onClick={sendMessage}
            disabled={
              !newMessage.trim() && !fileInputRef.current?.files?.length
            }
            isLoading={sending}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Message Blocked Indicator */}
        {messageBlocked && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2 animate-slideInUp text-sm">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-600 dark:text-red-400">Your message was blocked for inappropriate content.</p>
          </div>
        )}
      </div>
    </div>
  );
}
