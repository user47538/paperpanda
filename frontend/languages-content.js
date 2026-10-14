const FR_PRONOUNS = ["je", "tu", "il / elle", "nous", "vous", "ils / elles"];
const ES_PRONOUNS = ["yo", "tú", "él / ella", "nosotros", "vosotros", "ellos / ellas"];

const FR_TENSES = [
  ["present", "Présent de l’indicatif", "Present", "A1", "What is true now, or what usually happens."],
  ["past", "Passé composé", "Perfect / past", "A2", "A completed action in the past."],
  ["imperfect", "Imparfait de l’indicatif", "Imperfect", "A2", "A description or repeated action in the past."],
  ["imperative", "Impératif", "Commands", "A2", "Tell someone what to do."],
  ["future", "Futur simple", "Future", "B1", "Say what will happen."],
  ["conditional", "Conditionnel présent", "Conditional", "B1", "Say what would happen or make a polite request."],
  ["subjunctive", "Subjonctif présent", "Subjunctive", "B2", "Use after expressions of wish, feeling or necessity."]
];

const ES_TENSES = [
  ["present", "Presente de indicativo", "Present", "A1", "What is true now, or what usually happens."],
  ["past", "Pretérito indefinido", "Simple past", "A2", "A completed action at a point in the past."],
  ["imperfect", "Pretérito imperfecto", "Imperfect", "A2", "A description or repeated action in the past."],
  ["imperative", "Imperativo", "Commands", "A2", "Tell someone what to do."],
  ["future", "Futuro simple", "Future", "B1", "Say what will happen."],
  ["conditional", "Condicional", "Conditional", "B1", "Say what would happen or make a polite request."],
  ["subjunctive", "Presente de subjuntivo", "Subjunctive", "B2", "Use after expressions of wish, feeling or doubt."]
];

function makeVerbs(language, entries) {
  const pronouns = language === "fr" ? FR_PRONOUNS : ES_PRONOUNS;
  const tenseMeta = language === "fr" ? FR_TENSES : ES_TENSES;
  return entries.map(([inf, en, forms]) => ({
    inf,
    en,
    tenses: tenseMeta.filter(([id]) => Array.isArray(forms[id])).map(([id, name, english, level, use], tenseIndex) => {
      const tenseForms = forms[id];
      const rowPronouns = id === "imperative"
        ? language === "fr" ? ["(tu)", "(nous)", "(vous)"] : ["(tú)", "(usted)", "(nosotros)", "(vosotros)", "(ustedes)"]
        : pronouns;
      return {
        id,
        name,
        en: english,
        level,
        use,
        rows: rowPronouns.map((pronoun, index) => [pronoun, tenseForms[index]]),
        blank: tenseForms.length > 4 ? [1, 4] : [Math.min(1, tenseForms.length - 1)]
      };
    })
  }));
}

const FR_VERBS = makeVerbs("fr", [
  ["être", "to be", {
    present: ["suis", "es", "est", "sommes", "êtes", "sont"], past: ["ai été", "as été", "a été", "avons été", "avez été", "ont été"],
    imperfect: ["étais", "étais", "était", "étions", "étiez", "étaient"], imperative: ["sois", "soyons", "soyez"],
    future: ["serai", "seras", "sera", "serons", "serez", "seront"], conditional: ["serais", "serais", "serait", "serions", "seriez", "seraient"],
    subjunctive: ["sois", "sois", "soit", "soyons", "soyez", "soient"]
  }],
  ["avoir", "to have", {
    present: ["ai", "as", "a", "avons", "avez", "ont"], past: ["ai eu", "as eu", "a eu", "avons eu", "avez eu", "ont eu"],
    imperfect: ["avais", "avais", "avait", "avions", "aviez", "avaient"], imperative: ["aie", "ayons", "ayez"],
    future: ["aurai", "auras", "aura", "aurons", "aurez", "auront"], conditional: ["aurais", "aurais", "aurait", "aurions", "auriez", "auraient"],
    subjunctive: ["aie", "aies", "ait", "ayons", "ayez", "aient"]
  }],
  ["aller", "to go", {
    present: ["vais", "vas", "va", "allons", "allez", "vont"], past: ["suis allé(e)", "es allé(e)", "est allé(e)", "sommes allé(e)s", "êtes allé(e)(s)", "sont allé(e)s"],
    imperfect: ["allais", "allais", "allait", "allions", "alliez", "allaient"], imperative: ["va", "allons", "allez"],
    future: ["irai", "iras", "ira", "irons", "irez", "iront"], conditional: ["irais", "irais", "irait", "irions", "iriez", "iraient"],
    subjunctive: ["aille", "ailles", "aille", "allions", "alliez", "aillent"]
  }],
  ["faire", "to do / make", {
    present: ["fais", "fais", "fait", "faisons", "faites", "font"], past: ["ai fait", "as fait", "a fait", "avons fait", "avez fait", "ont fait"],
    imperfect: ["faisais", "faisais", "faisait", "faisions", "faisiez", "faisaient"], imperative: ["fais", "faisons", "faites"],
    future: ["ferai", "feras", "fera", "ferons", "ferez", "feront"], conditional: ["ferais", "ferais", "ferait", "ferions", "feriez", "feraient"],
    subjunctive: ["fasse", "fasses", "fasse", "fassions", "fassiez", "fassent"]
  }],
  ["prendre", "to take", {
    present: ["prends", "prends", "prend", "prenons", "prenez", "prennent"], past: ["ai pris", "as pris", "a pris", "avons pris", "avez pris", "ont pris"],
    imperfect: ["prenais", "prenais", "prenait", "prenions", "preniez", "prenaient"], imperative: ["prends", "prenons", "prenez"],
    future: ["prendrai", "prendras", "prendra", "prendrons", "prendrez", "prendront"], conditional: ["prendrais", "prendrais", "prendrait", "prendrions", "prendriez", "prendraient"],
    subjunctive: ["prenne", "prennes", "prenne", "prenions", "preniez", "prennent"]
  }],
  ["vouloir", "to want", {
    present: ["veux", "veux", "veut", "voulons", "voulez", "veulent"], past: ["ai voulu", "as voulu", "a voulu", "avons voulu", "avez voulu", "ont voulu"],
    imperfect: ["voulais", "voulais", "voulait", "voulions", "vouliez", "voulaient"], imperative: ["veuille", "voulons", "veuillez"],
    future: ["voudrai", "voudras", "voudra", "voudrons", "voudrez", "voudront"], conditional: ["voudrais", "voudrais", "voudrait", "voudrions", "voudriez", "voudraient"],
    subjunctive: ["veuille", "veuilles", "veuille", "voulions", "vouliez", "veuillent"]
  }],
  ["pouvoir", "to be able to", {
    present: ["peux", "peux", "peut", "pouvons", "pouvez", "peuvent"], past: ["ai pu", "as pu", "a pu", "avons pu", "avez pu", "ont pu"],
    imperfect: ["pouvais", "pouvais", "pouvait", "pouvions", "pouviez", "pouvaient"], imperative: null,
    future: ["pourrai", "pourras", "pourra", "pourrons", "pourrez", "pourront"], conditional: ["pourrais", "pourrais", "pourrait", "pourrions", "pourriez", "pourraient"],
    subjunctive: ["puisse", "puisses", "puisse", "puissions", "puissiez", "puissent"]
  }]
]);

const ES_VERBS = makeVerbs("es", [
  ["ser", "to be", {
    present: ["soy", "eres", "es", "somos", "sois", "son"], past: ["fui", "fuiste", "fue", "fuimos", "fuisteis", "fueron"],
    imperfect: ["era", "eras", "era", "éramos", "erais", "eran"], imperative: ["sé", "sea", "seamos", "sed", "sean"],
    future: ["seré", "serás", "será", "seremos", "seréis", "serán"], conditional: ["sería", "serías", "sería", "seríamos", "seríais", "serían"],
    subjunctive: ["sea", "seas", "sea", "seamos", "seáis", "sean"]
  }],
  ["estar", "to be", {
    present: ["estoy", "estás", "está", "estamos", "estáis", "están"], past: ["estuve", "estuviste", "estuvo", "estuvimos", "estuvisteis", "estuvieron"],
    imperfect: ["estaba", "estabas", "estaba", "estábamos", "estabais", "estaban"], imperative: ["está", "esté", "estemos", "estad", "estén"],
    future: ["estaré", "estarás", "estará", "estaremos", "estaréis", "estarán"], conditional: ["estaría", "estarías", "estaría", "estaríamos", "estaríais", "estarían"],
    subjunctive: ["esté", "estés", "esté", "estemos", "estéis", "estén"]
  }],
  ["tener", "to have", {
    present: ["tengo", "tienes", "tiene", "tenemos", "tenéis", "tienen"], past: ["tuve", "tuviste", "tuvo", "tuvimos", "tuvisteis", "tuvieron"],
    imperfect: ["tenía", "tenías", "tenía", "teníamos", "teníais", "tenían"], imperative: ["ten", "tenga", "tengamos", "tened", "tengan"],
    future: ["tendré", "tendrás", "tendrá", "tendremos", "tendréis", "tendrán"], conditional: ["tendría", "tendrías", "tendría", "tendríamos", "tendríais", "tendrían"],
    subjunctive: ["tenga", "tengas", "tenga", "tengamos", "tengáis", "tengan"]
  }],
  ["ir", "to go", {
    present: ["voy", "vas", "va", "vamos", "vais", "van"], past: ["fui", "fuiste", "fue", "fuimos", "fuisteis", "fueron"],
    imperfect: ["iba", "ibas", "iba", "íbamos", "ibais", "iban"], imperative: ["ve", "vaya", "vayamos", "id", "vayan"],
    future: ["iré", "irás", "irá", "iremos", "iréis", "irán"], conditional: ["iría", "irías", "iría", "iríamos", "iríais", "irían"],
    subjunctive: ["vaya", "vayas", "vaya", "vayamos", "vayáis", "vayan"]
  }],
  ["hacer", "to do / make", {
    present: ["hago", "haces", "hace", "hacemos", "hacéis", "hacen"], past: ["hice", "hiciste", "hizo", "hicimos", "hicisteis", "hicieron"],
    imperfect: ["hacía", "hacías", "hacía", "hacíamos", "hacíais", "hacían"], imperative: ["haz", "haga", "hagamos", "haced", "hagan"],
    future: ["haré", "harás", "hará", "haremos", "haréis", "harán"], conditional: ["haría", "harías", "haría", "haríamos", "haríais", "harían"],
    subjunctive: ["haga", "hagas", "haga", "hagamos", "hagáis", "hagan"]
  }],
  ["poder", "to be able to", {
    present: ["puedo", "puedes", "puede", "podemos", "podéis", "pueden"], past: ["pude", "pudiste", "pudo", "pudimos", "pudisteis", "pudieron"],
    imperfect: ["podía", "podías", "podía", "podíamos", "podíais", "podían"], imperative: ["puede", "pueda", "podamos", "poded", "puedan"],
    future: ["podré", "podrás", "podrá", "podremos", "podréis", "podrán"], conditional: ["podría", "podrías", "podría", "podríamos", "podríais", "podrían"],
    subjunctive: ["pueda", "puedas", "pueda", "podamos", "podáis", "puedan"]
  }],
  ["querer", "to want", {
    present: ["quiero", "quieres", "quiere", "queremos", "queréis", "quieren"], past: ["quise", "quisiste", "quiso", "quisimos", "quisisteis", "quisieron"],
    imperfect: ["quería", "querías", "quería", "queríamos", "queríais", "querían"], imperative: ["quiere", "quiera", "queramos", "quered", "quieran"],
    future: ["querré", "querrás", "querrá", "querremos", "querréis", "querrán"], conditional: ["querría", "querrías", "querría", "querríamos", "querríais", "querrían"],
    subjunctive: ["quiera", "quieras", "quiera", "queramos", "queráis", "quieran"]
  }]
]);

const FR_SCENES = [
  ["house", "🏠", "La maison", [["🛏️", "le lit", "bed"], ["🚪", "la porte", "door"], ["🪟", "la fenêtre", "window"], ["🪑", "la chaise", "chair"], ["🛋️", "le canapé", "sofa"], ["🪞", "le miroir", "mirror"]]],
  ["farm", "🐄", "La ferme", [["🐄", "la vache", "cow"], ["🐴", "le cheval", "horse"], ["🐔", "la poule", "hen"], ["🐑", "le mouton", "sheep"], ["🐖", "le cochon", "pig"], ["🚜", "le tracteur", "tractor"]]],
  ["school", "🏫", "L’école", [["📚", "le livre", "book"], ["✏️", "le crayon", "pencil"], ["🎒", "le sac", "bag"], ["📏", "la règle", "ruler"], ["🖊️", "le stylo", "pen"], ["🧑‍🏫", "le professeur", "teacher"]]],
  ["kitchen", "🍳", "La cuisine", [["🍳", "la poêle", "pan"], ["🔪", "le couteau", "knife"], ["🥄", "la cuillère", "spoon"], ["🧂", "le sel", "salt"], ["🥛", "le lait", "milk"], ["🍞", "le pain", "bread"]]],
  ["park", "🌳", "Le parc", [["🌳", "l’arbre", "tree"], ["🌷", "la fleur", "flower"], ["⚽", "le ballon", "ball"], ["🐕", "le chien", "dog"], ["🚲", "le vélo", "bicycle"], ["☀️", "le soleil", "sun"]]],
  ["beach", "🏖️", "La plage", [["🌊", "la mer", "sea"], ["🏖️", "le sable", "sand"], ["🐚", "le coquillage", "shell"], ["⛱️", "le parasol", "sunshade"], ["🩴", "les tongs", "thongs"], ["🧴", "la crème solaire", "sunscreen"]]],
  ["clothes", "👕", "Les vêtements", [["👕", "le tee-shirt", "T-shirt"], ["👖", "le pantalon", "trousers"], ["👗", "la robe", "dress"], ["🧥", "le manteau", "coat"], ["👟", "les baskets", "trainers"], ["🧢", "la casquette", "cap"]]],
  ["body", "🧍", "Le corps", [["👁️", "l’œil", "eye"], ["👂", "l’oreille", "ear"], ["👃", "le nez", "nose"], ["👄", "la bouche", "mouth"], ["✋", "la main", "hand"], ["🦶", "le pied", "foot"]]]
];

const ES_SCENES = [
  ["house", "🏠", "La casa", [["🛏️", "la cama", "bed"], ["🚪", "la puerta", "door"], ["🪟", "la ventana", "window"], ["🪑", "la silla", "chair"], ["🛋️", "el sofá", "sofa"], ["🪞", "el espejo", "mirror"]]],
  ["farm", "🐄", "La granja", [["🐄", "la vaca", "cow"], ["🐴", "el caballo", "horse"], ["🐔", "la gallina", "hen"], ["🐑", "la oveja", "sheep"], ["🐖", "el cerdo", "pig"], ["🚜", "el tractor", "tractor"]]],
  ["school", "🏫", "El colegio", [["📚", "el libro", "book"], ["✏️", "el lápiz", "pencil"], ["🎒", "la mochila", "bag"], ["📏", "la regla", "ruler"], ["🖊️", "el bolígrafo", "pen"], ["🧑‍🏫", "el profesor", "teacher"]]],
  ["kitchen", "🍳", "La cocina", [["🍳", "la sartén", "pan"], ["🔪", "el cuchillo", "knife"], ["🥄", "la cuchara", "spoon"], ["🧂", "la sal", "salt"], ["🥛", "la leche", "milk"], ["🍞", "el pan", "bread"]]],
  ["park", "🌳", "El parque", [["🌳", "el árbol", "tree"], ["🌷", "la flor", "flower"], ["⚽", "la pelota", "ball"], ["🐕", "el perro", "dog"], ["🚲", "la bicicleta", "bicycle"], ["☀️", "el sol", "sun"]]],
  ["beach", "🏖️", "La playa", [["🌊", "el mar", "sea"], ["🏖️", "la arena", "sand"], ["🐚", "la concha", "shell"], ["⛱️", "la sombrilla", "sunshade"], ["🩴", "las chanclas", "thongs"], ["🧴", "la crema solar", "sunscreen"]]],
  ["clothes", "👕", "La ropa", [["👕", "la camiseta", "T-shirt"], ["👖", "los pantalones", "trousers"], ["👗", "el vestido", "dress"], ["🧥", "el abrigo", "coat"], ["👟", "las zapatillas", "trainers"], ["🧢", "la gorra", "cap"]]],
  ["body", "🧍", "El cuerpo", [["👁️", "el ojo", "eye"], ["👂", "la oreja", "ear"], ["👃", "la nariz", "nose"], ["👄", "la boca", "mouth"], ["✋", "la mano", "hand"], ["🦶", "el pie", "foot"]]]
];

const SHARED_TOPICS = {
  fr: {
    Sport: ["⚽", [["🏆", "le trophée"], ["🥅", "le but"], ["🏟️", "le stade"], ["🥇", "la médaille"]]],
    Musique: ["🎸", [["🎸", "la guitare"], ["🥁", "la batterie"], ["🎤", "le micro"], ["🎧", "le casque"]]],
    Cuisine: ["🍳", [["🍳", "la poêle"], ["🔪", "le couteau"], ["🥄", "la cuillère"], ["🧂", "le sel"]]],
    Mode: ["👗", [["👗", "la robe"], ["👠", "les talons"], ["🧣", "l’écharpe"], ["👜", "le sac à main"]]],
    Nature: ["🌋", [["🌋", "le volcan"], ["🌊", "la vague"], ["🌲", "le sapin"], ["🌈", "l’arc-en-ciel"]]],
    Voyage: ["🧳", [["🧳", "la valise"], ["🛂", "le passeport"], ["✈️", "l’avion"], ["🗺️", "la carte"]]]
  },
  es: {
    Deporte: ["⚽", [["🏆", "el trofeo"], ["🥅", "la portería"], ["🏟️", "el estadio"], ["🥇", "la medalla"]]],
    Música: ["🎸", [["🎸", "la guitarra"], ["🥁", "la batería"], ["🎤", "el micrófono"], ["🎧", "los auriculares"]]],
    Cocina: ["🍳", [["🍳", "la sartén"], ["🔪", "el cuchillo"], ["🥄", "la cuchara"], ["🧂", "la sal"]]],
    Moda: ["👗", [["👗", "el vestido"], ["👠", "los tacones"], ["🧣", "la bufanda"], ["👜", "el bolso"]]],
    Naturaleza: ["🌋", [["🌋", "el volcán"], ["🌊", "la ola"], ["🌲", "el pino"], ["🌈", "el arcoíris"]]],
    Viajes: ["🧳", [["🧳", "la maleta"], ["🛂", "el pasaporte"], ["✈️", "el avión"], ["🗺️", "el mapa"]]]
  }
};

const FR_PLACEMENT = [
  { id: "fr-vocab-a1", section: "vocab", level: 0, kind: "vocab", prompt: "Which picture is “le chat” ?", options: [["🐶", "dog"], ["🐱", "cat"], ["🐟", "fish"], ["🐦", "bird"]], answer: 1 },
  { id: "fr-vocab-a2", section: "vocab", level: 1, kind: "vocab", prompt: "Which picture is “la fenêtre” ?", options: [["🚪", "door"], ["🪟", "window"], ["🪑", "chair"], ["🛏️", "bed"]], answer: 1 },
  { id: "fr-grammar-a1", section: "grammar", level: 0, kind: "grammar", prompt: "C’est ___ maison.", options: ["le", "la", "les", "un"], answer: 1 },
  { id: "fr-grammar-a2", section: "grammar", level: 1, kind: "grammar", prompt: "Nous allons ___ école.", options: ["à la", "au", "aux", "du"], answer: 0 },
  { id: "fr-verbs-a1", section: "verbs", level: 0, kind: "verbs", prompt: "Nous ___ contents. (être)", options: ["sommes", "êtes", "sont", "suis"], answer: 0 },
  { id: "fr-verbs-b1", section: "verbs", level: 2, kind: "verbs", prompt: "Demain, je ___ prêt. (être)", options: ["serai", "suis", "étais", "serais"], answer: 0 },
  { id: "fr-speak-a1", section: "speak", level: 0, kind: "speak", prompt: "Say this out loud", phrase: "Je m’appelle Maddie et j’ai douze ans.", meaning: "My name is Maddie and I am twelve." },
  { id: "fr-speak-a2", section: "speak", level: 1, kind: "speak", prompt: "Answer out loud", phrase: "Qu’est-ce que tu aimes faire ?", meaning: "What do you like doing?" },
  { id: "fr-listen-a1", section: "listen", level: 0, kind: "listen", prompt: "Listen. What did Panda say?", audio: "J’ai deux frères.", options: ["I have two sisters", "I have two brothers", "I am two years old", "I like my brother"], answer: 1 },
  { id: "fr-listen-a2", section: "listen", level: 1, kind: "listen", prompt: "Listen. Where are they going?", audio: "Nous allons à la bibliothèque après l’école.", options: ["the library", "the park", "home", "the station"], answer: 0 },
  { id: "fr-watch-a1", section: "watch", level: 0, kind: "read", prompt: "Read, then answer", passage: "Léa va au parc avec son chien. Il fait beau.", question: "What is the weather like?", options: ["Rainy", "Sunny", "Snowy", "Windy"], answer: 1 },
  { id: "fr-watch-b1", section: "watch", level: 2, kind: "read", prompt: "Read, then answer", passage: "Même s’il pleut, Lucas décide de sortir parce qu’il doit acheter du pain.", question: "Why does Lucas go out?", options: ["To exercise", "To buy bread", "To meet a friend", "To walk the dog"], answer: 1 }
];

const ES_PLACEMENT = [
  { id: "es-vocab-a1", section: "vocab", level: 0, kind: "vocab", prompt: "Which picture is “el gato” ?", options: [["🐶", "dog"], ["🐱", "cat"], ["🐟", "fish"], ["🐦", "bird"]], answer: 1 },
  { id: "es-vocab-a2", section: "vocab", level: 1, kind: "vocab", prompt: "Which picture is “la ventana” ?", options: [["🚪", "door"], ["🪟", "window"], ["🪑", "chair"], ["🛏️", "bed"]], answer: 1 },
  { id: "es-grammar-a1", section: "grammar", level: 0, kind: "grammar", prompt: "Es ___ casa.", options: ["el", "la", "los", "un"], answer: 1 },
  { id: "es-grammar-a2", section: "grammar", level: 1, kind: "grammar", prompt: "Vamos ___ colegio.", options: ["al", "a la", "del", "por"], answer: 0 },
  { id: "es-verbs-a1", section: "verbs", level: 0, kind: "verbs", prompt: "Nosotros ___ amigos. (ser)", options: ["somos", "sois", "son", "soy"], answer: 0 },
  { id: "es-verbs-b1", section: "verbs", level: 2, kind: "verbs", prompt: "Mañana yo ___ en casa. (estar)", options: ["estaré", "estoy", "estaba", "estaría"], answer: 0 },
  { id: "es-speak-a1", section: "speak", level: 0, kind: "speak", prompt: "Say this out loud", phrase: "Me llamo Maddie y tengo doce años.", meaning: "My name is Maddie and I am twelve." },
  { id: "es-speak-a2", section: "speak", level: 1, kind: "speak", prompt: "Answer out loud", phrase: "¿Qué te gusta hacer?", meaning: "What do you like doing?" },
  { id: "es-listen-a1", section: "listen", level: 0, kind: "listen", prompt: "Listen. What did Panda say?", audio: "Tengo dos hermanos.", options: ["I have two sisters", "I have two brothers", "I am two years old", "I like my brother"], answer: 1 },
  { id: "es-listen-a2", section: "listen", level: 1, kind: "listen", prompt: "Listen. Where are they going?", audio: "Vamos a la biblioteca después del colegio.", options: ["the library", "the park", "home", "the station"], answer: 0 },
  { id: "es-watch-a1", section: "watch", level: 0, kind: "read", prompt: "Read, then answer", passage: "Lucía va al parque con su perro. Hace sol.", question: "What is the weather like?", options: ["Rainy", "Sunny", "Snowy", "Windy"], answer: 1 },
  { id: "es-watch-b1", section: "watch", level: 2, kind: "read", prompt: "Read, then answer", passage: "Aunque llueve, Lucas decide salir porque tiene que comprar pan.", question: "Why does Lucas go out?", options: ["To exercise", "To buy bread", "To meet a friend", "To walk the dog"], answer: 1 }
];

const LISTENING = {
  fr: {
    id: "fr-bookshop-1", title: "À la librairie", topic: "Hésiter, ne pas savoir", duration: "1:24",
    lines: [["Vendeuse", "Bonjour, je peux vous aider ?"], ["Maddie", "Oui, je cherche un cadeau pour mon frère."], ["Vendeuse", "Qu’est-ce qu’il aime ?"], ["Maddie", "Il aime le foot, mais je ne sais pas quel livre choisir."], ["Vendeuse", "Cette BD est très populaire."], ["Maddie", "D’accord, je vais prendre la BD."]],
    grammar: [["quel / quelle", "which"], ["je vais prendre", "I’m going to take"]], vocab: [["un cadeau", "a present"], ["une librairie", "a bookshop"], ["une BD", "a comic"]], phrases: [["Je ne sais pas.", "I don’t know."], ["Je ne suis pas sûre.", "I’m not sure."]],
    tabs: ["Dialogue", "Grammaire", "Vocabulaire", "Manières de dire"],
    acts: [
      { kind: "tf", title: "Compréhension", instruction: "Vrai ou faux ?", items: [["Maddie cherche un cadeau pour son frère.", true], ["Son frère n’aime pas le foot.", false], ["Maddie choisit une BD.", true]] },
      { kind: "transform", title: "Grammaire", instruction: "Rewrite the question in the casual form.", items: [["Qu’est-ce qu’il aime ?", "Il aime quoi ?"], ["Qu’est-ce que tu cherches ?", "Tu cherches quoi ?"]] },
      { kind: "choose", title: "Vocabulaire et communication", instruction: "Choose the best answer.", items: [["Je cherche ___ pour mon frère.", ["un cadeau", "une question"], 0], ["Cette ___ est populaire.", ["BD", "porte"], 0]] },
      { kind: "respond", title: "Manières de dire", instruction: "Answer by saying you do not know.", items: [["Quel livre veux-tu ?", "Je ne sais pas."], ["Tu préfères lequel ?", "Je ne suis pas sûre."]] },
      { kind: "roleplay", title: "À vous !", instruction: "You are buying a present. Answer Panda, the shop assistant.", starter: "Bonjour ! Je peux vous aider ?" }
    ]
  },
  es: {
    id: "es-bookshop-1", title: "En la librería", topic: "Dudar, no saber", duration: "1:24",
    lines: [["Dependienta", "Hola, ¿te puedo ayudar?"], ["Maddie", "Sí, busco un regalo para mi hermano."], ["Dependienta", "¿Qué le gusta?"], ["Maddie", "Le gusta el fútbol, pero no sé qué libro elegir."], ["Dependienta", "Este cómic es muy popular."], ["Maddie", "Vale, voy a llevarme el cómic."]],
    grammar: [["qué", "what / which"], ["voy a llevarme", "I’m going to take"]], vocab: [["un regalo", "a present"], ["una librería", "a bookshop"], ["un cómic", "a comic"]], phrases: [["No lo sé.", "I don’t know."], ["No estoy segura.", "I’m not sure."]],
    tabs: ["Diálogo", "Gramática", "Vocabulario", "Maneras de decir"],
    acts: [
      { kind: "tf", title: "Comprensión", instruction: "¿Verdadero o falso?", items: [["Maddie busca un regalo para su hermano.", true], ["A su hermano no le gusta el fútbol.", false], ["Maddie elige un cómic.", true]] },
      { kind: "transform", title: "Gramática", instruction: "Rewrite the question in the casual form.", items: [["¿Qué le gusta?", "¿Le gusta qué?"], ["¿Qué buscas?", "¿Buscas qué?"]] },
      { kind: "choose", title: "Vocabulario y comunicación", instruction: "Choose the best answer.", items: [["Busco ___ para mi hermano.", ["un regalo", "una pregunta"], 0], ["Este ___ es popular.", ["cómic", "puerta"], 0]] },
      { kind: "respond", title: "Maneras de decir", instruction: "Answer by saying you do not know.", items: [["¿Qué libro quieres?", "No lo sé."], ["¿Cuál prefieres?", "No estoy segura."]] },
      { kind: "roleplay", title: "¡Te toca!", instruction: "You are buying a present. Answer Panda, the shop assistant.", starter: "¡Hola! ¿Te puedo ayudar?" }
    ]
  }
};

export const LANGUAGE_CONTENT = {
  fr: {
    id: "fr", name: "French", native: "Français", flag: "🇫🇷", locale: "fr-FR", hello: "Bonjour", placement: FR_PLACEMENT,
    verbs: FR_VERBS, scenes: FR_SCENES, topics: SHARED_TOPICS.fr,
    grammar: [
      { level: "A1", topic: "Le, la, les — ‘the’", rule: "French nouns are masculine or feminine. Use le for masculine, la for feminine and les for plural.", examples: [["le chien", "the dog"], ["la table", "the table"], ["les livres", "the books"]], check: { noun: "fenêtre", en: "window", options: ["le", "la", "les"], answer: 1 } },
      { level: "A2", topic: "À, au, à la, aux", rule: "Use à with places; à + le becomes au and à + les becomes aux.", examples: [["au parc", "to the park"], ["à la plage", "to the beach"], ["aux magasins", "to the shops"]], check: { noun: "___ cinéma", en: "to the cinema", options: ["au", "à la", "aux"], answer: 0 } },
      { level: "B1", topic: "Depuis, pendant, il y a", rule: "Depuis continues into the present, pendant gives a duration, and il y a marks how long ago.", examples: [["depuis lundi", "since Monday"], ["pendant une heure", "for one hour"], ["il y a deux jours", "two days ago"]], check: { noun: "J’habite ici ___ trois ans.", en: "I have lived here for three years.", options: ["depuis", "pendant", "il y a"], answer: 0 } }
    ],
    speaking: { phrase: "Où est la bibliothèque ?", en: "Where is the library?", tip: "Keep the final -que short: bib-lee-oh-tek.", picturePrompt: "Décris l’image", pictureHints: ["la plage", "le soleil", "le chien", "la famille"], chat: [["panda", "Salut ! Qu’est-ce que tu as fait ce week-end ?", "Hi! What did you do this weekend?"], ["me", "Je suis allée au parc avec ma sœur.", "I went to the park with my sister."]] },
    listening: LISTENING.fr,
    episode: { id: "fr-official-compilation-1", videoId: "CtLYeZP7GBk", channelVideoId: "CtLYeZP7GBk", title: "Compilation 1 · premier extrait", en: "Official compilation · first clip", length: "5-minute lesson clip", season: "Chaîne officielle", clipStart: 0, clipEnd: 305, captionsAvailable: false, captionLanguage: "fr" },
    episodeQs: [
      { type: "Multiple choice", q: "Qui est le petit frère de Peppa ?", en: "Who is Peppa’s little brother?", options: ["George", "Pedro", "Danny", "Edmond"], answer: 0 },
      { type: "Pick the word", q: "Quel mot signifie ‘family’ ?", en: "Which word means ‘family’?", options: ["famille", "maison", "école", "voiture"], answer: 0 },
      { type: "Pick the word", q: "Quel mot signifie ‘pig’ ?", en: "Which word means ‘pig’?", options: ["chien", "chat", "cochon", "lapin"], answer: 2 },
      { type: "Pick the phrase", q: "Comment dit-on ‘I am watching Peppa’ ?", en: "How do you say ‘I am watching Peppa’?", options: ["Je regarde Peppa", "J’écoute Peppa", "Je cherche Peppa", "J’appelle Peppa"], answer: 0 },
      { type: "Multiple choice", q: "Que veut dire ‘J’aime cette histoire’ ?", en: "What does ‘J’aime cette histoire’ mean?", options: ["I like this story", "I know this story", "I write this story", "I forget this story"], answer: 0 }
    ]
  },
  es: {
    id: "es", name: "Spanish", native: "Español", flag: "🇪🇸", locale: "es-ES", hello: "¡Hola!", placement: ES_PLACEMENT,
    verbs: ES_VERBS, scenes: ES_SCENES, topics: SHARED_TOPICS.es,
    grammar: [
      { level: "A1", topic: "El, la, los, las — ‘the’", rule: "Spanish nouns are masculine or feminine. Use el or los for masculine and la or las for feminine.", examples: [["el perro", "the dog"], ["la mesa", "the table"], ["los libros", "the books"]], check: { noun: "ventana", en: "window", options: ["el", "la", "los"], answer: 1 } },
      { level: "A2", topic: "A, al and a la", rule: "Use a with places; a + el becomes al, while a la stays separate.", examples: [["al parque", "to the park"], ["a la playa", "to the beach"], ["a Madrid", "to Madrid"]], check: { noun: "___ cine", en: "to the cinema", options: ["al", "a la", "del"], answer: 0 } },
      { level: "B1", topic: "Por and para", rule: "Por often explains a cause, route or exchange; para often gives a purpose, recipient or deadline.", examples: [["por la ciudad", "through the city"], ["para mi amiga", "for my friend"], ["para mañana", "for tomorrow"]], check: { noun: "Este regalo es ___ ti.", en: "This present is for you.", options: ["por", "para", "de"], answer: 1 } }
    ],
    speaking: { phrase: "¿Dónde está la biblioteca?", en: "Where is the library?", tip: "Stress está at the end: es-TAH.", picturePrompt: "Describe la imagen", pictureHints: ["la playa", "el sol", "el perro", "la familia"], chat: [["panda", "¡Hola! ¿Qué hiciste el fin de semana?", "Hi! What did you do this weekend?"], ["me", "Fui al parque con mi hermana.", "I went to the park with my sister."]] },
    listening: LISTENING.es,
    episode: { id: "es-official-transport", videoId: "Ybk3o_7oWIA", channelVideoId: "Ybk3o_7oWIA", title: "Trenes, aviones y coches · primer extracto", en: "Trains, planes and cars · first clip", length: "5-minute lesson clip", season: "Canal oficial", clipStart: 0, clipEnd: 305, captionsAvailable: false, captionLanguage: "es" },
    episodeQs: [
      { type: "Multiple choice", q: "¿Qué transportes aparecen en el título?", en: "Which kinds of transport are in the title?", options: ["Trenes, aviones y coches", "Barcos, bicis y motos", "Autobuses y taxis", "Cohetes y barcos"], answer: 0 },
      { type: "Pick the word", q: "¿Qué palabra significa ‘train’?", en: "Which word means ‘train’?", options: ["tren", "avión", "coche", "barco"], answer: 0 },
      { type: "Pick the word", q: "¿Qué palabra significa ‘plane’?", en: "Which word means ‘plane’?", options: ["coche", "tren", "avión", "bici"], answer: 2 },
      { type: "Pick the word", q: "¿Qué palabra significa ‘car’?", en: "Which word means ‘car’?", options: ["barco", "coche", "tren", "avión"], answer: 1 },
      { type: "Multiple choice", q: "¿Cómo dices ‘I travel by train’?", en: "How do you say ‘I travel by train’?", options: ["Viajo en tren", "Vuelo en coche", "Camino en avión", "Nado en tren"], answer: 0 }
    ]
  }
};
