import { getGeminiInstance } from './geminiService';

export class VoiceService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private analyzer: AnalyserNode | null = null;

  async startRecording(onAudioLevel: (level: number) => void): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaStreamSource(stream);
    this.analyzer = this.audioContext.createAnalyser();
    source.connect(this.analyzer);
    this.analyzer.fftSize = 256;

    const dataArray = new Uint8Array(this.analyzer.frequencyBinCount);
    const updateLevel = () => {
      if (!this.analyzer) return;
      this.analyzer.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      onAudioLevel(sum / dataArray.length);
      requestAnimationFrame(updateLevel);
    };
    updateLevel();

    this.mediaRecorder = new MediaRecorder(stream);
    this.audioChunks = [];
    this.mediaRecorder.ondataavailable = (event) => this.audioChunks.push(event.data);
    this.mediaRecorder.start();
  }

  async stopRecording(): Promise<string> {
    return new Promise((resolve) => {
      this.mediaRecorder!.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const base64 = await this.blobToBase64(audioBlob);
        
        const text = await this.transcribeAudio(base64);
        resolve(text);
      };
      this.mediaRecorder!.stop();
      this.mediaRecorder!.stream.getTracks().forEach(track => track.stop());
      this.audioContext?.close();
    });
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(blob);
    });
  }

  private async transcribeAudio(base64: string): Promise<string> {
    try {
      const ai = getGeminiInstance();
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash',
        contents: [{
          role: 'user',
          parts: [{
            inlineData: {
              mimeType: 'audio/webm',
              data: base64
            }
          }, {
            text: "Transcribe this audio verbatim. Return ONLY the transcribed text."
          }]
        }]
      });
      return response.text() || "";
    } catch (error) {
      console.error("Transcription failed:", error);
      return "";
    }
  }
}