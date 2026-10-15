const LEVELS = ["a1", "a1", "a2", "a2", "b1", "b1"];

function withIds(lang, section, questions) {
  return questions.map((question, index) => ({
    id: `${lang}-${section}-${LEVELS[index]}-${(index % 2) + 1}`,
    section,
    level: Math.floor(index / 2),
    ...question
  }));
}

const FRENCH = {
  vocab: [
    { kind: "vocab", prompt: "Which picture is “le chat”?", options: [["🐶", "dog"], ["🐱", "cat"], ["🐟", "fish"], ["🐦", "bird"]], answer: 1 },
    { kind: "vocab", prompt: "Which picture is “la pomme”?", options: [["🍎", "apple"], ["🍞", "bread"], ["🥛", "milk"], ["🧀", "cheese"]], answer: 0 },
    { kind: "vocab", prompt: "Which picture is “la fenêtre”?", options: [["🚪", "door"], ["🪟", "window"], ["🪑", "chair"], ["🛏️", "bed"]], answer: 1 },
    { kind: "vocab", prompt: "Which picture is “le manteau”?", options: [["👗", "dress"], ["👟", "trainers"], ["🧥", "coat"], ["🧢", "cap"]], answer: 2 },
    { kind: "vocab", prompt: "What does “pourtant” mean?", options: [["➡️", "therefore"], ["↔️", "however"], ["⏰", "meanwhile"], ["❓", "perhaps"]], answer: 1 },
    { kind: "vocab", prompt: "What does “se débrouiller” mean?", options: [["🧭", "to manage / cope"], ["😴", "to fall asleep"], ["📣", "to complain"], ["🎁", "to lend"]], answer: 0 }
  ],
  grammar: [
    { kind: "grammar", prompt: "C’est ___ maison.", options: ["le", "la", "les", "un"], answer: 1 },
    { kind: "grammar", prompt: "J’ai ___ frère et une sœur.", options: ["un", "une", "des", "la"], answer: 0 },
    { kind: "grammar", prompt: "Nous allons ___ école.", options: ["à l’", "au", "aux", "du"], answer: 0 },
    { kind: "grammar", prompt: "Elle habite ici ___ trois mois.", options: ["depuis", "pendant", "il y a", "dans"], answer: 0 },
    { kind: "grammar", prompt: "Si j’avais le temps, je ___ davantage.", options: ["voyage", "voyagerai", "voyagerais", "voyageais"], answer: 2 },
    { kind: "grammar", prompt: "Bien qu’il ___ tard, ils continuent.", options: ["est", "soit", "sera", "était"], answer: 1 }
  ],
  verbs: [
    { kind: "verbs", prompt: "Nous ___ contents. (être)", options: ["sommes", "êtes", "sont", "suis"], answer: 0 },
    { kind: "verbs", prompt: "Tu ___ un vélo. (avoir)", options: ["ai", "as", "a", "avons"], answer: 1 },
    { kind: "verbs", prompt: "Hier, ils ___ au cinéma. (aller)", options: ["vont", "allaient", "sont allés", "iront"], answer: 2 },
    { kind: "verbs", prompt: "Quand j’étais petit, je ___ ici. (jouer)", options: ["jouais", "ai joué", "jouerai", "jouerais"], answer: 0 },
    { kind: "verbs", prompt: "Demain, je ___ prêt. (être)", options: ["serai", "suis", "étais", "serais"], answer: 0 },
    { kind: "verbs", prompt: "Il faut que vous ___ ce formulaire. (faire)", options: ["faites", "ferez", "fassiez", "feriez"], answer: 2 }
  ],
  speak: [
    { kind: "speak", prompt: "Introduce yourself in French", phrase: "Comment tu t’appelles ?", meaning: "Say your name in a full sentence." },
    { kind: "speak", prompt: "Say where you live", phrase: "Où est-ce que tu habites ?", meaning: "Answer in French in a full sentence." },
    { kind: "speak", prompt: "Talk about a hobby", phrase: "Qu’est-ce que tu aimes faire ?", meaning: "Give one activity and a reason if you can." },
    { kind: "speak", prompt: "Describe yesterday", phrase: "Qu’est-ce que tu as fait hier ?", meaning: "Answer in French using the past." },
    { kind: "speak", prompt: "Give and support an opinion", phrase: "Les devoirs sont-ils utiles ?", meaning: "State your opinion and give a reason." },
    { kind: "speak", prompt: "Handle a problem politely", phrase: "Ton repas au restaurant est froid.", meaning: "Explain the problem and ask for a solution in French." }
  ],
  listen: [
    { kind: "listen", prompt: "Listen. What did Panda say?", audio: "J’ai deux frères.", options: ["I have two sisters", "I have two brothers", "I am two years old", "I like my brother"], answer: 1 },
    { kind: "listen", prompt: "Listen. What time is the meeting?", audio: "Le rendez-vous est à neuf heures.", options: ["8:00", "9:00", "10:00", "11:00"], answer: 1 },
    { kind: "listen", prompt: "Listen. Where are they going?", audio: "Nous allons à la bibliothèque après l’école.", options: ["the library", "the park", "home", "the station"], answer: 0 },
    { kind: "listen", prompt: "Listen. Why is she taking the bus?", audio: "Comme il pleut, Léa prend le bus au lieu de marcher.", options: ["She is late", "It is raining", "She is tired", "The road is closed"], answer: 1 },
    { kind: "listen", prompt: "Listen. What has changed?", audio: "Le train devait partir à dix heures, mais il aura quarante minutes de retard.", options: ["The platform", "The destination", "The departure time", "The ticket price"], answer: 2 },
    { kind: "listen", prompt: "Listen. What does the speaker imply?", audio: "J’aurais volontiers accepté, si on m’avait prévenu plus tôt.", options: ["They accepted immediately", "They were not told early enough", "They dislike the invitation", "They forgot the date"], answer: 1 }
  ],
  watch: [
    { kind: "read", prompt: "Read, then answer", passage: "Léa va au parc avec son chien. Il fait beau.", question: "What is the weather like?", options: ["Rainy", "Sunny", "Snowy", "Windy"], answer: 1 },
    { kind: "read", prompt: "Read, then answer", passage: "Paul met son manteau et prend son parapluie avant de sortir.", question: "What is Paul expecting?", options: ["Hot weather", "Rain", "Snow", "Strong sunshine"], answer: 1 },
    { kind: "read", prompt: "Read, then answer", passage: "Nora voulait acheter la robe rouge, mais elle était trop chère. Elle choisit la bleue.", question: "Why does Nora choose the blue dress?", options: ["It is longer", "The red one is expensive", "Blue is her favourite colour", "The red one is too small"], answer: 1 },
    { kind: "read", prompt: "Read, then answer", passage: "Le musée ferme à dix-huit heures. Il est dix-sept heures trente et la visite dure une heure.", question: "What is the problem?", options: ["The museum is closed today", "They do not have enough time", "The visit is cancelled", "They lost their tickets"], answer: 1 },
    { kind: "read", prompt: "Read, then answer", passage: "Même s’il pleut, Lucas décide de sortir parce qu’il doit acheter du pain.", question: "Why does Lucas go out?", options: ["To exercise", "To buy bread", "To meet a friend", "To walk the dog"], answer: 1 },
    { kind: "read", prompt: "Read, then answer", passage: "Camille n’était pas convaincue au début. Pourtant, après avoir entendu les arguments de Samir, elle a changé d’avis.", question: "What caused Camille to change her mind?", options: ["A new rule", "Samir’s arguments", "A phone call", "The price"], answer: 1 }
  ]
};

const SPANISH = {
  vocab: [
    { kind: "vocab", prompt: "Which picture is “el gato”?", options: [["🐶", "dog"], ["🐱", "cat"], ["🐟", "fish"], ["🐦", "bird"]], answer: 1 },
    { kind: "vocab", prompt: "Which picture is “la manzana”?", options: [["🍎", "apple"], ["🍞", "bread"], ["🥛", "milk"], ["🧀", "cheese"]], answer: 0 },
    { kind: "vocab", prompt: "Which picture is “la ventana”?", options: [["🚪", "door"], ["🪟", "window"], ["🪑", "chair"], ["🛏️", "bed"]], answer: 1 },
    { kind: "vocab", prompt: "Which picture is “el abrigo”?", options: [["👗", "dress"], ["👟", "trainers"], ["🧥", "coat"], ["🧢", "cap"]], answer: 2 },
    { kind: "vocab", prompt: "What does “sin embargo” mean?", options: [["➡️", "therefore"], ["↔️", "however"], ["⏰", "meanwhile"], ["❓", "perhaps"]], answer: 1 },
    { kind: "vocab", prompt: "What does “darse cuenta” mean?", options: [["💡", "to realise"], ["😴", "to fall asleep"], ["📣", "to complain"], ["🎁", "to lend"]], answer: 0 }
  ],
  grammar: [
    { kind: "grammar", prompt: "Es ___ casa.", options: ["el", "la", "los", "un"], answer: 1 },
    { kind: "grammar", prompt: "Tengo ___ hermano y una hermana.", options: ["un", "una", "unos", "la"], answer: 0 },
    { kind: "grammar", prompt: "Vamos ___ colegio.", options: ["al", "a la", "del", "por"], answer: 0 },
    { kind: "grammar", prompt: "Vive aquí ___ hace tres meses.", options: ["desde", "durante", "hasta", "para"], answer: 0 },
    { kind: "grammar", prompt: "Si tuviera tiempo, ___ más.", options: ["viajo", "viajaré", "viajaría", "viajaba"], answer: 2 },
    { kind: "grammar", prompt: "Aunque ___ tarde, siguen trabajando.", options: ["es", "sea", "será", "era"], answer: 1 }
  ],
  verbs: [
    { kind: "verbs", prompt: "Nosotros ___ amigos. (ser)", options: ["somos", "sois", "son", "soy"], answer: 0 },
    { kind: "verbs", prompt: "Tú ___ una bicicleta. (tener)", options: ["tengo", "tienes", "tiene", "tenemos"], answer: 1 },
    { kind: "verbs", prompt: "Ayer ellos ___ al cine. (ir)", options: ["van", "iban", "fueron", "irán"], answer: 2 },
    { kind: "verbs", prompt: "Cuando era pequeño, ___ aquí. (jugar)", options: ["jugaba", "jugué", "jugaré", "jugaría"], answer: 0 },
    { kind: "verbs", prompt: "Mañana yo ___ en casa. (estar)", options: ["estaré", "estoy", "estaba", "estaría"], answer: 0 },
    { kind: "verbs", prompt: "Es necesario que ustedes ___ esto. (hacer)", options: ["hacen", "harán", "hagan", "harían"], answer: 2 }
  ],
  speak: [
    { kind: "speak", prompt: "Introduce yourself in Spanish", phrase: "¿Cómo te llamas?", meaning: "Say your name in a full sentence." },
    { kind: "speak", prompt: "Say where you live", phrase: "¿Dónde vives?", meaning: "Answer in Spanish in a full sentence." },
    { kind: "speak", prompt: "Talk about a hobby", phrase: "¿Qué te gusta hacer?", meaning: "Give one activity and a reason if you can." },
    { kind: "speak", prompt: "Describe yesterday", phrase: "¿Qué hiciste ayer?", meaning: "Answer in Spanish using the past." },
    { kind: "speak", prompt: "Give and support an opinion", phrase: "¿Son útiles los deberes?", meaning: "State your opinion and give a reason." },
    { kind: "speak", prompt: "Handle a problem politely", phrase: "Tu comida en el restaurante está fría.", meaning: "Explain the problem and ask for a solution in Spanish." }
  ],
  listen: [
    { kind: "listen", prompt: "Listen. What did Panda say?", audio: "Tengo dos hermanos.", options: ["I have two sisters", "I have two brothers", "I am two years old", "I like my brother"], answer: 1 },
    { kind: "listen", prompt: "Listen. What time is the meeting?", audio: "La cita es a las nueve.", options: ["8:00", "9:00", "10:00", "11:00"], answer: 1 },
    { kind: "listen", prompt: "Listen. Where are they going?", audio: "Vamos a la biblioteca después del colegio.", options: ["the library", "the park", "home", "the station"], answer: 0 },
    { kind: "listen", prompt: "Listen. Why is she taking the bus?", audio: "Como llueve, Lucía toma el autobús en vez de ir andando.", options: ["She is late", "It is raining", "She is tired", "The road is closed"], answer: 1 },
    { kind: "listen", prompt: "Listen. What has changed?", audio: "El tren debía salir a las diez, pero tendrá cuarenta minutos de retraso.", options: ["The platform", "The destination", "The departure time", "The ticket price"], answer: 2 },
    { kind: "listen", prompt: "Listen. What does the speaker imply?", audio: "Habría aceptado encantada si me lo hubieran dicho antes.", options: ["They accepted immediately", "They were not told early enough", "They dislike the invitation", "They forgot the date"], answer: 1 }
  ],
  watch: [
    { kind: "read", prompt: "Read, then answer", passage: "Lucía va al parque con su perro. Hace sol.", question: "What is the weather like?", options: ["Rainy", "Sunny", "Snowy", "Windy"], answer: 1 },
    { kind: "read", prompt: "Read, then answer", passage: "Pablo se pone el abrigo y coge el paraguas antes de salir.", question: "What is Pablo expecting?", options: ["Hot weather", "Rain", "Snow", "Strong sunshine"], answer: 1 },
    { kind: "read", prompt: "Read, then answer", passage: "Nora quería comprar el vestido rojo, pero era demasiado caro. Elige el azul.", question: "Why does Nora choose the blue dress?", options: ["It is longer", "The red one is expensive", "Blue is her favourite colour", "The red one is too small"], answer: 1 },
    { kind: "read", prompt: "Read, then answer", passage: "El museo cierra a las seis. Son las cinco y media y la visita dura una hora.", question: "What is the problem?", options: ["The museum is closed today", "They do not have enough time", "The visit is cancelled", "They lost their tickets"], answer: 1 },
    { kind: "read", prompt: "Read, then answer", passage: "Aunque llueve, Lucas decide salir porque tiene que comprar pan.", question: "Why does Lucas go out?", options: ["To exercise", "To buy bread", "To meet a friend", "To walk the dog"], answer: 1 },
    { kind: "read", prompt: "Read, then answer", passage: "Camila no estaba convencida al principio. Sin embargo, después de escuchar los argumentos de Samir, cambió de opinión.", question: "What caused Camila to change her mind?", options: ["A new rule", "Samir’s arguments", "A phone call", "The price"], answer: 1 }
  ]
};

function buildPlacement(lang, source) {
  return Object.entries(source).flatMap(([section, questions]) => withIds(lang, section, questions));
}

export const COMPREHENSIVE_PLACEMENT = {
  fr: buildPlacement("fr", FRENCH),
  es: buildPlacement("es", SPANISH)
};
