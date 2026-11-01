// Begriffe für „Zeig’s!“ – je Schwierigkeit (1 = leicht, 2 = mittel, 3 = schwer) und Kategorie.
// Jeder Begriff soll sich erklären, zeichnen und vormachen lassen.
const ZEIGS_ROH = {
  1: {
    'Alltag': 'Zahnbürste, Regenschirm, Brille, Schlüssel, Kerze, Wecker, Spiegel, Kissen, Handy, Fernseher, Tasse, Gabel, Schere, Lampe, Stuhl, Tür, Fenster, Treppe, Bett, Uhr, Rucksack, Koffer, Ball, Buch, Stift',
    'Tiere': 'Hund, Katze, Elefant, Giraffe, Schlange, Fisch, Vogel, Pferd, Kuh, Schwein, Hase, Maus, Affe, Löwe, Biene, Spinne, Frosch, Ente, Pinguin, Schnecke',
    'Essen & Trinken': 'Pizza, Banane, Apfel, Eis, Brot, Ei, Käse, Bier, Kaffee, Kuchen, Wurst, Nudeln, Pommes, Erdbeere, Karotte, Zitrone, Burger, Brezel, Popcorn, Suppe',
    'Tätigkeiten': 'Schlafen, Laufen, Schwimmen, Tanzen, Singen, Kochen, Lesen, Weinen, Lachen, Gähnen, Niesen, Telefonieren, Klatschen, Springen, Winken, Fahrrad fahren, Zähne putzen, Duschen, Malen, Angeln',
    'Natur & Orte': 'Sonne, Mond, Stern, Baum, Blume, Berg, Haus, Auto, Zug, Flugzeug, Schiff, Regen, Schnee, Wolke, Strand, Insel, Brücke, Burg, Kirche, Zelt',
  },
  2: {
    'Alltag': 'Staubsauger, Waschmaschine, Bügeleisen, Fernbedienung, Taschenlampe, Kühlschrank, Toaster, Briefkasten, Mülleimer, Rasierer, Föhn, Kopfhörer, Kalender, Geldbeutel, Pflaster, Zahnseide, Wäscheklammer, Thermometer, Sonnenbrille, Feuerzeug',
    'Tiere': 'Känguru, Krokodil, Eichhörnchen, Fledermaus, Papagei, Delfin, Hai, Igel, Eule, Tintenfisch, Flamingo, Schildkröte, Krake, Faultier, Chamäleon, Wal, Storch, Lama, Biber, Kakerlake',
    'Berufe': 'Feuerwehrmann, Pilot, Zahnarzt, Friseur, Koch, Polizist, Schiedsrichter, Bauarbeiter, Lehrer, Kellner, Zauberer, Astronaut, Fotograf, DJ, Postbote, Gärtner, Detektiv, Tierarzt, Clown, Dirigent',
    'Sport & Spiel': 'Fußball, Tennis, Boxen, Golf, Skifahren, Surfen, Bowling, Basketball, Darts, Schach, Yoga, Klettern, Reiten, Eishockey, Tischtennis, Volleyball, Gewichtheben, Marathon, Fallschirmspringen, Seilspringen',
    'Freizeit': 'Grillen, Zelten, Karaoke, Picknick, Achterbahn, Fotobox, Lagerfeuer, Wandern, Minigolf, Kino, Zoo, Freizeitpark, Sauna, Flohmarkt, Konzert, Festival, Schneeballschlacht, Sandburg, Drachen steigen lassen, Kreuzworträtsel',
  },
  3: {
    'Begriffe': 'Eifersucht, Heimweh, Langeweile, Lampenfieber, Ohrwurm, Gänsehaut, Muskelkater, Kater, Schluckauf, Déjà-vu, Zeitumstellung, Glück, Stau, Funkloch, Mondfinsternis, Echo, Schatten, Gewissen, Fernweh, Jetlag',
    'Redewendungen': 'Tomaten auf den Augen, Den Nagel auf den Kopf treffen, Ins Fettnäpfchen treten, Die Katze im Sack kaufen, Auf den Arm nehmen, Kalte Füße bekommen, Ein Auge zudrücken, Das Eis brechen, Den Kopf in den Sand stecken, Mit dem Feuer spielen, Einen Kater haben, Auf Wolke sieben schweben, Das Handtuch werfen, Zwei Fliegen mit einer Klappe, Jemandem die Daumen drücken',
    'Situationen': 'Elfmeterschießen, Erster Schultag, Zahnarztbesuch, Heiratsantrag, Führerscheinprüfung, Blind Date, Umzug, Stromausfall, Verschlafen, Schlüssel verloren, Platten Reifen, Hochzeitstanz, Polonaise, Weihnachtsbaum schmücken, Flugzeug verpasst, Selfie mit Promi, Bewerbungsgespräch, Kater am Sonntag, Elternabend, Geburt',
    'Film & Musik': 'Titanic, Harry Potter, Star Wars, James Bond, König der Löwen, Schneewittchen, Rotkäppchen, Dornröschen, Superman, Spider-Man, Frankenstein, Dracula, Pinocchio, Tarzan, Robin Hood, Batman, Aschenputtel, Hänsel und Gretel, Die Eiskönigin, Der Pate',
    'Dinge': 'Rolltreppe, Fahrstuhl, Heißluftballon, Leuchtturm, Windmühle, Sanduhr, Kompass, Fallschirm, Teleskop, Hängematte, Wasserfall, Vulkan, Pyramide, Eiffelturm, Freiheitsstatue, Schaukelstuhl, Kuckucksuhr, Gartenzwerg, Jojo, Zauberwürfel',
  },
};
const ZEIGS = Object.entries(ZEIGS_ROH).flatMap(([s, cats]) =>
  Object.entries(cats).flatMap(([k, list]) => list.split(',').map((w) => ({ s: Number(s), k, w: w.trim() })).filter((x) => x.w)));
