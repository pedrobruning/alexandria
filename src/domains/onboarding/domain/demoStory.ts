import type { LanguageCode } from "@/domains/generation/domain/language";

// A small, hand-written demo story used only by onboarding. It is seeded
// directly into the DB (no model call, no quota) so the spotlight tour has a
// real tree to point at — a root that forks into two coexisting timelines, one
// of which runs a step deeper. `steer` on the non-root nodes shows what nudged
// each branch. Content is canned, never AI-generated, so it does not partake in
// the `nodes.content` immutability/economic-cache invariant.

export type DemoNode = {
  key: string; // stable local id within this tree; mapped to a real uuid at seed time
  parentKey: string | null; // null marks the root
  title: string;
  content: string;
  summary: string;
  steer?: string; // present on forked (non-root) nodes to demonstrate steering
};

export type DemoStory = {
  title: string;
  premise: string;
  genre: string;
  tone: string;
  nodes: DemoNode[]; // nodes[0] is the root
};

const EN: DemoStory = {
  title: "The Drowned Library",
  premise:
    "A cartographer wakes in a library that floods with a different sea each night, and every door she opens writes a new map of the world.",
  genre: "Fantasy",
  tone: "Lyrical",
  nodes: [
    {
      key: "root",
      parentKey: null,
      title: "The Threshold",
      content:
        "You wake on a reading desk as the tide reaches the lowest shelves. The water is warm and smells of ink and far-off rain. Two passages lead out of the great hall: a colonnade where paper lanterns drift north over the flood, and a stair spiralling down toward a sunken archive that hums with drowned voices. The library is waiting to see which way you will read it.",
      summary: "A cartographer wakes in a flooding library facing two ways out.",
    },
    {
      key: "north",
      parentKey: "root",
      title: "Lantern Road",
      content:
        "You wade after the lanterns. They gather ahead of you like patient fireflies, lighting a road of floating pages that holds your weight as long as you keep moving. The further north you go, the colder the water, until your breath ghosts in the air and a tower of white salt rises from the flood, its windows lit from within.",
      summary: "Following the lanterns north leads to a glowing salt tower.",
      steer: "Follow the lanterns north along the flooded nave.",
    },
    {
      key: "tower",
      parentKey: "north",
      title: "The Salt Tower",
      content:
        "Inside the tower the air is dry and the walls are shelves of salt, each crystal holding a single remembered map. You take one between two fingers and it dissolves into a coastline you have never sailed but somehow miss. A keeper made of folded paper turns to you and asks, without a mouth, which of your maps you are willing to forget.",
      summary: "The salt tower trades memories of maps for the ones you'll forget.",
      steer: "Climb the tower despite the keeper's warning.",
    },
    {
      key: "archive",
      parentKey: "root",
      title: "The Drowned Archive",
      content:
        "You descend until the water closes over your head, and find you can breathe it. The archive opens below — drowned stacks where books bloom like coral and the voices of every reader who came before murmur their favourite lines. One voice, closer than the rest, reads aloud a description of a person standing exactly where you stand, deciding exactly what you are deciding.",
      summary: "Beneath the flood, the archive narrates the reader back to herself.",
      steer: "Stay and read from the drowned archive.",
    },
  ],
};

const PT_BR: DemoStory = {
  title: "A Biblioteca Submersa",
  premise:
    "Uma cartógrafa acorda numa biblioteca que se inunda com um mar diferente a cada noite, e cada porta que ela abre desenha um novo mapa do mundo.",
  genre: "Fantasy",
  tone: "Lyrical",
  nodes: [
    {
      key: "root",
      parentKey: null,
      title: "O Limiar",
      content:
        "Você acorda sobre uma mesa de leitura enquanto a maré alcança as prateleiras mais baixas. A água é morna e cheira a tinta e a chuva distante. Dois caminhos saem do grande salão: uma colunata onde lanternas de papel flutuam para o norte sobre a cheia, e uma escada que desce em espiral até um arquivo submerso que ressoa com vozes afogadas. A biblioteca espera para ver de que modo você a lerá.",
      summary: "Uma cartógrafa acorda numa biblioteca inundada diante de duas saídas.",
    },
    {
      key: "north",
      parentKey: "root",
      title: "Estrada de Lanternas",
      content:
        "Você avança pela água atrás das lanternas. Elas se juntam à sua frente como vaga-lumes pacientes, iluminando uma estrada de páginas flutuantes que sustenta seu peso enquanto você não para. Quanto mais ao norte, mais fria a água, até que seu fôlego vira névoa no ar e uma torre de sal branco se ergue da cheia, com as janelas acesas por dentro.",
      summary: "Seguir as lanternas ao norte leva a uma torre de sal luminosa.",
      steer: "Siga as lanternas para o norte pela nave inundada.",
    },
    {
      key: "tower",
      parentKey: "north",
      title: "A Torre de Sal",
      content:
        "Dentro da torre o ar é seco e as paredes são prateleiras de sal, cada cristal guardando um único mapa lembrado. Você toma um entre dois dedos e ele se dissolve numa costa que nunca navegou mas de algum modo sente falta. Um guardião feito de papel dobrado se vira para você e pergunta, sem boca, qual dos seus mapas você está disposta a esquecer.",
      summary: "A torre de sal troca memórias de mapas pelos que você esquecerá.",
      steer: "Suba a torre apesar do aviso do guardião.",
    },
    {
      key: "archive",
      parentKey: "root",
      title: "O Arquivo Submerso",
      content:
        "Você desce até a água fechar sobre sua cabeça, e descobre que pode respirá-la. O arquivo se abre abaixo — estantes afogadas onde os livros florescem como coral e as vozes de todos os leitores anteriores murmuram suas linhas prediletas. Uma voz, mais próxima que as outras, lê em voz alta a descrição de alguém parado exatamente onde você está, decidindo exatamente o que você decide.",
      summary: "Sob a cheia, o arquivo narra a leitora de volta para si mesma.",
      steer: "Fique e leia a partir do arquivo submerso.",
    },
  ],
};

const DEMO_STORIES: Record<LanguageCode, DemoStory> = { en: EN, "pt-BR": PT_BR };

export function getDemoStory(locale: string): DemoStory {
  return DEMO_STORIES[locale as LanguageCode] ?? EN;
}
