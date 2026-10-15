export const CURRICULUM_LEVELS = ["A1", "A2", "B1"];
export const CURRICULUM_UNITS_PER_LEVEL = 24;

const THEMES = {
  fr: [
    ["Faire connaissance", "au club", "Bonjour, je m’appelle Lina.", "Moi, c’est Noé. Enchanté !", ["bonjour", "s’appeler", "enchanté"], "Présente-toi en deux phrases."],
    ["Dans la classe", "en classe", "Tu as un stylo ?", "Oui, voilà un stylo bleu.", ["un stylo", "un cahier", "la classe"], "Demande un objet puis remercie."],
    ["Ma famille", "à la maison", "Tu as des frères et sœurs ?", "Oui, j’ai une sœur et un frère.", ["la famille", "une sœur", "un frère"], "Décris deux personnes de ta famille."],
    ["Chez moi", "dans l’appartement", "Où est ta chambre ?", "Elle est à côté de la cuisine.", ["une chambre", "la cuisine", "à côté de"], "Décris deux pièces de chez toi."],
    ["Ma journée", "avant l’école", "À quelle heure tu te lèves ?", "Je me lève à sept heures.", ["se lever", "déjeuner", "se coucher"], "Raconte trois moments de ta journée."],
    ["Heure et rendez-vous", "devant la bibliothèque", "On se retrouve à quelle heure ?", "À quatre heures et demie.", ["l’heure", "un rendez-vous", "être en retard"], "Propose une heure de rendez-vous."],
    ["Au café", "à la terrasse", "Qu’est-ce que vous prenez ?", "Je voudrais un jus et un croissant.", ["je voudrais", "un jus", "l’addition"], "Commande une boisson et quelque chose à manger."],
    ["Faire les courses", "au marché", "Combien coûtent les pommes ?", "Elles coûtent trois euros le kilo.", ["combien", "un kilo", "coûter"], "Demande le prix et la quantité."],
    ["Dans le quartier", "près de la mairie", "Où est la pharmacie ?", "Continuez tout droit, puis tournez à gauche.", ["tout droit", "à gauche", "la pharmacie"], "Demande puis explique un itinéraire."],
    ["Prendre les transports", "à la gare", "Quel train va au centre-ville ?", "Le train de dix heures, voie deux.", ["un billet", "la voie", "le train"], "Achète un billet et vérifie la voie."],
    ["Quel temps fait-il ?", "devant la fenêtre", "Quel temps fait-il aujourd’hui ?", "Il fait frais et il va pleuvoir.", ["il fait beau", "pleuvoir", "un nuage"], "Donne la météo et conseille un vêtement."],
    ["Choisir des vêtements", "dans un magasin", "Je peux essayer cette veste ?", "Bien sûr. La cabine est à droite.", ["une veste", "essayer", "la cabine"], "Demande une taille et essaie un vêtement."],
    ["Santé et corps", "à la pharmacie", "Qu’est-ce qui ne va pas ?", "J’ai mal à la tête depuis ce matin.", ["avoir mal", "la tête", "se reposer"], "Explique un symptôme et demande conseil."],
    ["Loisirs", "après l’école", "Qu’est-ce que tu fais pendant ton temps libre ?", "Je lis et je joue de la guitare.", ["lire", "jouer de", "le temps libre"], "Parle de deux loisirs et de leur fréquence."],
    ["Faire du sport", "au centre sportif", "Tu veux jouer au tennis samedi ?", "Oui, avec plaisir. À quelle heure ?", ["faire du sport", "un match", "avec plaisir"], "Invite quelqu’un à faire du sport."],
    ["Études et travail", "au bureau", "Tu travailles sur quoi aujourd’hui ?", "Je prépare une présentation importante.", ["travailler", "préparer", "une réunion"], "Explique une tâche et une priorité."],
    ["À la librairie", "dans une librairie", "Je cherche un cadeau pour mon frère.", "Cette bande dessinée est très populaire.", ["un cadeau", "une librairie", "une BD"], "Demande conseil avant de choisir un cadeau."],
    ["Animaux", "au parc", "Comment s’appelle ton chien ?", "Il s’appelle Oslo et il adore courir.", ["un animal", "courir", "s’occuper de"], "Décris un animal et ses habitudes."],
    ["Vacances", "à l’office de tourisme", "Qu’est-ce qu’on peut visiter ici ?", "Le château est ouvert jusqu’à six heures.", ["visiter", "un château", "être ouvert"], "Demande une activité pour les vacances."],
    ["Inviter quelqu’un", "au téléphone", "Tu veux venir dîner vendredi ?", "Oui, merci ! Je peux apporter un dessert.", ["inviter", "venir", "apporter"], "Fais une invitation et réponds poliment."],
    ["Décrire une personne", "devant une photo", "Elle est comment, ton amie ?", "Elle est brune, drôle et très sportive.", ["brun", "drôle", "sportif"], "Décris l’apparence et le caractère d’une personne."],
    ["Projets du week-end", "à la sortie de l’école", "Qu’est-ce que tu vas faire ce week-end ?", "Je vais voir mes cousins à la campagne.", ["le week-end", "aller voir", "la campagne"], "Présente un projet et demande celui d’un ami."],
    ["Donner son avis", "après un film", "Tu as aimé le film ?", "Oui, surtout la fin, mais il était un peu long.", ["à mon avis", "surtout", "pourtant"], "Donne un avis avec une raison et une réserve."],
    ["Bilan et défi", "au café des langues", "Qu’est-ce que tu sais mieux faire maintenant ?", "Je peux raconter, expliquer et demander des précisions.", ["progresser", "expliquer", "demander des précisions"], "Fais le bilan du niveau dans un mini-dialogue."],
  ],
  es: [
    ["Conocernos", "en el club", "Hola, me llamo Lina.", "Yo soy Noé. ¡Encantado!", ["hola", "llamarse", "encantado"], "Preséntate con dos frases."],
    ["En clase", "en clase", "¿Tienes un bolígrafo?", "Sí, aquí tienes uno azul.", ["un bolígrafo", "un cuaderno", "la clase"], "Pide un objeto y da las gracias."],
    ["Mi familia", "en casa", "¿Tienes hermanos?", "Sí, tengo una hermana y un hermano.", ["la familia", "una hermana", "un hermano"], "Describe a dos personas de tu familia."],
    ["Mi casa", "en el piso", "¿Dónde está tu habitación?", "Está al lado de la cocina.", ["una habitación", "la cocina", "al lado de"], "Describe dos habitaciones de tu casa."],
    ["Mi día", "antes del colegio", "¿A qué hora te levantas?", "Me levanto a las siete.", ["levantarse", "comer", "acostarse"], "Cuenta tres momentos de tu día."],
    ["Hora y citas", "delante de la biblioteca", "¿A qué hora quedamos?", "A las cuatro y media.", ["la hora", "una cita", "llegar tarde"], "Propón una hora para quedar."],
    ["En la cafetería", "en la terraza", "¿Qué va a tomar?", "Quisiera un zumo y un cruasán.", ["quisiera", "un zumo", "la cuenta"], "Pide una bebida y algo para comer."],
    ["Hacer la compra", "en el mercado", "¿Cuánto cuestan las manzanas?", "Cuestan tres euros el kilo.", ["cuánto", "un kilo", "costar"], "Pregunta el precio y la cantidad."],
    ["En el barrio", "cerca del ayuntamiento", "¿Dónde está la farmacia?", "Siga recto y gire a la izquierda.", ["todo recto", "a la izquierda", "la farmacia"], "Pregunta y explica una ruta."],
    ["Usar el transporte", "en la estación", "¿Qué tren va al centro?", "El tren de las diez, vía dos.", ["un billete", "la vía", "el tren"], "Compra un billete y comprueba la vía."],
    ["El tiempo", "junto a la ventana", "¿Qué tiempo hace hoy?", "Hace fresco y va a llover.", ["hace sol", "llover", "una nube"], "Da el tiempo y aconseja una prenda."],
    ["Elegir ropa", "en una tienda", "¿Puedo probarme esta chaqueta?", "Claro. El probador está a la derecha.", ["una chaqueta", "probarse", "el probador"], "Pide una talla y pruébate una prenda."],
    ["Salud y cuerpo", "en la farmacia", "¿Qué te pasa?", "Me duele la cabeza desde esta mañana.", ["doler", "la cabeza", "descansar"], "Explica un síntoma y pide consejo."],
    ["Tiempo libre", "después del colegio", "¿Qué haces en tu tiempo libre?", "Leo y toco la guitarra.", ["leer", "tocar", "el tiempo libre"], "Habla de dos aficiones y su frecuencia."],
    ["Hacer deporte", "en el polideportivo", "¿Quieres jugar al tenis el sábado?", "Sí, encantado. ¿A qué hora?", ["hacer deporte", "un partido", "encantado"], "Invita a alguien a hacer deporte."],
    ["Estudios y trabajo", "en la oficina", "¿En qué trabajas hoy?", "Preparo una presentación importante.", ["trabajar", "preparar", "una reunión"], "Explica una tarea y una prioridad."],
    ["En la librería", "en una librería", "Busco un regalo para mi hermano.", "Este cómic es muy popular.", ["un regalo", "una librería", "un cómic"], "Pide consejo antes de elegir un regalo."],
    ["Animales", "en el parque", "¿Cómo se llama tu perro?", "Se llama Oslo y le encanta correr.", ["un animal", "correr", "cuidar de"], "Describe un animal y sus hábitos."],
    ["Vacaciones", "en turismo", "¿Qué podemos visitar aquí?", "El castillo está abierto hasta las seis.", ["visitar", "un castillo", "estar abierto"], "Pregunta por una actividad de vacaciones."],
    ["Invitar", "por teléfono", "¿Quieres venir a cenar el viernes?", "Sí, gracias. Puedo llevar un postre.", ["invitar", "venir", "llevar"], "Haz una invitación y responde con cortesía."],
    ["Describir a alguien", "delante de una foto", "¿Cómo es tu amiga?", "Es morena, divertida y muy deportista.", ["moreno", "divertido", "deportista"], "Describe el aspecto y el carácter de alguien."],
    ["Planes de fin de semana", "a la salida del colegio", "¿Qué vas a hacer este fin de semana?", "Voy a ver a mis primos en el campo.", ["el fin de semana", "ir a ver", "el campo"], "Presenta un plan y pregunta el de un amigo."],
    ["Dar una opinión", "después de una película", "¿Te gustó la película?", "Sí, sobre todo el final, pero fue un poco larga.", ["en mi opinión", "sobre todo", "sin embargo"], "Da una opinión con una razón y una reserva."],
    ["Repaso y reto", "en el café de idiomas", "¿Qué sabes hacer mejor ahora?", "Puedo narrar, explicar y pedir aclaraciones.", ["mejorar", "explicar", "pedir aclaraciones"], "Resume el nivel en un minidiálogo."],
  ]
};

const GRAMMAR = {
  fr: {
    A1: [
      ["Articles et genre", "Use le, la, l’ and les with known nouns.", ["le marché", "la gare", "l’école"], ["___ gare", ["le", "la", "les"], 1]],
      ["Être et avoir", "Use être for identity or description and avoir for possession or age.", ["Je suis prête.", "J’ai douze ans.", "Nous avons un billet."], ["Nous ___ un billet.", ["sommes", "avons", "allons"], 1]],
      ["Questions simples", "Raise your voice or use est-ce que to ask a clear question.", ["Tu viens ?", "Est-ce que tu viens ?", "Où habites-tu ?"], ["___ tu habites ?", ["Où", "Quand", "Combien"], 0]],
      ["Présent régulier", "Remove the infinitive ending and add the present ending that matches the subject.", ["je parle", "nous finissons", "ils attendent"], ["Nous ___ français.", ["parle", "parlons", "parlez"], 1]],
      ["Négation", "Put ne before the verb and pas after it.", ["Je ne sais pas.", "Il n’aime pas.", "Nous ne venons pas."], ["Je ___ comprends ___.", ["ne / pas", "pas / ne", "n’ / plus"], 0]],
      ["Adjectifs", "Most adjectives agree in gender and number with the noun.", ["un sac noir", "une veste noire", "des sacs noirs"], ["une amie ___", ["sportif", "sportive", "sportifs"], 1]],
      ["Il y a et c’est", "Use il y a to say something exists and c’est to identify it.", ["Il y a un café.", "C’est la mairie.", "Il y a deux chambres."], ["___ une pharmacie ici.", ["C’est", "Il y a", "Elle est"], 1]],
      ["Aller + lieu", "Use à with a place; à + le becomes au and à + les becomes aux.", ["au parc", "à la plage", "aux magasins"], ["Je vais ___ cinéma.", ["au", "à la", "aux"], 0]],
    ],
    A2: [
      ["Passé composé", "Use avoir or être plus a past participle for a completed past event.", ["J’ai réservé.", "Elle est arrivée.", "Nous avons choisi."], ["Hier, nous ___ un billet.", ["avons acheté", "achetions", "achèterons"], 0]],
      ["Imparfait", "Use the imperfect for background, descriptions and repeated past habits.", ["Il faisait beau.", "J’allais au marché.", "Nous habitions ici."], ["Quand j’étais petit, je ___ ici.", ["jouais", "ai joué", "jouerai"], 0]],
      ["Pronoms objets", "Replace a repeated person or thing with le, la, les, lui or leur.", ["Je le prends.", "Je lui parle.", "Je les connais."], ["Cette veste ? Je ___ prends.", ["la", "lui", "leur"], 0]],
      ["Comparatifs", "Use plus, moins or aussi with an adjective, followed by que.", ["plus grand que", "moins cher que", "aussi pratique que"], ["Le train est ___ rapide que le bus.", ["plus", "très", "beaucoup"], 0]],
      ["Futur proche", "Use aller in the present plus an infinitive for a planned near future.", ["Je vais partir.", "On va dîner.", "Ils vont venir."], ["Nous ___ visiter le château.", ["allons", "avons", "sommes"], 0]],
      ["Quantités", "Use de after most quantity expressions.", ["beaucoup de temps", "un kilo de pommes", "assez d’eau"], ["un peu ___ sucre", ["de", "du", "le"], 0]],
      ["Conseils et obligation", "Use il faut, devoir or the imperative to advise and instruct.", ["Il faut attendre.", "Vous devez partir.", "Prenez ce sirop."], ["Tu ___ te reposer.", ["dois", "es", "vas de"], 0]],
      ["Qui, que, où", "Use a relative pronoun to join information without repeating the noun.", ["le livre que je lis", "la personne qui parle", "la ville où j’habite"], ["C’est le café ___ nous allons.", ["où", "qui", "que"], 0]],
    ],
    B1: [
      ["Depuis, pendant, il y a", "Depuis continues to now, pendant gives a finished duration, and il y a says how long ago.", ["depuis lundi", "pendant une heure", "il y a deux jours"], ["J’habite ici ___ trois ans.", ["depuis", "pendant", "il y a"], 0]],
      ["Futur simple", "Use the future stem and future endings for predictions and firmer plans.", ["je partirai", "nous verrons", "il faudra"], ["Demain, nous ___ la réponse.", ["saurons", "savons", "savions"], 0]],
      ["Conditionnel", "Use the conditional for hypotheses and polite requests.", ["je voudrais", "on pourrait", "ce serait"], ["Vous ___ m’aider ?", ["pourriez", "pouvez hier", "aidiez demain"], 0]],
      ["Cause et conséquence", "Connect ideas with parce que, puisque, donc and c’est pourquoi.", ["parce qu’il pleut", "donc je reste", "c’est pourquoi je refuse"], ["Il pleut, ___ je prends un parapluie.", ["donc", "pourtant", "si"], 0]],
      ["Opposition", "Use mais, pourtant, alors que or même si to contrast ideas.", ["pourtant il vient", "alors que je pars", "même s’il pleut"], ["___ il est tard, elle continue.", ["Même s’", "Parce qu’", "Donc"], 0]],
      ["Pronoms y et en", "Use y for a place or à + thing; use en for de + thing or a quantity.", ["J’y vais.", "J’en parle.", "J’en prends deux."], ["Tu vas au marché ? Oui, j’___ vais.", ["y", "en", "le"], 0]],
      ["Discours rapporté", "Report words with dire que, demander si and a shifted point of view.", ["Elle dit qu’elle vient.", "Il demande si tu peux.", "Ils expliquent leur choix."], ["Il demande ___ nous sommes prêts.", ["si", "que", "où que"], 0]],
      ["Subjonctif utile", "Use the subjunctive after common expressions of necessity, wish and feeling.", ["Il faut que tu viennes.", "Je veux qu’il fasse.", "Je suis ravie que vous soyez là."], ["Il faut que nous ___.", ["partions", "partons", "partirons"], 0]],
    ]
  },
  es: {
    A1: [
      ["Artículos y género", "Use el, la, los and las with known nouns.", ["el mercado", "la estación", "los libros"], ["___ estación", ["el", "la", "los"], 1]],
      ["Ser y tener", "Use ser for identity or description and tener for possession or age.", ["Soy estudiante.", "Tengo doce años.", "Tenemos un billete."], ["Nosotros ___ un billete.", ["somos", "tenemos", "vamos"], 1]],
      ["Preguntas sencillas", "Use an interrogative word and question marks to ask clearly.", ["¿Dónde vives?", "¿Qué quieres?", "¿Cuánto cuesta?"], ["¿___ vives?", ["Dónde", "Cuándo", "Cuánto"], 0]],
      ["Presente regular", "Remove the infinitive ending and add the present ending for the subject.", ["yo hablo", "nosotros comemos", "ellos viven"], ["Nosotros ___ español.", ["hablo", "hablamos", "habláis"], 1]],
      ["Negación", "Put no immediately before the conjugated verb.", ["No lo sé.", "No le gusta.", "No venimos."], ["Yo ___ comprendo.", ["no", "nunca de", "nada a"], 0]],
      ["Adjetivos", "Adjectives usually agree in gender and number with the noun.", ["un bolso negro", "una chaqueta negra", "unos bolsos negros"], ["una amiga ___", ["deportivo", "deportiva", "deportivos"], 1]],
      ["Hay y es", "Use hay to say something exists and es to identify it.", ["Hay un café.", "Es el ayuntamiento.", "Hay dos habitaciones."], ["___ una farmacia aquí.", ["Es", "Hay", "Está de"], 1]],
      ["Ir a un lugar", "Use a before a destination; a + el becomes al.", ["al parque", "a la playa", "a Madrid"], ["Voy ___ cine.", ["al", "a la", "del"], 0]],
    ],
    A2: [
      ["Pretérito perfecto", "Use haber plus a participle for a completed event connected to now.", ["He reservado.", "Ha llegado.", "Hemos elegido."], ["Hoy ___ un billete.", ["hemos comprado", "comprábamos", "compraremos"], 0]],
      ["Pretérito indefinido", "Use the simple past for a completed event at a finished time.", ["Ayer fui.", "Llegó tarde.", "Compramos pan."], ["Anoche ellos ___.", ["salieron", "salían", "salen"], 0]],
      ["Imperfecto", "Use the imperfect for background, descriptions and repeated past habits.", ["Hacía sol.", "Iba al mercado.", "Vivíamos aquí."], ["De niño, yo ___ aquí.", ["jugaba", "jugué", "jugaré"], 0]],
      ["Pronombres de objeto", "Replace a repeated person or thing with lo, la, los, las, le or les.", ["Lo compro.", "Le hablo.", "Las conozco."], ["¿La chaqueta? ___ compro.", ["La", "Le", "Les"], 0]],
      ["Comparativos", "Use más, menos or tan with an adjective, followed by que or como.", ["más grande que", "menos caro que", "tan práctico como"], ["El tren es ___ rápido que el bus.", ["más", "muy", "mucho"], 0]],
      ["Ir a + infinitivo", "Use ir in the present plus a plus an infinitive for a planned near future.", ["Voy a salir.", "Vamos a cenar.", "Van a venir."], ["Nosotros ___ visitar el castillo.", ["vamos a", "tenemos", "somos"], 0]],
      ["Consejos y obligación", "Use hay que, tener que, deber or the imperative to advise and instruct.", ["Hay que esperar.", "Debes salir.", "Tome este jarabe."], ["Tú ___ descansar.", ["debes", "eres", "vas de"], 0]],
      ["Que, quien y donde", "Use a relative pronoun to join information without repeating the noun.", ["el libro que leo", "la persona que habla", "la ciudad donde vivo"], ["Es el café ___ vamos.", ["donde", "quien", "que persona"], 0]],
    ],
    B1: [
      ["Por y para", "Por often gives a cause, route or exchange; para gives a purpose, recipient or deadline.", ["por la ciudad", "para mi amiga", "para mañana"], ["Este regalo es ___ ti.", ["por", "para", "de"], 1]],
      ["Futuro simple", "Use the infinitive and future endings for predictions and firmer plans.", ["saldré", "veremos", "habrá"], ["Mañana ___ la respuesta.", ["sabremos", "sabemos", "sabíamos"], 0]],
      ["Condicional", "Use the conditional for hypotheses and polite requests.", ["quisiera", "podríamos", "sería"], ["¿___ ayudarme?", ["Podría", "Puede ayer", "Ayudaba mañana"], 0]],
      ["Causa y consecuencia", "Connect ideas with porque, como, así que and por eso.", ["porque llueve", "así que me quedo", "por eso digo que no"], ["Llueve, ___ llevo paraguas.", ["así que", "aunque", "si"], 0]],
      ["Contraste", "Use pero, sin embargo, aunque or mientras que to contrast ideas.", ["sin embargo viene", "mientras yo salgo", "aunque llueva"], ["___ es tarde, continúa.", ["Aunque", "Porque", "Así que"], 0]],
      ["Pronombres se y lo", "Use se before lo/la/los/las when both objects appear together.", ["Se lo doy.", "Se la explico.", "Se los enviamos."], ["El libro a Ana: ___ doy.", ["se lo", "le lo", "se le"], 0]],
      ["Estilo indirecto", "Report words with dice que, pregunta si and a shifted point of view.", ["Dice que viene.", "Pregunta si puedes.", "Explican su elección."], ["Pregunta ___ estamos listos.", ["si", "que", "donde que"], 0]],
      ["Subjuntivo útil", "Use the subjunctive after common expressions of necessity, wish and feeling.", ["Es necesario que vengas.", "Quiero que lo haga.", "Me alegra que estés aquí."], ["Es necesario que ___.", ["salgamos", "salimos", "saldremos"], 0]],
    ]
  }
};

const LEVEL_COPY = {
  fr: {
    A1: ["Learn the essential words and exchange short, accurate sentences.", "D’abord", "Puis"],
    A2: ["Handle the situation, add a reason and connect past or future information.", "Au début", "Ensuite"],
    B1: ["Explain a point of view, react naturally and add a useful qualification.", "D’une part", "Cependant"]
  },
  es: {
    A1: ["Learn the essential words and exchange short, accurate sentences.", "Primero", "Después"],
    A2: ["Handle the situation, add a reason and connect past or future information.", "Al principio", "Luego"],
    B1: ["Explain a point of view, react naturally and add a useful qualification.", "Por una parte", "Sin embargo"]
  }
};

function buildDialogue(lang, level, theme) {
  const [, setting, question, reply] = theme;
  const [, opener, connector] = LEVEL_COPY[lang][level];
  const panda = lang === "fr" ? "Panda" : "Panda";
  const learner = lang === "fr" ? "Lina" : "Lina";
  const closeQuestion = lang === "fr" ? "Tu peux préciser ?" : "¿Puedes explicar un poco más?";
  const closeReply = level === "A1"
    ? (lang === "fr" ? "Oui, bien sûr." : "Sí, claro.")
    : level === "A2"
      ? (lang === "fr" ? `${connector}, je vais vérifier les détails.` : `${connector}, voy a comprobar los detalles.`)
      : (lang === "fr" ? `${connector}, il faut aussi considérer les autres possibilités.` : `${connector}, también hay que considerar las otras posibilidades.`);
  return [[panda, `${opener}, ${setting}.`], [panda, question], [learner, reply], [panda, closeQuestion], [learner, closeReply], [panda, lang === "fr" ? "Parfait, on peut continuer." : "Perfecto, podemos continuar."]];
}

function buildListening(lang, level, index, theme) {
  const [title, , question, reply, words, prompt] = theme;
  const lines = buildDialogue(lang, level, theme);
  const grammar = GRAMMAR[lang][level][index % GRAMMAR[lang][level].length];
  const yes = lang === "fr" ? "Oui, bien sûr." : "Sí, claro.";
  const no = lang === "fr" ? "Non, pas du tout." : "No, para nada.";
  return {
    id: `${lang}-${level.toLowerCase()}-${String(index + 1).padStart(2, "0")}`,
    title,
    topic: LEVEL_COPY[lang][level][0],
    duration: "1:30",
    lines,
    grammar: [[grammar[0], grammar[1]], [grammar[2][0], "model example"]],
    vocab: words.map((word) => [word, "key expression for this situation"]),
    phrases: [[question, "useful question"], [reply, "model response"]],
    tabs: lang === "fr" ? ["Dialogue", "Grammaire", "Vocabulaire", "Manières de dire"] : ["Diálogo", "Gramática", "Vocabulario", "Maneras de decir"],
    acts: [
      { kind: "tf", title: lang === "fr" ? "Compréhension" : "Comprensión", instruction: lang === "fr" ? "Écoute puis choisis vrai ou faux." : "Escucha y elige verdadero o falso.", items: lang === "fr" ? [[`${lines[2][0]} répond à une question.`, true], [`${lines[0][0]} refuse de continuer.`, false], [`${lines[5][0]} termine positivement.`, true]] : [[`${lines[2][0]} responde a una pregunta.`, true], [`${lines[0][0]} se niega a continuar.`, false], [`${lines[5][0]} termina de forma positiva.`, true]] },
      { kind: "choose", title: lang === "fr" ? "Repérer les mots" : "Identificar palabras", instruction: "Choose the expression used in the dialogue.", items: [[question, [question, `${question} ...?`], 0], [reply, [reply, no], 0]] },
      { kind: "sequence", title: lang === "fr" ? "Remettre en ordre" : "Poner en orden", instruction: "Put the three moments in the order you heard them.", items: [[lines[1][1], lines[2][1], lines[4][1]]] },
      { kind: "respond", title: lang === "fr" ? "Réagir" : "Responder", instruction: "Write a natural response, then compare it with the model.", items: [[question, reply], [lang === "fr" ? "Tu peux préciser ?" : "¿Puedes explicar un poco más?", yes]] },
      { kind: "roleplay", title: lang === "fr" ? "À vous !" : "¡Te toca!", instruction: prompt, starter: question }
    ]
  };
}

export function getCurriculumUnit(lang, level, unitIndex) {
  const safeLang = lang === "es" ? "es" : "fr";
  const safeLevel = CURRICULUM_LEVELS.includes(level) ? level : "A1";
  const index = Math.max(0, Math.min(CURRICULUM_UNITS_PER_LEVEL - 1, Number(unitIndex) || 0));
  const theme = THEMES[safeLang][index];
  const grammar = GRAMMAR[safeLang][safeLevel][index % GRAMMAR[safeLang][safeLevel].length];
  const sourceCheck = grammar[3];
  const originalOptions = [...sourceCheck[1]];
  const rotatedOptions = [...originalOptions.slice(1), originalOptions[0]];
  const reversedOptions = [...originalOptions].reverse();
  const correctOption = originalOptions[sourceCheck[2]];
  const checks = [originalOptions, rotatedOptions, reversedOptions].map((options, attempt) => ({
    prompt: attempt ? `${sourceCheck[0]} · practice ${attempt + 1}` : sourceCheck[0],
    options,
    answer: options.indexOf(correctOption)
  }));
  return {
    id: `${safeLang}-${safeLevel.toLowerCase()}-${String(index + 1).padStart(2, "0")}`,
    number: index + 1,
    level: safeLevel,
    title: theme[0],
    situation: theme[1],
    objective: LEVEL_COPY[safeLang][safeLevel][0],
    words: theme[4],
    modelQuestion: theme[2],
    modelReply: theme[3],
    speakingPrompt: theme[5],
    dialogue: buildDialogue(safeLang, safeLevel, theme),
    grammar: { topic: grammar[0], rule: grammar[1], examples: grammar[2], checks },
    listening: buildListening(safeLang, safeLevel, index, theme)
  };
}

export function getCurriculumOverview(lang, level) {
  return Array.from({ length: CURRICULUM_UNITS_PER_LEVEL }, (_, index) => getCurriculumUnit(lang, level, index));
}
