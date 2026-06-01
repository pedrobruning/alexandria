/* ============================================================
   FORKLORE — data + generation
   ============================================================ */

const GENRES = ['Fantasy', 'Sci-Fi', 'Mystery', 'Horror', 'Adventure', 'Fable'];
const TONES  = ['Lyrical', 'Dark', 'Whimsical', 'Tense', 'Epic'];

let _id = 100;
const nid = () => 'n' + (++_id);

/* ---- A fully-excavated sample story (the demo) ---- */
function buildSampleTree() {
  const root = {
    id: 'n1', parentId: null, kind: 'root', steer: null,
    title: 'The Sealed Stair',
    body: [
      "The desert had kept its promise: under the seventh dune, exactly where the old papyrus claimed, the lintel of a buried doorway broke the sand like a tooth.",
      "Tahira pressed her palm to the carved stone. It was warm — warmer than the night had any right to make it. Somewhere beyond that door, the Library of Alexandria had not burned. It had simply been buried, and was waiting.",
      "She could break the seal now, while the moon was high and the guards slept. Or she could wait for Khaled and the lantern, and do this the careful way."
    ],
  };
  const a = { id: 'n2', parentId: 'n1', kind: 'branch', steer: null,
    title: 'Break the Seal Alone',
    body: [
      "The wax cracked under her knife with a sound like a held breath finally let go. The door did not swing — it dissolved, sand pouring upward instead of down, and Tahira stepped into a corridor lit by nothing she could name.",
      "Shelves climbed into a darkness that swallowed her lantern-light whole. Every scroll was sealed in gold. Every seal was stamped with a single eye, and every eye, she realized slowly, was turning to look at her."
    ] };
  const b = { id: 'n3', parentId: 'n1', kind: 'steered', steer: 'wait for Khaled',
    title: 'Wait for the Lantern',
    body: [
      "She made herself sit. The cold came up through the stone and into her bones, and still she waited, counting the careful way Khaled had taught her — by the stars, not by her fear.",
      "When the lantern finally bobbed over the dune, it was not Khaled who carried it. The figure wore his coat. It did not wear his face."
    ] };
  root.children = [a, b];
  a.children = [
    { id: 'n4', parentId: 'n2', kind: 'branch', steer: null, title: 'Answer the Eyes',
      body: [
        "\"I am here to read you,\" she said aloud, because silence felt more dangerous than speech. The eyes blinked, all at once, and the seals fell open like petals.",
        "Words rose off the papyrus in threads of light and wove themselves into a voice. It asked her one question, and the question was her own name — spoken in a tongue that had been dead three thousand years."
      ], children: [] },
    { id: 'n5', parentId: 'n2', kind: 'steered', steer: 'she runs', title: 'Flee the Reading Room',
      body: [
        "She ran. The corridor lengthened to mock her, shelves blurring into a single golden smear, and behind her the eyes did not chase — they simply waited at every turn she took, already there.",
        "The exit, when she reached it, opened not onto the desert but onto another reading room. And another. The Library, it seemed, had decided to keep her."
      ], children: [] },
  ];
  b.children = [
    { id: 'n6', parentId: 'n3', kind: 'branch', steer: null, title: 'Confront the Stranger',
      body: [
        "\"Khaled doesn't lend his coat,\" Tahira said, rising slow, knife already in her hand. The figure tilted its borrowed shoulders and the lantern-flame went the colour of old gold.",
        "\"He didn't lend it,\" it agreed, in a voice like pages turning. \"He paid it. The Library always collects. You're early, but the seat beside him is warm.\""
      ], children: [] },
  ];
  return root;
}

/* flatten tree → ordered nodes, compute depth & child counts */
function flatten(root) {
  const out = [];
  const walk = (n, depth) => { out.push({ node: n, depth }); (n.children||[]).forEach(c => walk(c, depth+1)); };
  walk(root, 0);
  return out;
}
function countPassages(root) { return flatten(root).length; }
function countBranches(root) { return flatten(root).filter(x => (x.node.children||[]).length >= 2).length; }

/* ---- Seed library ---- */
function seedStories() {
  const s1 = buildSampleTree();
  return [
    { id: 's1', title: 'The Sealed Stair', genre: 'Fantasy', tone: 'Lyrical',
      premise: 'An archaeologist finds the buried, unburned Library of Alexandria.',
      updated: '2 hours ago', tree: s1 },
    { id: 's2', title: 'Signal from the Pharos', genre: 'Sci-Fi', tone: 'Tense',
      premise: 'The ancient lighthouse beam is still transmitting — to something in orbit.',
      updated: 'yesterday',
      tree: { id: 'n20', parentId: null, kind: 'root', steer: null, title: 'The Beam Returns',
        body: ["For nine hundred years the Pharos had been rubble. Tonight it threw a column of white light into the sky, and the light was answered."],
        children: [
          { id:'n21', parentId:'n20', kind:'branch', steer:null, title:'Climb the Ruin', body:["The stair was gone but the signal was a handhold..."], children:[] },
          { id:'n22', parentId:'n20', kind:'steered', steer:'call for help', title:'Raise the Harbor', body:["She woke the harbor-master, who did not believe her until the water began to glow."], children:[] },
        ] } },
    { id: 's3', title: 'The Cartographer\'s Confession', genre: 'Mystery', tone: 'Dark',
      premise: 'A mapmaker draws a city that does not exist, then it appears.',
      updated: '3 days ago',
      tree: { id: 'n30', parentId: null, kind: 'root', steer: null, title: 'The Extra City',
        body: ["He had drawn the coastline a thousand times. He had never once drawn the city now sitting in the bay."],
        children: [ { id:'n31', parentId:'n30', kind:'branch', steer:null, title:'Row Out to It', body:["The oars dipped into water that tasted of ink."], children:[] } ] } },
  ];
}

/* ============================================================
   Passage generation — real (window.claude) with canned fallback
   ============================================================ */
const CANNED = {
  Fantasy: [
    "The corridor breathed around her, dust rising in slow gold spirals, and the next sealed scroll pulsed once — as if it had been waiting for precisely this footstep, this hand, this hour.",
    "A door she had not drawn opened in the wall, and through it came the smell of cedar and the sound of a hundred pens that had never stopped writing.",
  ],
  'Sci-Fi': [
    "The readout stuttered, resolved, and showed a star-map three millennia out of date — yet the coordinates it marked were lighting up, one by one, in the present tense.",
    "Something in the old machine remembered her, though she had never touched it, and it began — patiently, irreversibly — to boot.",
  ],
  Mystery: [
    "The detail she had overlooked sat exactly where it always had, and now that she saw it she could not understand how anyone had ever called this an accident.",
    "A name surfaced in the ledger, written in her own hand, on a page she swore she had never opened.",
  ],
  Horror: [
    "The light did not so much fail as decide to leave, and in the dark that followed she heard the unmistakable, intimate sound of something getting comfortable.",
    "It had her face now. It wore it badly, the way a child wears a parent's coat, and it was practicing her smile in the dark.",
  ],
  Adventure: [
    "The rope held — barely — and below her the chasm exhaled a wind that carried the rattle of a thousand coins and the promise of every one of them.",
    "She took the leap before her courage could file an objection, and the far ledge rushed up to meet her like an old friend with bad news.",
  ],
  Fable: [
    "The little scribe-bird cocked its head and offered her a single true thing, the way such birds do — once, and never the same way twice.",
    "And so the lesson, which had been buried with the rest, dusted itself off and decided it was time to be learned again.",
  ],
};

async function generatePassage({ genre, tone, steer, path }) {
  const lead = (path && path.length) ? path[path.length - 1].title : 'the opening';
  // Try real generation if the host exposes it
  if (typeof window !== 'undefined' && window.claude && typeof window.claude.complete === 'function') {
    try {
      const ctx = (path || []).map(p => p.body.join(' ')).join('\n\n').slice(-1600);
      const prompt =
`You are continuing a ${genre.toLowerCase()}, ${tone.toLowerCase()}-toned branching story called Forklore.
Story so far:
${ctx}

Write the NEXT short passage (2 short paragraphs, ~90 words total).${steer ? ` The reader steers it this way: "${steer}".` : ''}
Then on a new final line write: TITLE: <a 2-4 word pixel-game-style chapter title>.
Return only the prose and the TITLE line.`;
      const raw = await window.claude.complete(prompt);
      const m = raw.match(/TITLE:\s*(.+)\s*$/i);
      const title = m ? m[1].trim().replace(/^["']|["']$/g,'') : 'A New Branch';
      const body = raw.replace(/TITLE:.*$/i, '').trim().split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean);
      return { title, body: body.length ? body : [raw.trim()] };
    } catch (e) { /* fall through to canned */ }
  }
  // canned fallback
  const pool = CANNED[genre] || CANNED.Fantasy;
  const pick = pool[Math.floor(Math.random()*pool.length)];
  const body = [pick];
  if (steer) body.push(`She had chosen this turn herself — ${steer} — and the dig rearranged itself to oblige, sand whispering into new shapes.`);
  const titles = ['The Next Seal','Deeper In','A Forked Path','The Unrolled Page','Beneath the Beneath','What Waited','The Turning'];
  return { title: titles[Math.floor(Math.random()*titles.length)], body };
}

Object.assign(window, {
  GENRES, TONES, nid, buildSampleTree, flatten, countPassages, countBranches,
  seedStories, generatePassage,
});
