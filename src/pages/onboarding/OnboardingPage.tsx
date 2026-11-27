import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Compass,
  ShieldCheck,
  Sparkles,
  Sun,
} from 'lucide-react';
import { Companion3DStage } from '../../components/characters/Companion3DStage';
import { CompanionDialogueBox } from '../../components/characters/CompanionDialogueBox';
import { ADVENTURE_ZONES } from '../../data/quests';
import { usePhygitalStore } from '../../store/usePhygitalStore';
import type { AgeGroup } from '../../types/phygital';
import { childProfileInputSchema, parentRegisterSchema } from '../../utils/schemas';

const AGE_GROUPS: { id: AgeGroup; title: string; ages: string; desc: string }[] = [
  {
    id: '6-8',
    title: 'Junior Explorers',
    ages: 'Ages 6–8',
    desc: 'Playful sensory hunts, short English stories, and friendly 2-step discoveries.',
  },
  {
    id: '9-11',
    title: 'Curious Discoverers',
    ages: 'Ages 9–11',
    desc: 'Hands-on household science, map-making, family interviews, and creative writing.',
  },
  {
    id: '12-14',
    title: 'Young Trailblazers',
    ages: 'Ages 12–14',
    desc: 'Independent experiments, deeper critical thinking, literature, and mentorship challenges.',
  },
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const registerParent = usePhygitalStore((s) => s.registerParent);
  const createChildProfile = usePhygitalStore((s) => s.createChildProfile);
  const updateParentalControls = usePhygitalStore((s) => s.updateParentalControls);
  const completeOnboarding = usePhygitalStore((s) => s.completeOnboarding);
  const prefer2D = usePhygitalStore((s) => s.prefer2DCompanions);

  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Step 2: Parent Account
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('1234');

  // Step 3 & 4: Child Nickname & Age Group
  const [nickname, setNickname] = useState('');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('9-11');
  const [createdChildId, setCreatedChildId] = useState<string | null>(null);

  // Step 6: Parental Permissions
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [consentChecked, setConsentChecked] = useState(true);

  const handleNext = async () => {
    setError(null);
    if (step === 2) {
      const parsed = parentRegisterSchema.safeParse({ displayName, email, password, pin });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? 'Please check your parent account details.');
        return;
      }
      try {
        await registerParent(parsed.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Registration failed.');
        return;
      }
    }

    if (step === 3) {
      const parsed = childProfileInputSchema.safeParse({ nickname, ageGroup });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? 'Please enter a valid explorer nickname.');
        return;
      }
    }

    if (step === 4 && !createdChildId) {
      const child = await createChildProfile({ nickname, ageGroup });
      setCreatedChildId(child.id);
    }

    if (step === 6) {
      if (!consentChecked) {
        setError(
          'Please confirm parental consent for PHYGITAL’s privacy-first 48-hour media handling.'
        );
        return;
      }
      if (createdChildId) {
        updateParentalControls(createdChildId, {
          cameraEnabled,
          microphoneEnabled,
          aiEnabled,
          consentAcceptedAt: new Date().toISOString(),
        });
      }
    }

    if (step === 8) {
      completeOnboarding();
      navigate('/');
      return;
    }

    setStep((s) => Math.min(8, s + 1));
  };

  const handleQuickDemoSetup = async () => {
    setError(null);
    await registerParent({
      displayName: 'Alex Morgan',
      email: 'parent@phygital.local',
      password: 'adventure-password',
      pin: '1234',
    });
    const child = await createChildProfile({ nickname: 'Sam', ageGroup: '9-11' });
    updateParentalControls(child.id, {
      cameraEnabled: true,
      microphoneEnabled: true,
      aiEnabled: true,
      consentAcceptedAt: new Date().toISOString(),
    });
    completeOnboarding();
    navigate('/');
  };

  return (
    <div className="min-h-screen storybook-paper flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl space-y-6">
        {/* Progress Pill */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-terracotta text-white font-extrabold text-sm">
              {step}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-cocoa">
              Step {step} of 8 · Explorer Setup
            </span>
          </div>
          <div className="flex gap-1.5" aria-label="Onboarding progress">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <span
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i === step ? 'w-7 bg-terracotta' : i < step ? 'w-3 bg-sage' : 'w-3 bg-sandcard'
                }`}
              />
            ))}
          </div>
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="storybook-card p-6 sm:p-8 space-y-6"
        >
          {step === 1 && (
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sunbeam/30 px-3 py-1 text-xs font-bold text-espresso">
                  <Sparkles className="h-3.5 w-3.5 text-terracotta" />
                  English-Only · Ages 6–14 · Privacy-First
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-espresso">
                  Welcome to a World of Real Adventures!
                </h1>
                <p className="text-cocoa max-w-xl mx-auto">
                  Meet Leo and Maya—two curious companions who turn your home, neighborhood, and
                  family stories into hands-on learning adventures away from passive screens.
                </p>
              </div>
              <Companion3DStage
                animation="happy"
                sunBatteryLevel={65}
                prefer2D={prefer2D}
                compact
              />
              <CompanionDialogueBox
                turns={[
                  {
                    character: 'leo',
                    emotion: 'curious',
                    text: 'Hi explorer! Ready to discover science in everyday objects and teach us what you find?',
                  },
                  {
                    character: 'maya',
                    emotion: 'happy',
                    text: 'Your next adventure starts in the real world! Let’s set up your explorer passport!',
                  },
                ]}
              />
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleQuickDemoSetup}
                  className="text-xs font-bold text-terracotta underline underline-offset-4 hover:text-espresso"
                >
                  Quick Start Demo Profile (Parent PIN: 1234)
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-extrabold text-espresso">Parent Co-Pilot Registration</h2>
              <p className="text-sm text-cocoa">
                Parents oversee permissions, assign real-world habits, and monitor our 48-Hour
                Privacy Shield. Children never access parent settings.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block space-y-1">
                  <span className="text-xs font-bold text-espresso">Parent Name</span>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Jordan Taylor"
                    className="w-full rounded-xl border border-espresso/15 bg-white px-3.5 py-2.5 text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-terracotta"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-bold text-espresso">Parent Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="parent@example.com"
                    className="w-full rounded-xl border border-espresso/15 bg-white px-3.5 py-2.5 text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-terracotta"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-bold text-espresso">Account Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full rounded-xl border border-espresso/15 bg-white px-3.5 py-2.5 text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-terracotta"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-bold text-espresso">4-Digit Parent Dashboard PIN</span>
                  <input
                    type="text"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="1234"
                    className="w-full rounded-xl border border-espresso/15 bg-white px-3.5 py-2.5 text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-terracotta"
                  />
                </label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-extrabold text-espresso">Create Explorer Profile</h2>
              <p className="text-sm text-cocoa">
                For privacy, please enter a playful nickname rather than your child’s full legal name.
              </p>
              <label className="block space-y-1.5 max-w-md">
                <span className="text-xs font-bold text-espresso">Explorer Nickname</span>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g. Captain Sam or Starlight"
                  className="w-full rounded-xl border border-espresso/15 bg-white px-4 py-3 text-base font-semibold text-espresso focus:outline-none focus:ring-2 focus:ring-terracotta"
                />
              </label>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-extrabold text-espresso">Select Age Adventure Band</h2>
              <p className="text-sm text-cocoa">
                PHYGITAL adapts vocabulary, quest complexity, stories, and Leo &amp; Maya’s guidance
                to match your explorer’s stage.
              </p>
              <div className="grid sm:grid-cols-3 gap-3">
                {AGE_GROUPS.map((band) => {
                  const selected = ageGroup === band.id;
                  return (
                    <button
                      key={band.id}
                      type="button"
                      onClick={() => setAgeGroup(band.id)}
                      className={`text-left rounded-2xl border p-4 transition ${
                        selected
                          ? 'bg-white border-terracotta ring-2 ring-terracotta/40 shadow-sm'
                          : 'bg-white/60 border-espresso/10 hover:bg-white'
                      }`}
                    >
                      <span className="inline-block rounded-full bg-sunbeam/35 px-2.5 py-0.5 text-xs font-bold text-espresso">
                        {band.ages}
                      </span>
                      <h3 className="mt-2 font-extrabold text-espresso">{band.title}</h3>
                      <p className="mt-1 text-xs text-cocoa leading-relaxed">{band.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Compass className="h-6 w-6 text-terracotta" />
                <h2 className="text-2xl font-extrabold text-espresso">
                  Meet the Five Adventure Zones
                </h2>
              </div>
              <p className="text-sm text-cocoa">
                No boring school labels—every real-world subject becomes a living storybook world!
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {ADVENTURE_ZONES.map((zone) => (
                  <div
                    key={zone.id}
                    className={`rounded-2xl border p-3.5 bg-white/90 ${zone.accentBorder}`}
                  >
                    <h3 className="font-extrabold text-espresso text-sm">{zone.name}</h3>
                    <p className="text-xs font-semibold text-terracotta mt-0.5">
                      {zone.learningFocus}
                    </p>
                    <p className="text-xs text-cocoa mt-1">{zone.tagline}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-terracotta" />
                <h2 className="text-2xl font-extrabold text-espresso">
                  Parental Permissions &amp; 48-Hour Privacy Shield
                </h2>
              </div>
              <p className="text-sm text-cocoa">
                Choose which interactive tools {nickname || 'your child'} may use. Any temporary
                camera photo or voice recording is locked away from permanent logs and automatically
                deleted after 48 hours.
              </p>
              <div className="space-y-2.5">
                {[
                  {
                    label: 'Camera Scanner & AR Habit Mirror',
                    checked: cameraEnabled,
                    onChange: setCameraEnabled,
                  },
                  {
                    label: 'Microphone for Reverse Tutoring, Voice Capsules & Sound Scavenger',
                    checked: microphoneEnabled,
                    onChange: setMicrophoneEnabled,
                  },
                  {
                    label: 'English-Only AI Companion Dialogue & Quest Generation',
                    checked: aiEnabled,
                    onChange: setAiEnabled,
                  },
                ].map((item) => (
                  <label
                    key={item.label}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3.5 border border-espresso/10 cursor-pointer"
                  >
                    <span className="text-sm font-semibold text-espresso">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) => item.onChange(e.target.checked)}
                      className="h-5 w-5 accent-terracotta"
                    />
                  </label>
                ))}
              </div>
              <label className="flex items-start gap-2.5 rounded-2xl bg-sage/20 border border-sage/40 p-3.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-0.5 h-5 w-5 accent-terracotta"
                />
                <span className="text-xs text-espresso leading-relaxed">
                  I am the parent or guardian and consent to privacy-first English-only learning
                  features, with temporary media automatically deleted after 48 hours.
                </span>
              </label>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sun className="h-6 w-6 text-[#B47D18]" />
                <h2 className="text-2xl font-extrabold text-espresso">
                  The Offline Sun-Battery
                </h2>
              </div>
              <p className="text-sm text-cocoa leading-relaxed">
                PHYGITAL rewards putting the screen down! When {nickname || 'your child'} picks an
                Offline Mission—like drawing a map, reading a paper book, or helping at home—and
                returns after 15, 20, or 30 minutes, Leo and Maya’s Sun-Battery charges up with
                bright golden energy.
              </p>
              <div className="rounded-2xl bg-sunbeam/25 border border-sunbeam/60 p-4 flex items-center gap-4">
                <Sun className="h-10 w-10 text-[#B47D18] shrink-0" />
                <div>
                  <p className="font-extrabold text-espresso">
                    Less screen staring. More real-world wonder.
                  </p>
                  <p className="text-xs text-cocoa mt-0.5">
                    No manipulative streaks, no punishments for missed days, and no tracking of
                    background device lock states.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 8 && (
            <div className="space-y-4 text-center py-4">
              <CheckCircle2 className="h-14 w-14 text-[#6F8263] mx-auto" />
              <h2 className="text-2xl sm:text-3xl font-extrabold text-espresso">
                Passport Ready for {nickname || 'Explorer'}!
              </h2>
              <p className="text-sm text-cocoa max-w-md mx-auto">
                Leo and Maya are waiting on the adventure meadow. Remember: Parent Dashboard stays
                protected behind your 4-digit PIN.
              </p>
            </div>
          )}

          {error && (
            <div
              className="rounded-xl border border-terracotta/40 bg-terracotta/10 px-4 py-2.5 text-sm font-semibold text-terracotta"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="tactile-btn px-4 py-2.5 text-sm text-cocoa bg-white border border-espresso/15 hover:bg-sandcard"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="tactile-btn px-6 py-2.5 text-sm text-white bg-terracotta shadow-tactile-terracotta hover:bg-[#b56d4e]"
            >
              {step === 8 ? 'Enter Adventure Home' : 'Continue'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
