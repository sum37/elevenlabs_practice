import { useCallback, useContext, useEffect, useState } from "react";
import VrmViewer from "@/components/vrmViewer";
import { ViewerContext } from "@/features/vrmViewer/viewerContext";
import { Message, textsToScreenplay, Screenplay } from "@/features/messages/messages";
import { speakCharacter } from "@/features/messages/speakCharacter";
import { MessageInputContainer } from "@/components/messageInputContainer";
import { SYSTEM_PROMPT } from "@/features/constants/systemPromptConstants";
import { KoeiroParam, DEFAULT_KOEIRO_PARAM } from "@/features/constants/koeiroParam";
import { getChatResponseStream } from "@/features/chat/openAiChat";
import { ElevenLabsParam, DEFAULT_ELEVEN_LABS_PARAM } from "@/features/constants/elevenLabsParam";
import { buildUrl } from "@/utils/buildUrl";
import { websocketService } from '../services/websocketService';
import { MessageMiddleOut } from "@/features/messages/messageMiddleOut";
import NavBar from "../components/navBar";
import { ChatLog } from "@/components/chatLog";
import AuthContext from "@/context/AuthContext";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Home() {
  const { viewer } = useContext(ViewerContext);

  const [systemPrompt, setSystemPrompt] = useState(SYSTEM_PROMPT);
  const [chatProcessing, setChatProcessing] = useState(false);
  const [chatLog, setChatLog] = useState<Message[]>([]);
  const [assistantMessage, setAssistantMessage] = useState("");
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);

  // ✅ 환경 변수에서 API 키 가져오기
  const openAiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || "";
  const elevenLabsKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || "";
  const openRouterKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || "";

  const [elevenLabsParam, setElevenLabsParam] = useState<ElevenLabsParam>(DEFAULT_ELEVEN_LABS_PARAM);
  const [koeiroParam, setKoeiroParam] = useState<KoeiroParam>(DEFAULT_KOEIRO_PARAM);

  const {data: session, status} = useSession();

  console.log(session);
  console.log("Session status:", status);
  
  useEffect(() => {
    if (window.localStorage.getItem("chatVRMParams")) {
      const params = JSON.parse(window.localStorage.getItem("chatVRMParams") as string);
      setSystemPrompt(params.systemPrompt);
      setElevenLabsParam(params.elevenLabsParam);
      setChatLog(params.chatLog);
    }
    const savedBackground = localStorage.getItem('backgroundImage');
    if (savedBackground) {
      setBackgroundImage(savedBackground);
    }
  }, []);

  // useEffect(() => {
  //   setChatLog([]); // ✅ 대화 기록 초기화
  //   window.localStorage.removeItem("chatVRMParams"); // ✅ 로컬스토리지도 삭제
  // }, []);
  

  useEffect(() => {
    process.nextTick(() => {
      window.localStorage.setItem("chatVRMParams", JSON.stringify({ systemPrompt, elevenLabsParam, chatLog }));
    });
  }, [systemPrompt, elevenLabsParam, chatLog]);

  const handleSendChat = useCallback(
    async (text: string) => {
      const newMessage = text;
      if (!newMessage) return;

      setChatProcessing(true);
      const messageLog: Message[] = [...chatLog, { role: "user", content: newMessage }];
      setChatLog(messageLog);

      const messageProcessor = new MessageMiddleOut();
      const processedMessages = messageProcessor.process([
        { role: "system", content: systemPrompt },
        ...messageLog,
      ]);

      const stream = await getChatResponseStream(processedMessages, openAiKey, openRouterKey).catch((e) => {
        console.error(e);
        return null;
      });

      if (!stream) {
        setChatProcessing(false);
        return;
      }

      const reader = stream.getReader();
      let receivedMessage = "";
      let aiTextLog = "";
      let tag = "";
      const sentences = new Array<string>();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          receivedMessage += value;

          const tagMatch = receivedMessage.match(/^\[(.*?)\]/);
          if (tagMatch && tagMatch[0]) {
            tag = tagMatch[0];
            receivedMessage = receivedMessage.slice(tag.length);
          }

          const sentenceMatch = receivedMessage.match(/^(.+[。．！？\n.!?]|.{10,}[、,])/);
          if (sentenceMatch && sentenceMatch[0]) {
            const sentence = sentenceMatch[0];
            sentences.push(sentence);
            receivedMessage = receivedMessage.slice(sentence.length).trimStart();

            if (!sentence.replace(/^[\s\[\(\{「［（【『〈《〔｛«‹〘〚〛〙›»〕》〉』】）］」\}\)\]]+$/g, "")) {
              continue;
            }

            const aiText = `${tag} ${sentence}`;
            const aiTalks = textsToScreenplay([aiText], koeiroParam);
            aiTextLog += aiText;

            const currentAssistantMessage = sentences.join(" ");
            await speakCharacter(aiTalks[0], elevenLabsKey, elevenLabsParam, viewer, () => {
              setAssistantMessage(currentAssistantMessage);
            });
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        reader.releaseLock();
        setChatProcessing(false);
      }

      setChatLog([...messageLog, { role: "assistant", content: aiTextLog }]);
    },
    [systemPrompt, chatLog, openAiKey, elevenLabsKey, elevenLabsParam, openRouterKey, koeiroParam, viewer]
  );

  useEffect(() => {
    websocketService.setLLMCallback(async (message: string) => {
      if (isAISpeaking || isPlayingAudio || chatProcessing) {
        return { processed: false, error: 'System is busy processing previous message' };
      }

      await handleSendChat(message);
      return { processed: true };
    });
  }, [handleSendChat, chatProcessing, isPlayingAudio, isAISpeaking]);

  return (
    <div className="relative w-screen h-screen flex flex-col">
        <h1>로그인 상태 확인</h1>
      <p>Session Status: {status}</p>
      <pre>{JSON.stringify(session, null, 2)}</pre>

      {status === "loading" ? (
        <p>🔄 세션 로딩 중...</p> 
      ) : session ? (
        <button onClick={() => signOut()}>👋 로그아웃</button>
      ) : (
        <>
          <p>🚫 로그인되지 않았습니다.</p>
          <button onClick={() => signIn()}>🔑 로그인</button>
        </>
      )}
      <NavBar />
      <div className="flex-grow">
        <VrmViewer />
      </div>
      <ChatLog messages={chatLog} />
      <MessageInputContainer isChatProcessing={chatProcessing} onChatProcessStart={handleSendChat} />
    </div>
  );
}
