import { ElevenLabsParam } from "../constants/elevenLabsParam";
import { TalkStyle } from "../messages/messages";
import axios from 'axios';
import { ElevenLabsClient } from "elevenlabs";


export async function synthesizeVoice(
  message: string,
  speaker_x: number,
  speaker_y: number,
  style: TalkStyle,
  elevenLabsKey: string,
  elevenLabsParam: ElevenLabsParam
) {

  // Set the API key for ElevenLabs API. 
  // Do not use directly. Use environment variables.
  const API_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
  console.log(API_KEY);
  // Set the ID of the voice to be used.
  const VOICE_ID = elevenLabsParam.voiceId;

  console.log('elevenlabs voice_id: ' + VOICE_ID);

  // Set options for the API request.
  const options = {
    method: 'POST',
    url: `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    headers: {
      accept: 'audio/mpeg', // Set the expected response type to audio/mpeg.
      'content-type': 'application/json', // Set the content type to application/json.
      'xi-api-key': `${API_KEY}`, // Set the API key in the headers.
    },
    data: {
      text: message, // Pass in the inputText as the text to be converted to speech.
    },
    responseType: 'arraybuffer', // Set the responseType to arraybuffer to receive binary data as response.
  };

  // Send the API request using Axios and wait for the response.
  // @ts-ignore
  const speechDetails = await axios.request(options);
  // Get the binary audio data received from the API response.
  const data =  speechDetails.data;
  // Create a new Blob object from the audio data with MIME type 'audio/mpeg'
  const blob = new Blob([data], { type: 'audio/mpeg' });
  // Create a URL for the blob object
  const url = URL.createObjectURL(blob);

  return {
    audio: url
  };
}

export async function getVoices(elevenLabsKey: string) {
  const client = new ElevenLabsClient({ apiKey: elevenLabsKey });
  const voices = await client.voices.getAll();
  console.log(voices);
  return voices;
  /*
  const response = await axios.get('https://api.elevenlabs.io/v1/voices');
  console.log(response.data);

  return response.data;
  */
}
