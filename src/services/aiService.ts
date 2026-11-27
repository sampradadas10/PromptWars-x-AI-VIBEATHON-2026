import type {
  AgeGroup,
  CompanionDialogueResponse,
  DialogueTrigger,
  ObjectScanResult,
  ReverseTutoringEvaluation,
  ReverseTutoringTopic,
} from '../types/phygital';
import { companionDialogueSchema, objectScanResultSchema } from '../utils/schemas';
import { assertEnglishOnlyText } from '../utils/englishGuard';
import { getAuthoritativeQuestXp } from '../utils/rewards';
import { isSupabaseConfigured, supabase } from './supabaseClient';

export interface AiServiceEnvelope<T> {
  data: T;
  source: 'gemini-cloud' | 'dev-sandbox';
}

function enforceEnglishResponse<T>(payload: T): T {
  const serialized = JSON.stringify(payload);
  if (!assertEnglishOnlyText(serialized)) {
    throw new Error(
      'Language compliance check failed: non-English characters were blocked.'
    );
  }
  return payload;
}

export async function requestCompanionDialogue(params: {
  trigger: DialogueTrigger;
  ageGroup: AgeGroup;
  childInput: string;
  context: string;
}): Promise<AiServiceEnvelope<CompanionDialogueResponse>> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.functions.invoke('companion-dialogue', {
      body: params,
    });
    if (error) {
      throw new Error(
        'Leo and Maya could not reach the cloud story engine right now. Please try again!'
      );
    }
    const parsed = companionDialogueSchema.parse(data);
    return { data: enforceEnglishResponse(parsed), source: 'gemini-cloud' };
  }

  // Transparent Development Sandbox Mode fallback (strictly English-only & age-adapted)
  const xpMap: Record<DialogueTrigger, number> = {
    reverse_tutoring: getAuthoritativeQuestXp('speaking'),
    object_scan: getAuthoritativeQuestXp('discovery'),
    voice_capsule: getAuthoritativeQuestXp('family'),
    sound_scavenger: getAuthoritativeQuestXp('discovery'),
    offline_battery_return: getAuthoritativeQuestXp('offline'),
    habit_completed: getAuthoritativeQuestXp('habit'),
    general_greeting: 0,
  };

  const snippet = params.childInput.trim().slice(0, 100);
  const ageFlavor =
    params.ageGroup === '6-8'
      ? 'You noticed something super cool!'
      : params.ageGroup === '9-11'
        ? 'That observation shows real explorer thinking!'
        : 'Your reasoning connects cause and effect clearly!';

  const response: CompanionDialogueResponse = {
    active_speaker: 'both',
    dialogue_turns: [
      {
        character: 'leo',
        emotion: 'amazed',
        text: snippet
          ? `Fascinating! Let me write down what you shared: "${snippet}". ${ageFlavor}`
          : `Wait! Let me check my notes—${params.context} is full of clues!`,
      },
      {
        character: 'maya',
        emotion: 'happy',
        text:
          params.trigger === 'offline_battery_return'
            ? 'You spent real-world time away from the screen! Our Sun-Battery is glowing brighter!'
            : 'Every little discovery in the real world makes our adventure map richer!',
      },
    ],
    quest_completed: params.trigger !== 'general_greeting',
    xp_awarded: xpMap[params.trigger],
    next_action: 'explore_next_zone',
    animation: 'celebration',
  };

  return {
    data: enforceEnglishResponse(companionDialogueSchema.parse(response)),
    source: 'dev-sandbox',
  };
}

export async function analyzeScannedObject(params: {
  imageBase64?: string;
  mimeType?: string;
  ageGroup: AgeGroup;
  simulatedObjects?: string[];
  simulatedMessyDesk?: boolean;
}): Promise<AiServiceEnvelope<ObjectScanResult>> {
  if (isSupabaseConfigured && supabase && params.imageBase64) {
    const { data, error } = await supabase.functions.invoke('analyze-object', {
      body: {
        imageBase64: params.imageBase64,
        mimeType: params.mimeType ?? 'image/jpeg',
        ageGroup: params.ageGroup,
      },
    });
    if (error) {
      throw new Error(
        'Object analysis could not connect to Gemini right now. Please retake or try again!'
      );
    }
    const parsed = objectScanResultSchema.parse(data);
    return { data: enforceEnglishResponse(parsed), source: 'gemini-cloud' };
  }

  // Development Sandbox Mode deterministic multimodal simulation
  if (params.simulatedMessyDesk) {
    const messyResult: ObjectScanResult = {
      detectedObjects: params.simulatedObjects ?? [
        'scattered notebooks',
        'loose pencils',
        'crumpled paper',
      ],
      isMessyDesk: true,
      safetyCleared: true,
      questTitle: 'Clutter Monster Boss Battle!',
      questPrompt:
        'A cheeky Clutter Monster has camped on your desk! Put books in a stack, collect pencils in a cup, and snap an After photo to banish it.',
      experimentSteps: [
        'Start the cleanup timer and clear away stray papers.',
        'Group notebooks neatly and return pens to a holder.',
        'Take an After photo to compare your tidy workspace!',
      ],
      requiresAdultAssistance: false,
      dialogue: {
        active_speaker: 'both',
        dialogue_turns: [
          {
            character: 'leo',
            emotion: 'surprised',
            text: 'Whoa! My magnifying glass spotted a Clutter Monster hiding under those loose papers!',
          },
          {
            character: 'maya',
            emotion: 'encouraging',
            text: 'You’ve got this! Clear the desk in the real world and snap an After photo when you win!',
          },
        ],
        quest_completed: false,
        xp_awarded: 0,
        next_action: 'capture_after_cleanup',
        animation: 'surprised',
      },
    };
    return {
      data: enforceEnglishResponse(objectScanResultSchema.parse(messyResult)),
      source: 'dev-sandbox',
    };
  }

  const objects = params.simulatedObjects ?? ['salt', 'glass of water', 'metal spoon'];
  const isLeaf = objects.some((o) => o.toLowerCase().includes('leaf'));

  const result: ObjectScanResult = isLeaf
    ? {
        detectedObjects: objects,
        isMessyDesk: false,
        safetyCleared: true,
        questTitle: 'Leaf Vein & Sunlight Explorer',
        questPrompt:
          params.ageGroup === '6-8'
            ? 'Look closely at the lines on your leaf! Count the main lines and trace one shape on paper.'
            : 'Examine how the central rib and tiny veins carry water through the leaf. Hold it gently near a window to observe its translucency!',
        experimentSteps: [
          'Place the leaf flat on a bright table.',
          'Trace its outer margin and count the main side veins.',
          'Tell Leo and Maya why leaves are usually wide and flat.',
        ],
        requiresAdultAssistance: false,
        dialogue: {
          active_speaker: 'both',
          dialogue_turns: [
            {
              character: 'maya',
              emotion: 'amazed',
              text: 'Ooh! A real botanical specimen! Look at those delicate veins!',
            },
            {
              character: 'leo',
              emotion: 'curious',
              text: 'Fascinating! How do you think water travels from the stem to the tip of the leaf?',
            },
          ],
          quest_completed: false,
          xp_awarded: 0,
          next_action: 'observe_and_complete',
          animation: 'quest',
        },
      }
    : {
        detectedObjects: objects,
        isMessyDesk: false,
        safetyCleared: true,
        questTitle: 'The Salt & Water Solution Lab',
        questPrompt:
          'Add a pinch of table salt to a clear glass of water with adult supervision. Stir gently with a spoon and observe what happens!',
        experimentSteps: [
          'Ask an adult to double-check your plain drinking water and table salt.',
          'Stir gently for 15 seconds and watch the crystals.',
          'Explain why the salt seems to disappear even though the water tastes salty (do not drink the experiment—just observe!).',
        ],
        requiresAdultAssistance: true,
        dialogue: {
          active_speaker: 'both',
          dialogue_turns: [
            {
              character: 'leo',
              emotion: 'amazed',
              text: 'Whoa! You have discovered some awesome laboratory materials!',
            },
            {
              character: 'maya',
              emotion: 'curious',
              text: "Let's investigate what happens when salt meets water—with an adult nearby!",
            },
          ],
          quest_completed: false,
          xp_awarded: 0,
          next_action: 'run_safe_experiment',
          animation: 'quest',
        },
      };

  return {
    data: enforceEnglishResponse(objectScanResultSchema.parse(result)),
    source: 'dev-sandbox',
  };
}

export async function evaluateReverseTutoring(params: {
  topic: ReverseTutoringTopic;
  explanation: string;
  ageGroup: AgeGroup;
}): Promise<AiServiceEnvelope<ReverseTutoringEvaluation>> {
  const text = params.explanation.trim();
  const lower = text.toLowerCase();

  if (isSupabaseConfigured && supabase) {
    const dialogueRes = await requestCompanionDialogue({
      trigger: 'reverse_tutoring',
      ageGroup: params.ageGroup,
      childInput: text,
      context: `Reverse tutoring topic: ${params.topic.title}. Evaluate conceptual understanding, accuracy, clarity, and examples without penalizing grammar or accent.`,
    });
    const matched = params.topic.keyConcepts.filter((kw) => lower.includes(kw));
    return {
      data: enforceEnglishResponse({
        conceptualUnderstanding: Math.min(5, 2 + matched.length),
        accuracy: Math.min(5, 3 + Math.floor(matched.length / 2)),
        clarity: text.length > 45 ? 5 : 4,
        usedExamples: lower.includes('like') || lower.includes('example') || lower.includes('such as'),
        strengths: 'You explained the idea in your own natural English words!',
        followUpQuestion: params.topic.mayaFollowUp,
        dialogue: dialogueRes.data,
      }),
      source: dialogueRes.source,
    };
  }

  // Friendly, non-punitive evaluation (never penalizes grammar, accent, or imperfect transcription)
  const matchedConcepts = params.topic.keyConcepts.filter((kw) => lower.includes(kw));
  const usedExamples =
    lower.includes('like') ||
    lower.includes('example') ||
    lower.includes('when') ||
    lower.includes('for instance');

  const conceptualUnderstanding = Math.min(5, Math.max(3, 2 + matchedConcepts.length));
  const accuracy = Math.min(5, Math.max(3, 2 + Math.ceil(matchedConcepts.length * 0.8)));
  const clarity = text.split(/\s+/).length >= 10 ? 5 : 4;

  const strengths =
    matchedConcepts.length >= 2
      ? `You clearly connected key ideas (${matchedConcepts.slice(0, 3).join(', ')}) so Leo and Maya could picture it!`
      : 'Great effort putting a big science idea into your own everyday words!';

  const evalResult: ReverseTutoringEvaluation = {
    conceptualUnderstanding,
    accuracy,
    clarity,
    usedExamples,
    strengths,
    followUpQuestion: params.topic.mayaFollowUp,
    dialogue: {
      active_speaker: 'both',
      dialogue_turns: [
        {
          character: 'maya',
          emotion: 'amazed',
          text: `Wait! Are you saying that ${text.slice(0, 80)}${text.length > 80 ? '...' : ''}? That makes so much sense!`,
        },
        {
          character: 'leo',
          emotion: 'curious',
          text: `Fascinating! You are a wonderful teacher! ${params.topic.mayaFollowUp}`,
        },
      ],
      quest_completed: true,
      xp_awarded: getAuthoritativeQuestXp('speaking'),
      next_action: 'answer_followup_or_next_topic',
      animation: 'celebration',
    },
  };

  return {
    data: enforceEnglishResponse(evalResult),
    source: 'dev-sandbox',
  };
}

export async function summarizeVoiceCapsule(params: {
  promptTitle: string;
  familyMemberRole: string;
  rawTranscript: string;
  audioBase64?: string;
}): Promise<
  AiServiceEnvelope<{
    transcript: string;
    storySummary: string;
    memoryCardDescription: string;
    followUpQuestion: string;
  }>
> {
  if (isSupabaseConfigured && supabase && params.audioBase64) {
    const { data, error } = await supabase.functions.invoke('transcribe-audio', {
      body: {
        audioBase64: params.audioBase64,
        promptContext: `${params.promptTitle} (${params.familyMemberRole})`,
      },
    });
    if (error || !data) {
      throw new Error('Could not transcribe the family story right now. Please try again.');
    }
    return { data: enforceEnglishResponse(data), source: 'gemini-cloud' };
  }

  const clean = params.rawTranscript.trim();
  const summary =
    clean.length > 0
      ? `A treasured English family memory shared by ${params.familyMemberRole}: "${clean}"`
      : `A warm family storytelling session with ${params.familyMemberRole} about ${params.promptTitle}.`;

  return {
    data: enforceEnglishResponse({
      transcript: clean || `(Voice recording saved in temporary 48-hour vault for ${params.promptTitle}.)`,
      storySummary: summary,
      memoryCardDescription: `Illustrated Memory Card: ${params.familyMemberRole} shared wisdom and laughter during "${params.promptTitle}".`,
      followUpQuestion: `Ask ${params.familyMemberRole}: What advice would you give to your younger self back then?`,
    }),
    source: 'dev-sandbox',
  };
}
