import { Message } from "../messages/messages";
import { getWindowAI } from 'window.ai';

export async function getChatResponse(messages: Message[], apiKey: string) {
  // function currently not used
  throw new Error("Not implemented");

  /*
  if (!apiKey) {
    throw new Error("Invalid API Key");
  }

  const configuration = new Configuration({
    apiKey: apiKey,
  });
  // ブラウザからAPIを叩くときに発生するエラーを無くすworkaround
  // https://github.com/openai/openai-node/issues/6#issuecomment-1492814621
  delete configuration.baseOptions.headers["User-Agent"];

  const openai = new OpenAIApi(configuration);

  const { data } = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: messages,
  });

  const [aiRes] = data.choices;
  const message = aiRes.message?.content || "エラーが発生しました";

  return { message: message };
  */
}

// export async function getChatResponseStream(
//   messages: Message[],
//   apiKey: string,
//   openRouterKey: string
// ) {
//   // TODO: remove usages of apiKey in code
//   /*
//   if (!apiKey) {
//     throw new Error("Invalid API Key");
//   }
//   */

//   console.log('getChatResponseStream');

//   console.log('messages');
//   console.log(messages);

//   const stream = new ReadableStream({
//     async start(controller: ReadableStreamDefaultController) {
//       try {

//         const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
//         // const YOUR_SITE_URL = 'https://chat-vrm-window.vercel.app/';
//         // const YOUR_SITE_NAME = 'ChatVRM';

//         let isStreamed = false;
//         const generation = await fetch("https://openrouter.ai/api/v1/chat/completions", {
//           method: "POST",
//           headers: {
//             "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
//             // "HTTP-Referer": `${YOUR_SITE_URL}`, // Optional, for including your app on openrouter.ai rankings.
//             // "X-Title": `${YOUR_SITE_NAME}`, // Optional. Shows in rankings on openrouter.ai.
//             "Content-Type": "application/json"
//           },
//           body: JSON.stringify({
//             // "model": "cohere/command",
//             // "model": "openai/gpt-3.5-turbo",
//             // "model": "cohere/command-r-plus",
//             "model": "anthropic/claude-3.5-sonnet:beta",
//             "messages": messages,
//             "temperature": 0.7,
//             "max_tokens": 200,
//             "stream": true,
//           })
//         });

//         if (generation.body) {
//           const reader = generation.body.getReader();
//           try {
//             while (true) {
//               const { done, value } = await reader.read();
//               if (done) break;

//               // console.log('value');
//               // console.log(value);

//               // Assuming the stream is text, convert the Uint8Array to a string
//               let chunk = new TextDecoder().decode(value);
//               // Process the chunk here (e.g., append it to the controller for streaming to the client)
//               // console.log(chunk); // Or handle the chunk as needed

//               // split the chunk into lines
//               let lines = chunk.split('\n');
//               // console.log('lines');
//               // console.log(lines);

//               const SSE_COMMENT = ": OPENROUTER PROCESSING";


//               // filter out lines that start with SSE_COMMENT
//               lines = lines.filter((line) => !line.trim().startsWith(SSE_COMMENT));

//               // filter out lines that end with "data: [DONE]"
//               lines = lines.filter((line) => !line.trim().endsWith("data: [DONE]"));

//               // Filter out empty lines and lines that do not start with "data:"
//               const dataLines = lines.filter(line => line.startsWith("data:"));

//               // Extract and parse the JSON from each data line
//               const messages = dataLines.map(line => {
//                 // Remove the "data: " prefix and parse the JSON
//                 const jsonStr = line.substring(5); // "data: ".length == 5
//                 return JSON.parse(jsonStr);
//               });

//               // console.log('messages');
//               // console.log(messages);

//               // loop through messages and enqueue them to the controller

//               try {
//                 messages.forEach((message) => {
//                   const content = message.choices[0].delta.content;

//                   controller.enqueue(content);
//                 });
//               } catch (error) {
//                 // log the messages
//                 console.log('error processing messages:');
//                 console.log(messages);

//                 throw error;
//               }

//               // Parse the chunk as JSON
//               // const parsedChunk = JSON.parse(chunk);
//               // Access the content
//               // const content = parsedChunk.choices[0].delta.content;
//               // console.log(content); // Use the content as needed

//               // enqueue the content to the controller
//               // controller.enqueue(content);

//               isStreamed = true;
//             }
//           } catch (error) {
//             console.error('Error reading the stream', error);
//           } finally {
//             reader.releaseLock();
//           }
//         }

//         // handle case where streaming is not supported
//         if (!isStreamed) {
//           console.error('Streaming not supported! Need to handle this case.');
//           // controller.enqueue(response[0].message.content);
//         }
//       } catch (error) {
//         controller.error(error);
//       } finally {
//         controller.close();
//       }
//     },
//   });

//   return stream;
// }

export async function getChatResponseStream(
  messages: Message[],
  apiKey: string,
  openRouterKey: string
) {
  console.log("🔵 getChatResponseStream 시작");
  
  // ✅ 최근 메시지만 포함하여 토큰 수 줄이기 (예: 마지막 5개)
  const reducedMessages = messages.slice(-5);

  console.log("📌 요청 메시지 (최대 5개로 제한):", reducedMessages);

  const stream = new ReadableStream({
    async start(controller: ReadableStreamDefaultController) {
      try {
        const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
        console.log("✅ OPENROUTER_API_KEY 로드됨:", !!OPENROUTER_API_KEY);

        let isStreamed = false;
        console.log("🔵 OpenRouter API 요청 시작");

        const generation = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "anthropic/claude-3.5-sonnet:beta",
            messages: reducedMessages,  // ✅ 메시지 개수 제한
            temperature: 0.7,
            max_tokens: 100, // ✅ 토큰 제한 낮추기
            stream: true,
          })
        });

        console.log("🔵 API 응답 상태 코드:", generation.status);

        if (!generation.ok) {
          const errorResponse = await generation.text();
          console.error("🚨 OpenRouter API 오류:", errorResponse);
          return null;
        }

        if (generation.body) {
          console.log("✅ 스트리밍 응답 수신 중...");
          const reader = generation.body.getReader();

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                console.log("✅ 스트리밍 완료");
                break;
              }

              let chunk = new TextDecoder().decode(value);
              console.log("📥 스트리밍된 데이터:", chunk);

              let lines = chunk.split("\n");

              const dataLines = lines.filter(line => line.startsWith("data:"));

              const messages = dataLines
  .filter(line => !line.includes("[DONE]")) // ✅ "[DONE]" 라인을 JSON 파싱에서 제외
  .map(line => {
    try {
      const jsonStr = line.substring(5);
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error("🚨 JSON 파싱 오류:", error, "원본 데이터:", line);
      return null;
    }
  })
  .filter(msg => msg !== null);

              messages.forEach((message, index) => {
                if (!message.choices || !message.choices[0] || !message.choices[0].delta) {
                  console.error("🚨 잘못된 메시지 형식:", message);
                  return;
                }

                const content = message.choices[0].delta.content;
                console.log(`📢 ${index + 1}번째 메시지 처리 중:`, content);

                controller.enqueue(content);
              });

              isStreamed = true;
            }
          } catch (error) {
            console.error("🚨 스트리밍 읽기 중 오류 발생:", error);
          } finally {
            reader.releaseLock();
          }
        }

        if (!isStreamed) {
          console.error("🚨 스트리밍이 지원되지 않음! fallback 필요");
        }
      } catch (error) {
        console.error("🚨 getChatResponseStream 내부 오류:", error);
        controller.error(error);
      } finally {
        controller.close();
      }
    },
  });

  return stream;
}
