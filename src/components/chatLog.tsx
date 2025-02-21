import { useEffect, useRef } from "react";
import { Message } from "@/features/messages/messages";
type Props = {
  messages: Message[];
};
export const ChatLog = ({ messages }: Props) => {
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({
      behavior: "auto",
      block: "center",
    });
  }, []);

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [messages]);
  return (
    <div className="w-screen h-1/2">
      <div className="max-h-full overflow-y-auto scroll-hidden pb-64">
        {messages.map((msg, i) => {
          return (
            <div key={i} ref={messages.length - 1 === i ? chatScrollRef : null}>
              <Chat role={msg.role} message={msg.content} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Chat = ({ role, message }: { role: string; message: string }) => {
  // const roleColor =
  //   role === "assistant" ? "bg-blue-200" : "bg-blue-500 text-primary";
  // const roleText = role === "assistant" ? "text-secondary" : "text-primary";
  // const offsetX = role === "user" ? "pl-40" : "pr-40";
  const isUser = role === "user";

  return (
    <div className={`mx-auto w-[70vw] my-16 ${isUser? "justify-end text-right": "justify-start"}`}>
      {/* <div className="px-24 py-16 bg-white rounded-b-8"> */}
      <div className={`px-24 py-16 rounded-b-8`}>
        <div className={`typography-16 font-M_PLUS_2 font-bold`}>
          {message}
        </div>
      </div>
    </div>
  );
};
