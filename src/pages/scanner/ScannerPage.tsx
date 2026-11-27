import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { CompanionDialogueBox } from '../../components/characters/CompanionDialogueBox';
import { StorybookCard } from '../../components/common/StorybookUI';
import { SAMPLE_SCAN_PRESETS } from '../../data/signatureContent';
import { analyzeScannedObject } from '../../services/aiService';
import { usePhygitalStore } from '../../store/usePhygitalStore';
import type { EphemeralMediaRecord, ObjectScanResult } from '../../types/phygital';

export function ScannerPage() {
  const children = usePhygitalStore((s) => s.children);
  const activeChildId = usePhygitalStore((s) => s.activeChildId);
  const controlsByChild = usePhygitalStore((s) => s.parentalControlsByChild);
  const storeTemporaryMedia = usePhygitalStore((s) => s.storeTemporaryMedia);
  const completeQuest = usePhygitalStore((s) => s.completeQuest);
  const setCompanionState = usePhygitalStore((s) => s.setCompanionState);

  const activeChild = children.find((c) => c.id === activeChildId) ?? children[0];
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [tempMedia, setTempMedia] = useState<EphemeralMediaRecord | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ObjectScanResult | null>(null);
  const [afterCleanupCaptured, setAfterCleanupCaptured] = useState(false);
  const [questCompletedXp, setQuestCompletedXp] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  if (!activeChild) return null;
  const cameraAllowed = controlsByChild[activeChild.id]?.cameraEnabled !== false;

  const startCamera = async () => {
    setCameraError(null);
    if (!cameraAllowed) {
      setCameraError('Camera access is paused by your parent in Parent Dashboard.');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        'Live camera preview is unavailable in this browser. Upload a photo or try an Explorer Sample below!'
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      setCameraError(
        'Camera permission was denied or no camera was detected. You can upload an image or test with an Explorer Sample below.'
      );
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  };

  const captureFromVideo = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    stopCamera();
    await handleProcessImage(dataUrl);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (dataUrl) {
        await handleProcessImage(dataUrl, file.name.toLowerCase().includes('desk'));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleProcessImage = async (
    dataUrl: string,
    hintMessy = false,
    presetObjects?: string[]
  ) => {
    setCapturedDataUrl(dataUrl);
    setAnalyzing(true);
    setScanError(null);
    setScanResult(null);
    setQuestCompletedXp(null);
    setAfterCleanupCaptured(false);

    try {
      const media = storeTemporaryMedia({
        childId: activeChild.id,
        mediaType: hintMessy ? 'before_after' : 'image',
        extension: 'jpg',
        previewDataUrl: dataUrl,
      });
      setTempMedia(media);

      const base64 = dataUrl.split(',')[1];
      const res = await analyzeScannedObject({
        imageBase64: base64,
        ageGroup: activeChild.ageGroup,
        simulatedObjects: presetObjects,
        simulatedMessyDesk: hintMessy,
      });
      setScanResult(res.data);
      setCompanionState(res.data.dialogue.animation, res.data.dialogue.dialogue_turns);
    } catch (err) {
      setScanError(
        err instanceof Error
          ? err.message
          : 'Could not analyze that snapshot. Please retake in bright light!'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSamplePreset = async (preset: (typeof SAMPLE_SCAN_PRESETS)[number]) => {
    // Generate a crisp inline SVG data URL representing the scanned sample
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300"><rect width="480" height="300" fill="#F2ECE4"/><text x="24" y="130" font-family="sans-serif" font-size="22" font-weight="bold" fill="#4A3525">${preset.label}</text><text x="24" y="168" font-family="sans-serif" font-size="14" fill="#7A583E">Detected: ${preset.detectedObjects.join(', ')}</text></svg>`;
    const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
    await handleProcessImage(dataUrl, preset.isMessyDesk, preset.detectedObjects);
  };

  const handleCompleteScannedQuest = async () => {
    if (!scanResult) return;
    const reward = await completeQuest({
      questZone: scanResult.isMessyDesk ? 'daily-hero-training' : 'potion-gadget-lab',
      questTitle: scanResult.questTitle,
      questType: scanResult.isMessyDesk ? 'habit' : 'discovery',
      aiEvaluationSummary: `Discovered ${scanResult.detectedObjects.join(', ')} and completed "${scanResult.questTitle}".`,
    });
    setQuestCompletedXp(reward.xpAwarded);
    setCompanionState('celebration');
  };

  const handleRetake = () => {
    setCapturedDataUrl(null);
    setScanResult(null);
    setScanError(null);
    setQuestCompletedXp(null);
    setAfterCleanupCaptured(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sunbeam/30 px-3 py-1 text-xs font-bold text-espresso">
            <Camera className="h-3.5 w-3.5 text-terracotta" />
            Signature Feature 2 · Object-to-Quest Scanner
          </span>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-espresso">
            Quest Scanner
          </h1>
          <p className="text-sm text-cocoa">
            Point your camera at everyday objects—a leaf, spoon, salt, or a messy desk—to unlock a
            real-world adventure!
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl bg-sage/20 border border-sage/40 px-3.5 py-2 text-xs font-semibold text-espresso">
          <ShieldCheck className="h-4 w-4 text-[#556B47]" />
          Snapshots auto-delete in 48 hours
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-5">
        {/* Camera & Capture Pane */}
        <StorybookCard className="lg:col-span-6 bg-white space-y-4">
          <div className="relative overflow-hidden rounded-2xl border border-espresso/15 bg-sandcard/60 aspect-video flex items-center justify-center">
            {cameraActive ? (
              <video
                ref={videoRef}
                playsInline
                muted
                className="h-full w-full object-cover"
                aria-label="Live camera preview"
              />
            ) : capturedDataUrl ? (
              <img
                src={capturedDataUrl}
                alt="Captured quest object"
                className="h-full w-full object-contain bg-parchment"
              />
            ) : (
              <div className="text-center p-6 space-y-3">
                <Camera className="h-12 w-12 text-terracotta mx-auto" />
                <p className="text-sm font-bold text-espresso">
                  Ready to scan an everyday object!
                </p>
                <p className="text-xs text-cocoa max-w-xs mx-auto">
                  Start your live camera, upload an image, or try an instant sample below.
                </p>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {cameraError && (
            <div className="rounded-xl bg-sunbeam/25 border border-sunbeam px-3.5 py-2.5 text-xs font-semibold text-espresso">
              {cameraError}
            </div>
          )}

          <div className="flex flex-wrap gap-2.5">
            {!cameraActive ? (
              <button
                type="button"
                onClick={startCamera}
                className="tactile-btn flex-1 bg-terracotta text-white px-4 py-2.5 text-sm shadow-tactile-terracotta"
              >
                <Camera className="h-4 w-4" />
                Start Live Camera
              </button>
            ) : (
              <button
                type="button"
                onClick={captureFromVideo}
                className="tactile-btn flex-1 bg-terracotta text-white px-4 py-2.5 text-sm shadow-tactile-terracotta"
              >
                <Sparkles className="h-4 w-4" />
                Snap &amp; Analyze Object
              </button>
            )}

            <label className="tactile-btn cursor-pointer bg-white border border-espresso/15 text-espresso px-4 py-2.5 text-sm hover:bg-sandcard">
              <Upload className="h-4 w-4" />
              Upload Photo
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {capturedDataUrl && (
              <button
                type="button"
                onClick={handleRetake}
                className="tactile-btn bg-sandcard text-espresso px-3.5 py-2.5 text-sm"
              >
                <RefreshCw className="h-4 w-4" />
                Retake
              </button>
            )}
          </div>

          {/* Explorer Sample Presets */}
          <div className="pt-3 border-t border-espresso/10 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-cocoa">
              Quick Sample Scans (Great if no camera is connected)
            </p>
            <div className="grid sm:grid-cols-3 gap-2">
              {SAMPLE_SCAN_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSamplePreset(preset)}
                  className="text-left rounded-xl border border-espresso/10 bg-parchment p-2.5 hover:border-terracotta transition"
                >
                  <p className="text-xs font-extrabold text-espresso">{preset.label}</p>
                  <p className="text-[11px] text-cocoa mt-0.5">{preset.description}</p>
                </button>
              ))}
            </div>
          </div>

          {tempMedia && (
            <div className="flex items-center justify-between rounded-xl bg-parchment px-3 py-2 text-xs text-cocoa border border-espresso/10">
              <span>
                Stored in 48-Hour Vault · Expires{' '}
                {new Date(tempMedia.expiresAt).toLocaleString()}
              </span>
              <button
                type="button"
                onClick={handleRetake}
                className="inline-flex items-center gap-1 font-bold text-terracotta hover:underline"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear Preview
              </button>
            </div>
          )}
        </StorybookCard>

        {/* AI Quest Generation Pane */}
        <StorybookCard className="lg:col-span-6 bg-white space-y-4">
          <h2 className="text-lg font-extrabold text-espresso">Generated Discovery Quest</h2>

          {analyzing && (
            <div className="py-12 text-center space-y-2">
              <Sparkles className="h-9 w-9 text-terracotta animate-spin mx-auto" />
              <p className="text-sm font-bold text-espresso">
                Leo is inspecting your snapshot with his magnifying glass...
              </p>
            </div>
          )}

          {scanError && (
            <div className="rounded-xl border border-terracotta/40 bg-terracotta/10 p-4 text-sm font-semibold text-terracotta">
              {scanError}
            </div>
          )}

          {scanResult && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {scanResult.detectedObjects.map((obj) => (
                  <span
                    key={obj}
                    className="rounded-full bg-sage/25 px-3 py-1 text-xs font-bold text-espresso"
                  >
                    Detected: {obj}
                  </span>
                ))}
              </div>

              <div className="rounded-2xl bg-parchment border border-espresso/10 p-4 space-y-2">
                <h3 className="text-xl font-extrabold text-espresso">{scanResult.questTitle}</h3>
                <p className="text-sm text-espresso leading-relaxed">{scanResult.questPrompt}</p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-cocoa pt-2">
                  {scanResult.experimentSteps.map((st) => (
                    <li key={st}>{st}</li>
                  ))}
                </ol>
              </div>

              {scanResult.requiresAdultAssistance && (
                <div className="rounded-xl bg-sunbeam/25 border border-sunbeam px-3.5 py-2.5 flex items-center gap-2 text-xs font-bold text-espresso">
                  <AlertTriangle className="h-4 w-4 text-[#B47D18]" />
                  Ask an adult to supervise this kitchen or household discovery!
                </div>
              )}

              <CompanionDialogueBox turns={scanResult.dialogue.dialogue_turns} />

              {scanResult.isMessyDesk && !afterCleanupCaptured && (
                <div className="rounded-2xl border border-terracotta/30 bg-terracotta/10 p-4 space-y-2">
                  <p className="text-sm font-extrabold text-espresso">
                    Clutter Monster Boss Battle!
                  </p>
                  <p className="text-xs text-cocoa">
                    Put away scattered items in the real world, then click below to capture or
                    confirm your tidy desk!
                  </p>
                  <button
                    type="button"
                    onClick={() => setAfterCleanupCaptured(true)}
                    className="tactile-btn bg-sage text-espresso px-4 py-2 text-xs shadow-tactile-sage"
                  >
                    Confirm After-Cleanup Check
                  </button>
                </div>
              )}

              {(!scanResult.isMessyDesk || afterCleanupCaptured) && (
                <button
                  type="button"
                  onClick={handleCompleteScannedQuest}
                  disabled={questCompletedXp !== null}
                  className="tactile-btn w-full bg-terracotta text-white py-3 text-sm shadow-tactile-terracotta"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {questCompletedXp !== null
                    ? `Quest Completed! +${questCompletedXp} XP Awarded`
                    : 'Complete Discovery & Claim XP'}
                </button>
              )}
            </div>
          )}

          {!analyzing && !scanResult && !scanError && (
            <div className="py-12 text-center space-y-2 text-cocoa">
              <Sparkles className="h-9 w-9 text-sunbeam mx-auto" />
              <p className="text-sm font-semibold">
                Capture or choose a sample object to generate a custom English quest!
              </p>
            </div>
          )}
        </StorybookCard>
      </div>
    </div>
  );
}
