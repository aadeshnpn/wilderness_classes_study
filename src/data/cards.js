/** Paraphrased Chapter 1 study cards. Short recall prompts, not textbook pages. */

export const cards = [
  {
    id: "WFA-01-01",
    title: "The four surveys",
    prompt: "Name the four surveys in order, and the one job of each.",
    answer: [
      "Scene — keep yourself safe, count patients, and name what happened.",
      "Primary — keep them alive with MARCH.",
      "Secondary — take a history and look for problems you have not found yet.",
      "Ongoing — recheck until a higher level of care takes over.",
    ],
    remember: "Stop, save, search, sustain.",
  },
  {
    id: "WFA-01-02",
    title: "Scene survey",
    prompt: "A runner falls hard ahead of you. What do you do before you touch them?",
    answer: [
      "Pause. Look for rock, ice, water, bikes, people above, and animals.",
      "Name the mechanism of injury or the nature of the illness.",
      "Ask if anyone else is involved. Another patient may be out of sight.",
    ],
    remember: "Don't just do something. Stand there.",
  },
  {
    id: "WFA-01-03",
    title: "MARCH",
    prompt: "What does MARCH stand for, and why does M come before A?",
    answer: [
      "Massive bleeding, Airway with spine protection, Respiration, Circulation, then Heat and the way out.",
      "A spurting wound can kill in minutes, so major bleeding comes before the airway.",
      "In the backcountry, move to a tourniquet early if direct pressure is not enough.",
    ],
    remember: "Big bleed breaks the ABC habit.",
  },
  {
    id: "WFA-01-04",
    title: "What H means",
    prompt: "In MARCH, what are you actually deciding at H?",
    answer: [
      "Protect them from the environment: insulate and dry them, or cool them.",
      "Decide early whether they can walk out, or need a carry or a helicopter.",
    ],
    remember: "H is temperature and the way out.",
  },
  {
    id: "WFA-01-05",
    title: "Consent",
    prompt: "When do you need consent, and what if the patient cannot give it?",
    answer: [
      "If they can respond, introduce yourself and ask. They are allowed to refuse.",
      "If they are unconscious or too confused to answer, consent is implied.",
    ],
    remember: "Say who you are, and ask.",
  },
  {
    id: "WFA-01-06",
    title: "Spine when unresponsive",
    prompt: "The patient is unresponsive and you see no obvious mechanism. Do you protect the spine?",
    answer: [
      "Yes. Treat an unresponsive patient as a spine injury until you can examine them.",
      "Hold the head in line while you manage the airway.",
      "If they wake and you can assess them, decide again whether the spine still needs protection.",
    ],
    remember: "Unresponsive means spine until you can check.",
  },
  {
    id: "WFA-01-07",
    title: "SAMPLE",
    prompt: "Expand SAMPLE. Where do you look if the patient cannot talk?",
    answer: [
      "Symptoms, Allergies, Medications, Past history, Last intake, Events leading up.",
      "Ask companions. Check alert tags, the pack, a wallet, and a phone.",
    ],
    remember: "The pack often holds the history.",
  },
  {
    id: "WFA-01-08",
    title: "Ongoing survey",
    prompt: "How often do you repeat the ongoing survey, and what sends you back to the start?",
    answer: [
      "As often as their stability requires, until higher care takes over.",
      "Track mental status with AVPU: Alert, Verbal, Pain, Unresponsive.",
      "Any real change means you restart MARCH and find out why.",
    ],
    remember: "Change means restart MARCH.",
  },
  {
    id: "WFA-01-09",
    title: "AEIOU-TIPS",
    prompt: "Which checklist helps you think through a confused or unresponsive patient?",
    answer: [
      "Allergies and altitude, Environment and epilepsy, Infection, Overdose, Underdose, Trauma and toxins, Insulin, Psychological, Stroke.",
      "Altitude and environment are the wilderness additions. Walk the list from the top.",
    ],
    remember: "Altitude and weather belong on the list.",
  },
  {
    id: "WFA-01-10",
    title: "COLDERR",
    prompt: "How do you describe pain in a structured way?",
    answer: [
      "Character, Onset, Location, Duration, what makes it worse, what makes it better, and whether it travels.",
    ],
    remember: "Worse, better, and does it travel?",
  },
  {
    id: "WFA-01-11",
    title: "Recovery position",
    prompt: "You are alone with an unconscious patient who is breathing, and you must leave to get help. What first?",
    answer: [
      "Roll them onto their side in the recovery position.",
      "Top arm and top leg forward, so they cannot roll onto the back.",
      "That keeps the airway clearer and lets vomit drain.",
    ],
    remember: "On the back, the tongue and vomit both threaten breathing.",
  },
  {
    id: "WFA-01-12",
    title: "Drowning exception",
    prompt: "You pull a non-breathing swimmer from a lake. There is no bleeding. What comes first?",
    answer: [
      "Drowning is an oxygen problem. Give rescue breaths right away. This chapter starts with two.",
      "If there is no pulse, compressions include breaths. Hands-only CPR is the wrong choice here.",
      "Do not try to drain water from the lungs.",
    ],
    remember: "Drowning, lightning, avalanche: breaths matter.",
  },
  {
    id: "WFA-01-13",
    title: "Moving for scene safety",
    prompt: "Rocks are still falling on a climber who may have a spine injury. Do you move them?",
    answer: [
      "Yes, as carefully as you can. More rockfall can kill the patient and you.",
      "A safe scene outweighs a perfect spine hold. Then start the assessment.",
    ],
    remember: "A safe scene comes first.",
  },
  {
    id: "WFA-01-14",
    title: "Blood sweep and CARTS",
    prompt: "How do you sweep for blood, and where can someone bleed to death internally?",
    answer: [
      "Use your hands and eyes in small sections, including under layers. Blood hides between waterproof clothes.",
      "Also look back along the ground. They may have bled before they reached you.",
      "Internal sites to remember: chest, abdomen, retroperitoneum, thigh, and the skin or the ground.",
      "Internal bleeding in the field means evacuate. You cannot fix it here.",
    ],
    remember: "Under the layers. Then get them out.",
  },
  {
    id: "WFA-01-15",
    title: "BSI and exposure",
    prompt: "How do you protect yourself and still examine someone in the cold?",
    answer: [
      "Wear gloves. Improvise a barrier so your own gear stays clean.",
      "Look under clothing for hidden injuries, but do not destroy clothes you will need for warmth or the walk out.",
      "Expose, inspect, then cover again.",
    ],
    remember: "Clothes are survival gear.",
  },
  {
    id: "WFA-01-16",
    title: "SOAP handoff",
    prompt: "How do you structure notes and the verbal handoff?",
    answer: [
      "Start with age and sex.",
      "Subjective — what they feel and what happened.",
      "Objective — exam findings and vitals, each with a time.",
      "Assessment — the problem list.",
      "Plan — treatment you gave and the evacuation plan.",
      "Speak the handoff in that same order.",
    ],
    remember: "Write the time on every set of vitals.",
  },
];

export const cardIds = cards.map((card) => card.id);

const byId = new Map(cards.map((card) => [card.id, card]));

export function getCard(id) {
  return byId.get(id) ?? null;
}
