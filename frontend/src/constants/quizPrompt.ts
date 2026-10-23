import type { FlashCardResponse } from '../types/flashcard'

export type QuizMode = 'mcq' | 'open'

const QUESTION_COUNT = 30

const MODE_RULES: Record<QuizMode, string> = {
  mcq: `Fais-moi passer un quiz QCM en respectant ces règles :

- Base-toi uniquement sur le contenu de la fiche, n'invente rien qui n'y figure pas.
- Prépare ${QUESTION_COUNT} questions à choix multiples qui couvrent l'ensemble des grandes parties de la fiche, avec une difficulté progressive.
- Chaque question propose 4 choix notés A, B, C et D, avec une seule bonne réponse. Les mauvais choix doivent être plausibles, et la position de la bonne réponse doit varier d'une question à l'autre.
- Je veux répondre en cliquant sur les choix, pas en tapant une lettre. Présente donc le quiz dans une interface interactive (artifact, canvas ou équivalent) :
  - une seule question affichée à la fois, numérotée (par exemple « Question 3/${QUESTION_COUNT} »), avec une barre de progression ;
  - les 4 choix sous forme de boutons cliquables ;
  - après mon clic : la bonne réponse en vert, mon choix en rouge s'il est faux, puis une explication de quelques lignes sur pourquoi la bonne réponse est correcte et pourquoi les autres choix ne le sont pas, avec la partie de la fiche concernée ;
  - un bouton « Question suivante » pour continuer ;
  - à la fin : mon score sur ${QUESTION_COUNT} et la liste des notions à retravailler avec les parties de la fiche correspondantes.
- Après le quiz, propose-moi dans la conversation une nouvelle série de questions centrée sur mes points faibles.
- Si tu ne peux pas créer d'interface interactive, fais le quiz directement dans la conversation : une question à la fois, j'y réponds par une lettre, et tu appliques les mêmes corrections et le même bilan de fin.`,
  open: `Fais-moi passer un quiz à réponses libres en respectant ces règles :

- Base-toi uniquement sur le contenu de la fiche, n'invente rien qui n'y figure pas.
- Prépare ${QUESTION_COUNT} questions ouvertes qui couvrent l'ensemble des grandes parties de la fiche, avec une difficulté progressive.
- Je dois formuler chaque réponse moi-même : ne propose jamais de choix de réponses, ni d'indice, ni de début de réponse.
- Varie les types de questions : définir une notion, expliquer un mécanisme, comparer deux notions, dire pourquoi ou quand utiliser quelque chose, résoudre une mise en situation, et écrire ou expliquer du code si la fiche s'y prête.
- Pose une seule question à la fois, numérotée (par exemple « Question 3/${QUESTION_COUNT} »), et attends ma réponse avant de passer à la suivante.
- Après chacune de mes réponses : évalue le fond et non la formulation exacte, indique si elle est juste, partiellement juste ou fausse, précise ce qui manquait ou était erroné, donne une réponse modèle concise, et indique la partie de la fiche concernée. Si je réponds « je ne sais pas », donne la réponse modèle et passe à la suite.
- À la fin : donne mon score sur ${QUESTION_COUNT} (une réponse partiellement juste compte pour 0,5), liste les notions à retravailler avec les parties de la fiche correspondantes, puis propose-moi une nouvelle série de questions centrée sur mes points faibles.`,
}

// La fiche est placée avant les consignes : les modèles suivent mieux les instructions données après un long document
export function buildQuizPrompt(card: Pick<FlashCardResponse, 'title' | 'content'>, mode: QuizMode): string {
  return `Voici une fiche de révision intitulée « ${card.title} », au format Markdown :

<fiche>
${card.content}
</fiche>

Je veux m'entraîner sur cette fiche. ${MODE_RULES[mode]}

Commence directement par la question 1.`
}
