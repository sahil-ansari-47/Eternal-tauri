import { useEffect, useRef } from "react";

interface ChatProps {
  messages: Message[];
  userData: UserData | null;
  chatKey: string;
  fetchChat: (chatKey: string, page: number) => Promise<void>;
  page: number;
  hasMore: boolean;
}

const ChatWindow: React.FC<ChatProps> = ({
  messages,
  userData,
  chatKey,
  fetchChat,
  page,
  hasMore,
}) => {
  const chatRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  function formatToIST(date: Date): string {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    }).format(date);
  }

  const handleScroll = async () => {
    if (!chatRef.current || loadingRef.current || !hasMore) return;

    if (chatRef.current.scrollTop <= 0) {
      loadingRef.current = true;

      const prevHeight = chatRef.current.scrollHeight;

      await fetchChat(chatKey, page + 1);

      requestAnimationFrame(() => {
        if (!chatRef.current) return;

        const newHeight = chatRef.current.scrollHeight;
        chatRef.current.scrollTop = newHeight - prevHeight;
        loadingRef.current = false;
      });
    }
  };
  // Scroll to bottom on initial load
  useEffect(() => {
    if (chatRef.current && page === 1) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, page]);
  const filteredMessages = messages.filter(
    (msg: Message) => msg.chatKey === chatKey
  );

  return (
    <div
      ref={chatRef}
      onScroll={handleScroll}
      className="h-10/12 py-2 rounded-md overflow-y-scroll scrollbar"
    >
      <div className="flex flex-col gap-1 pr-2">
        {filteredMessages.length === 0 ? (
          <div className="text-center text-gray-400 mt-5">
            No messages. Start a conversation.
          </div>
        ) : (
          filteredMessages.map((msg: Message) => (
            <div
              key={msg.id}
              className={`flex pl-4 ${
                msg.from === userData?.username
                  ? "justify-end"
                  : msg.from === "system"
                  ? "justify-center"
                  : "justify-start"
              }`}
            >
              <div
                className={`px-3 py-2 rounded-2xl max-w-[70%] whitespace-pre-wrap ${
                  msg.from === userData?.username
                    ? "bg-neutral-700 text-p6"
                    : msg.from === "system"
                    ? "bg-primary text-neutral-300 text-center"
                    : "bg-p6 text-p5"
                }`}
              >
                {msg.text}
                {msg.from !== "system" && (
                  <span className="block text-xs text-right text-gray-400">
                    {formatToIST(msg.timestamp)}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
