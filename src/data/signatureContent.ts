import type { ReverseTutoringTopic } from '../types/phygital';

export const REVERSE_TUTORING_TOPICS: ReverseTutoringTopic[] = [
  {
    id: 'rt-rain-clouds',
    title: 'Why Does Rain Fall From Clouds?',
    leoQuestion:
      'Why does rain fall from the clouds? I have been wondering about this all morning!',
    mayaFollowUp: 'Wait! Are you saying that water can travel up into the sky first?',
    keyConcepts: ['sun', 'evaporate', 'vapor', 'cool', 'condense', 'droplets', 'heavy', 'clouds'],
    ageGroup: '6-8',
  },
  {
    id: 'rt-plant-food',
    title: 'How Do Plants Make Their Own Food?',
    leoQuestion:
      'Plants cannot walk to the kitchen! How do green leaves make food out of thin air and sunlight?',
    mayaFollowUp: 'Amazing! What three ingredients does a plant need to make that energy?',
    keyConcepts: ['sunlight', 'water', 'air', 'carbon dioxide', 'leaves', 'green', 'chlorophyll', 'sugar', 'oxygen'],
    ageGroup: '9-11',
  },
  {
    id: 'rt-seasons-tilt',
    title: 'Why Do Seasons Change on Earth?',
    leoQuestion:
      'Wait—I thought winter happened because Earth got super far from the Sun, or is it something else?!',
    mayaFollowUp: 'Oh! Tell us how Earth’s tilt changes the sunlight hitting different places!',
    keyConcepts: ['tilt', 'axis', 'orbit', 'sunlight', 'angle', 'hemisphere', 'summer', 'winter'],
    ageGroup: '12-14',
  },
  {
    id: 'rt-echo-sound',
    title: 'How Do Sounds Travel to Our Ears?',
    leoQuestion:
      'When you clap your hands across a room, how does that sound actually reach my ears?',
    mayaFollowUp: 'Whoa! Can you give an example of something vibrating to make a sound?',
    keyConcepts: ['vibrate', 'vibration', 'waves', 'air', 'ears', 'travel', 'bounce', 'echo'],
    ageGroup: '6-8',
  },
  {
    id: 'rt-gravity-orbit',
    title: 'Why Doesn’t the Moon Fall Into Earth?',
    leoQuestion:
      'If gravity pulls everything down, why doesn’t the Moon just crash right into our backyard?',
    mayaFollowUp: 'Ooh! How do forward speed and gravity balance together?',
    keyConcepts: ['gravity', 'orbit', 'speed', 'moving', 'forward', 'circle', 'pull', 'balance'],
    ageGroup: '9-11',
  },
];

export const VOICE_CAPSULE_PROMPTS = [
  {
    id: 'vc-childhood-games',
    title: 'Childhood Games Before Smartphones',
    question: 'Ask your grandparent or parent: "What games did you play when you were my age?"',
    suggestedFollowUp: 'What made that game so much fun to play with friends?',
  },
  {
    id: 'vc-first-bicycle',
    title: 'The First Bicycle Adventure',
    question:
      'Ask a family member: "Can you tell me the story of your very first bicycle or favorite ride?"',
    suggestedFollowUp: 'Where was the farthest place you ever rode it?',
  },
  {
    id: 'vc-favorite-story',
    title: 'A Favorite Family Tradition',
    question:
      'Ask an elder: "What family meal, festival, or weekend tradition did you look forward to most growing up?"',
    suggestedFollowUp: 'What is one thing from that tradition you would love to pass down?',
  },
  {
    id: 'vc-school-days',
    title: 'School Days Time Machine',
    question:
      'Ask a parent or grandparent: "What was your favorite subject or funniest moment in school?"',
    suggestedFollowUp: 'How were classrooms different from today?',
  },
];

export const SOUND_SCAVENGER_MISSIONS = [
  {
    id: 'ss-running-water',
    title: 'Running Water Stream',
    instruction: 'Turn on a tap gently or listen near water and capture the steady rushing sound.',
    targetCharacter: 'steady',
    hint: 'Water creates a smooth, continuous shimmer across mid-to-high frequencies.',
  },
  {
    id: 'ss-ceiling-fan',
    title: 'Gentle Fan Breeze',
    instruction: 'Listen near a spinning fan or breeze and observe its soft, rhythmic hum.',
    targetCharacter: 'hum',
    hint: 'Fans produce a calm, low-frequency steady hum.',
  },
  {
    id: 'ss-bird-chirp',
    title: 'Neighborhood Songbird',
    instruction: 'Step near an open window or yard and listen carefully for bird chirps or outdoor nature!',
    targetCharacter: 'bright',
    hint: 'Birds create short, bright high-frequency bursts.',
  },
  {
    id: 'ss-quiet-room',
    title: 'Quiet Mind Sanctuary',
    instruction: 'Find the calmest, quietest spot in your home and measure how peaceful it sounds.',
    targetCharacter: 'quiet',
    hint: 'Stay still for 5 seconds and notice tiny background sounds you usually miss!',
  },
];

export const OFFLINE_MISSIONS = [
  {
    id: 'off-draw-map',
    title: 'Draw a Secret Island Map',
    description: 'Put the device away, grab paper and pencils, and draw an adventure map with landmarks!',
    icon: 'map',
  },
  {
    id: 'off-water-plant',
    title: 'Care for Home Plants',
    description: 'Check your plants, water the thirsty ones gently, and clear dry leaves.',
    icon: 'sprout',
  },
  {
    id: 'off-read-book',
    title: 'Paper-Book Reading Quest',
    description: 'Curl up with a real printed book and read at your own pace without screens.',
    icon: 'book',
  },
  {
    id: 'off-organize-desk',
    title: 'Tidy Study Sanctuary',
    description: 'Sort your books, pencils, and backpack so tomorrow starts smoothly.',
    icon: 'sparkles',
  },
  {
    id: 'off-dinner-prep',
    title: 'Help Prepare the Dining Table',
    description: 'Set napkins, cups, and spoons neatly and help your family get ready for a meal.',
    icon: 'utensils',
  },
  {
    id: 'off-imaginary-creature',
    title: 'Invent an Imaginary Creature',
    description: 'Sketch or sculpt a brand-new friendly creature using paper or safe craft materials.',
    icon: 'wand',
  },
];

export const SAMPLE_SCAN_PRESETS = [
  {
    id: 'sample-salt-water',
    label: 'Salt, Spoon & Glass of Water',
    description: 'Simulated kitchen science station',
    detectedObjects: ['salt', 'glass of water', 'metal spoon'],
    isMessyDesk: false,
  },
  {
    id: 'sample-leaf',
    label: 'Green Garden Leaf',
    description: 'Simulated outdoor botanical find',
    detectedObjects: ['green leaf', 'stem veins', 'sunlit surface'],
    isMessyDesk: false,
  },
  {
    id: 'sample-messy-desk',
    label: 'Messy Study Desk (Clutter Monster!)',
    description: 'Triggers the Clutter Monster Boss Battle',
    detectedObjects: ['scattered papers', 'pencils', 'stacked books', 'toy blocks'],
    isMessyDesk: true,
  },
];
