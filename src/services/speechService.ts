// Strict English-only Speech Recognition and Speech Synthesis helpers.

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  readonly results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike {
  readonly error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isEnglishSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && getSpeechRecognitionCtor() !== null;
}

export function startEnglishSpeechRecognition(callbacks: {
  onTranscript: (text: string, isFinal: boolean) => void;
  onError: (message: string) => void;
  onEnd: () => void;
}): () => void {
  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) {
    callbacks.onError(
      'Live English speech recognition is not supported in this browser. You can type your answer instead!'
    );
    callbacks.onEnd();
    return () => {};
  }

  const recognition = new Ctor();
  // Strictly English-only speech recognition
  recognition.lang = 'en-US';
  recognition.interimResults = true;
  recognition.continuous = false;

  recognition.onresult = (event) => {
    let combined = '';
    let hasFinal = false;
    for (let i = 0; i < event.results.length; i++) {
      combined += event.results[i][0].transcript + ' ';
      if (event.results[i].isFinal) hasFinal = true;
    }
    callbacks.onTranscript(combined.trim(), hasFinal);
  };

  recognition.onerror = (event) => {
    if (event.error === 'not-allowed') {
      callbacks.onError(
        'Microphone permission was denied. Please allow microphone access or use the text box.'
      );
    } else if (event.error !== 'no-speech') {
      callbacks.onError(`Speech recognition paused (${event.error}). You can try again or type.`);
    }
  };

  recognition.onend = () => {
    callbacks.onEnd();
  };

  recognition.start();

  return () => {
    try {
      recognition.stop();
    } catch {
      // Ignore if already stopped
    }
  };
}

export function speakInEnglish(text: string, character: 'leo' | 'maya' = 'maya'): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find((v) => v.lang.toLowerCase().startsWith('en'));
    if (englishVoice) utterance.voice = englishVoice;
    utterance.pitch = character === 'maya' ? 1.12 : 1.0;
    utterance.rate = 0.98;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Graceful no-op if browser blocks TTS autoplay
  }
}

export function stopSpeaking(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Ignore
  }
}
