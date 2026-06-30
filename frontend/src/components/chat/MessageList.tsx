import React, { useEffect, useRef } from "react";
import { useChat } from "../../hooks/useChat";
import type { Message } from "../../types/chat.types";

export const MessageList: React.FC = () => {
  const { messages, activeRoom, typingUsers } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  // Message Grouping Logic
  const isGrouped = (currentMsg: Message, prevMsg: Message | undefined): boolean => {
    if (!prevMsg) return false;
    if (currentMsg.sender !== prevMsg.sender) return false;
    if (currentMsg.room !== prevMsg.room) return false;
    if (currentMsg.isSystem !== prevMsg.isSystem) return false;

    const timeDiff = new Date(currentMsg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime();
    return timeDiff < 60000; // 60 seconds
  };

  const currentTypingUsers = activeRoom && !activeRoom.startsWith("@")
    ? typingUsers[activeRoom] || []
    : [];

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-1 relative">
      {messages.length === 0 && !currentTypingUsers.length && (
        <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-muted)]">
          <p className="text-sm italic">No messages yet. Say hello!</p>
        </div>
      )}

      {messages.map((msg, idx) => {
        const prevMsg = messages[idx - 1];
        const grouped = isGrouped(msg, prevMsg);
        const isMe = msg.sender === "Me";
        const isDM = activeRoom?.startsWith("@");
        const isSystem = msg.isSystem;

        // System Messages
        if (isSystem) {
          return (
            <div key={msg.id} className="flex justify-center my-4 animate-fade-in">
              <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-base)] px-3 py-1 rounded-full border border-[var(--color-border)]">
                {msg.content}
              </span>
            </div>
          );
        }

        return (
          <div
            key={msg.id}
            className={`flex ${isDM && isMe ? "justify-end" : "justify-start"} ${grouped ? "mt-0.5" : "mt-4"} animate-fade-in`}
          >
            <div className={`flex items-end gap-2 max-w-[75%] ${isDM && isMe ? "flex-row-reverse" : ""}`}>

              {/* Avatar (Hidden if grouped) */}
              {!grouped && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/30 flex items-center justify-center text-xs font-bold text-[var(--color-accent)]">
                  {msg.sender.charAt(0).toUpperCase()}
                </div>
              )}
              {grouped && <div className="w-8 flex-shrink-0" />} {/* Spacer for alignment */}

              {/* Message Bubble */}
              <div className="flex flex-col">
                {/* Header (Name & Time - Hidden if grouped) */}
                {!grouped && (
                  <div className={`flex items-baseline gap-2 mb-1 ${isDM && isMe ? "flex-row-reverse" : ""}`}>
                    <span className="text-sm font-semibold text-[var(--color-text-main)]">
                      {msg.sender}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-muted)]">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}

                {/* Bubble Body */}
                <div
                  className={`px-3.5 py-2 text-sm text-[var(--color-text-main)] break-words whitespace-pre-wrap
                    ${isDM && isMe
                      ? "bg-[var(--color-accent)] text-white rounded-2xl rounded-br-md"
                      : "bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl rounded-bl-md"
                    }
                    ${grouped
                      ? isDM && isMe
                        ? "rounded-tr-md"
                        : "rounded-tl-md"
                      : ""
                    }
                  `}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Typing Indicator */}
      {currentTypingUsers.length > 0 && (
        <div className="flex items-center gap-2 pt-4 pl-10 animate-fade-in">
          <div className="flex items-center gap-1 bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-2.5 rounded-2xl rounded-bl-md">
            <span className="w-1.5 h-1.5 bg-[var(--color-text-muted)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-1.5 h-1.5 bg-[var(--color-text-muted)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-1.5 h-1.5 bg-[var(--color-text-muted)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            <span className="text-xs text-[var(--color-text-muted)] ml-2 italic">
              {currentTypingUsers.length === 1
                ? `${currentTypingUsers[0]} is typing...`
                : `${currentTypingUsers.slice(0, 2).join(" and ")}${currentTypingUsers.length > 2 ? ` and ${currentTypingUsers.length - 2} others` : ""} are typing...`}
            </span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};