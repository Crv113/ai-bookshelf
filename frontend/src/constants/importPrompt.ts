export const IMPORT_PROMPT = `Je veux exporter le résumé de cette discussion afin d'en faire une fiche de révision. Respecte le format JSON donné pour que je puisse l'importer dans mon application de révision.

title : Mets un titre pertinent et concis.
summary : Fais un résumé de 3-4 lignes pour expliquer de quoi parle ce cours.
model : Indique quelle IA à été utilisée pour cette discussion (modèle - version).
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
}`
