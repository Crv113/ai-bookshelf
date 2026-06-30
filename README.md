# ai-bookshelf

AI-Bookshelf is an open-source app that turns AI-assisted learning conversations into structured, searchable study notes.

I learn a lot using conversational AIs — sometimes ChatGPT, sometimes Claude, or others. But I would never go back and reread my conversations across all the different models I used. So I built an app to gather the conversations on the topics I want to revisit.

### How does it work?

When I'm learning a new topic with a conversational AI, I ask it for a course outline on the subject, then I ask a lot of questions, do quizzes, and so on. At the end, I give it a prompt asking for a summary in JSON format, with Mermaid diagrams when needed.
I import that JSON into AI-Bookshelf, and I can then reread my revision notes whenever I want.

# Prompt import json

### [FR]

Je veux exporter le résumé de cette discussion afin d'en faire une fiche de révision. Respecte le format JSON donné pour que je puisse l'importer dans mon application de révision.

title : Mets un titre pertinent et concis.
summary : Fais un résumé de 3-4 lignes pour expliquer de quoi parle ce cours.
model : Indique quelle IA (modèle - version).
content : Mets tout le contenu de ce résumé ici, tu peux le mettre en forme en Markdown et faire des schémas Mermaid pour que le cours soit plus compréhensible. Évite de laisser des zones d'ombre dans le sujet. N'aborde aucun autre sujet qu'on aurait pu aborder dans la discussion (ex: quiz, questions-réponses), reste sur le résumé global du sujet traité.
estimated_time : Ajoute le temps de lecture estimé, en minutes seulement (ex : 78).

Chaque champ est obligatoire.
Structure finale :
json{
"title": "",
"summary": "",
"model": "",
"content": "",
"estimated_time": ""
}
