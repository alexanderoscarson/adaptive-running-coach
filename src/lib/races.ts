export type Sport = 'running' | 'cycling' | 'xc_skiing' | 'swimming' | 'triathlon' | 'swimrun' | 'other';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Race {
  id: string;
  name: string;
  sport: Sport;
  country: string;
  month: number;
  distanceKm: number;
  klassiker: boolean;
  difficulty: Difficulty;
  description: string;
  descriptionSv: string;
}

export const SPORT_LABELS: Record<Sport, { en: string; sv: string }> = {
  running: { en: 'Running', sv: 'Löpning' },
  cycling: { en: 'Cycling', sv: 'Cykling' },
  xc_skiing: { en: 'Cross-country skiing', sv: 'Längdskidåkning' },
  swimming: { en: 'Swimming', sv: 'Simning' },
  triathlon: { en: 'Triathlon', sv: 'Triathlon' },
  swimrun: { en: 'Swimrun', sv: 'Swimrun' },
  other: { en: 'Other', sv: 'Annat' },
};

export const SPORT_EMOJI: Record<Sport, string> = {
  running: '🏃',
  cycling: '🚴',
  xc_skiing: '⛷️',
  swimming: '🏊',
  triathlon: '🏅',
  swimrun: '🌊',
  other: '🏋️',
};

export const RACES: Race[] = [
  // ===== SVENSK KLASSIKER =====
  { id: 'vasaloppet', name: 'Vasaloppet', sport: 'xc_skiing', country: 'Sweden', month: 3, distanceKm: 90, klassiker: true, difficulty: 'advanced', description: 'The world\'s oldest and longest cross-country ski race. 90km from Sälen to Mora.', descriptionSv: 'Världens äldsta och längsta längdskidlopp. 90 km från Sälen till Mora.' },
  { id: 'vatternrundan', name: 'Vätternrundan', sport: 'cycling', country: 'Sweden', month: 6, distanceKm: 300, klassiker: true, difficulty: 'advanced', description: 'Sweden\'s biggest cycling event. 300km around Lake Vättern.', descriptionSv: 'Sveriges största cykellopp. 300 km runt Vättern.' },
  { id: 'vansbrosimningen', name: 'Vansbrosimningen', sport: 'swimming', country: 'Sweden', month: 7, distanceKm: 1, klassiker: true, difficulty: 'intermediate', description: 'Open water swim in the Vanån river. 1km. Part of Svensk Klassiker.', descriptionSv: 'Simning i Vanån. 1 km. En del av Svensk Klassiker.' },
  { id: 'lidingoloppet', name: 'Lidingöloppet', sport: 'running', country: 'Sweden', month: 10, distanceKm: 30, klassiker: true, difficulty: 'advanced', description: 'Classic 30km cross-country race on Lidingö island outside Stockholm.', descriptionSv: 'Klassiskt 30 km terränglopp på Lidingö utanför Stockholm.' },

  // ===== VASALOPPET FAMILY =====
  { id: 'oppet-spar', name: 'Öppet Spår', sport: 'xc_skiing', country: 'Sweden', month: 3, distanceKm: 90, klassiker: false, difficulty: 'intermediate', description: 'Same track as Vasaloppet but at your own pace. No competition, pure experience.', descriptionSv: 'Samma spår som Vasaloppet men i din egen takt. Ingen tävling, ren upplevelse.' },
  { id: 'tjejvasan', name: 'Tjejvasan', sport: 'xc_skiing', country: 'Sweden', month: 2, distanceKm: 30, klassiker: false, difficulty: 'beginner', description: '30km ski race for women. From Oxberg to Mora.', descriptionSv: '30 km skidlopp för kvinnor. Från Oxberg till Mora.' },
  { id: 'stafettvasan', name: 'Stafettvasan', sport: 'xc_skiing', country: 'Sweden', month: 3, distanceKm: 90, klassiker: false, difficulty: 'intermediate', description: 'Relay race on the Vasaloppet track. 5 legs, 5 skiers.', descriptionSv: 'Stafettlopp på Vasaloppsspåret. 5 sträckor, 5 åkare.' },
  { id: 'halvvasan', name: 'Halvvasan', sport: 'xc_skiing', country: 'Sweden', month: 3, distanceKm: 45, klassiker: false, difficulty: 'intermediate', description: 'Half the Vasaloppet distance. Oxberg to Mora.', descriptionSv: 'Halva Vasaloppet. Oxberg till Mora.' },
  { id: 'cykelvasan', name: 'Cykelvasan', sport: 'cycling', country: 'Sweden', month: 8, distanceKm: 90, klassiker: false, difficulty: 'intermediate', description: 'Mountain bike race on the Vasaloppet track. Sälen to Mora.', descriptionSv: 'Mountainbikelopp på Vasaloppsspåret. Sälen till Mora.' },
  { id: 'ultravasan', name: 'Ultravasan', sport: 'running', country: 'Sweden', month: 8, distanceKm: 90, klassiker: false, difficulty: 'advanced', description: 'Ultra marathon on the Vasaloppet trail. 90km from Sälen to Mora.', descriptionSv: 'Ultramaraton på Vasaloppsspåret. 90 km från Sälen till Mora.' },
  { id: 'ultravasan-45', name: 'Ultravasan 45', sport: 'running', country: 'Sweden', month: 8, distanceKm: 45, klassiker: false, difficulty: 'intermediate', description: 'Half the Ultravasan distance. Oxberg to Mora.', descriptionSv: 'Halva Ultravasan. Oxberg till Mora.' },
  { id: 'engelbrektsloppet', name: 'Engelbrektsloppet', sport: 'xc_skiing', country: 'Sweden', month: 2, distanceKm: 60, klassiker: false, difficulty: 'intermediate', description: '60km ski race in Dalarna. One of the classics.', descriptionSv: '60 km skidlopp i Dalarna. En av klassikerna.' },

  // ===== SWEDISH RUNNING =====
  { id: 'goteborgsvarvet', name: 'Göteborgsvarvet', sport: 'running', country: 'Sweden', month: 5, distanceKm: 21.1, klassiker: false, difficulty: 'intermediate', description: 'World\'s largest half marathon. Through the streets of Gothenburg.', descriptionSv: 'Världens största halvmaraton. Genom Göteborgs gator.' },
  { id: 'stockholm-marathon', name: 'Stockholm Marathon', sport: 'running', country: 'Sweden', month: 6, distanceKm: 42.2, klassiker: false, difficulty: 'advanced', description: 'One of the world\'s most beautiful city marathons. Finish at the 1912 Olympic Stadium.', descriptionSv: 'Ett av världens vackraste stadsmaraton. Mål på Stadion från 1912.' },
  { id: 'stockholm-half', name: 'Stockholm Half Marathon', sport: 'running', country: 'Sweden', month: 9, distanceKm: 21.1, klassiker: false, difficulty: 'intermediate', description: 'Half marathon through Stockholm\'s city center.', descriptionSv: 'Halvmaraton genom Stockholms innerstad.' },
  { id: 'midnattsloppet-sthlm', name: 'Midnattsloppet Stockholm', sport: 'running', country: 'Sweden', month: 8, distanceKm: 10, klassiker: false, difficulty: 'beginner', description: '10K night race through Stockholm. Party atmosphere.', descriptionSv: '10 km nattlopp genom Stockholm. Festlig stämning.' },
  { id: 'midnattsloppet-gbg', name: 'Midnattsloppet Göteborg', sport: 'running', country: 'Sweden', month: 8, distanceKm: 10, klassiker: false, difficulty: 'beginner', description: '10K night race through Gothenburg.', descriptionSv: '10 km nattlopp genom Göteborg.' },
  { id: 'malmo-half', name: 'Malmö Half Marathon', sport: 'running', country: 'Sweden', month: 9, distanceKm: 21.1, klassiker: false, difficulty: 'intermediate', description: 'Half marathon in Malmö.', descriptionSv: 'Halvmaraton i Malmö.' },
  { id: 'kretsloppet', name: 'Kretsloppet', sport: 'running', country: 'Sweden', month: 4, distanceKm: 18, klassiker: false, difficulty: 'intermediate', description: '18km race through Gothenburg\'s nature areas.', descriptionSv: '18 km lopp genom Göteborgs naturområden.' },
  { id: 'springtime-10', name: 'Spring10an', sport: 'running', country: 'Sweden', month: 5, distanceKm: 10, klassiker: false, difficulty: 'beginner', description: '10K race in multiple Swedish cities.', descriptionSv: '10 km lopp i flera svenska städer.' },
  { id: 'tjejmilen', name: 'Tjejmilen', sport: 'running', country: 'Sweden', month: 8, distanceKm: 10, klassiker: false, difficulty: 'beginner', description: '10K women\'s race in Stockholm.', descriptionSv: '10 km lopp för kvinnor i Stockholm.' },
  { id: 'bellmanstafetten', name: 'Bellmanstafetten', sport: 'running', country: 'Sweden', month: 9, distanceKm: 5, klassiker: false, difficulty: 'beginner', description: 'Relay race on Djurgården, Stockholm. Teams of 5.', descriptionSv: 'Stafettlopp på Djurgården. Lag om 5 löpare.' },
  { id: 'lund-marathon', name: 'Lundaloppet Marathon', sport: 'running', country: 'Sweden', month: 10, distanceKm: 42.2, klassiker: false, difficulty: 'intermediate', description: 'Marathon in Lund, southern Sweden.', descriptionSv: 'Maraton i Lund.' },

  // ===== SWEDISH CYCLING =====
  { id: 'vatternrundan-100', name: 'Vätternrundan 100', sport: 'cycling', country: 'Sweden', month: 6, distanceKm: 100, klassiker: false, difficulty: 'beginner', description: '100km around the southern part of Lake Vättern.', descriptionSv: '100 km runt södra delen av Vättern.' },
  { id: 'malaren-runt', name: 'Mälaren Runt', sport: 'cycling', country: 'Sweden', month: 6, distanceKm: 330, klassiker: false, difficulty: 'advanced', description: '330km around Lake Mälaren.', descriptionSv: '330 km runt Mälaren.' },
  { id: 'stockholm-bike', name: 'Stockholm Bike', sport: 'cycling', country: 'Sweden', month: 6, distanceKm: 90, klassiker: false, difficulty: 'intermediate', description: 'Road cycling race through Stockholm\'s surroundings.', descriptionSv: 'Landsvägscykling genom Stockholms omgivningar.' },

  // ===== SWEDISH TRIATHLON / SWIMRUN =====
  { id: 'kalmar-ironman', name: 'Ironman Kalmar', sport: 'triathlon', country: 'Sweden', month: 8, distanceKm: 226, klassiker: false, difficulty: 'advanced', description: 'Full Ironman in Kalmar. 3.8km swim, 180km bike, 42.2km run.', descriptionSv: 'Helt Ironman i Kalmar. 3,8 km simning, 180 km cykling, 42,2 km löpning.' },
  { id: 'kalmar-half-ironman', name: 'Ironman 70.3 Kalmar', sport: 'triathlon', country: 'Sweden', month: 8, distanceKm: 113, klassiker: false, difficulty: 'intermediate', description: 'Half Ironman in Kalmar.', descriptionSv: 'Halv Ironman i Kalmar.' },
  { id: 'vansbro-tri', name: 'Vansbro Triathlon', sport: 'triathlon', country: 'Sweden', month: 7, distanceKm: 51.5, klassiker: false, difficulty: 'intermediate', description: 'Olympic distance triathlon in Vansbro.', descriptionSv: 'Olympisk distans triathlon i Vansbro.' },
  { id: 'rottneros-tri', name: 'Rottneros Triathlon', sport: 'triathlon', country: 'Sweden', month: 8, distanceKm: 51.5, klassiker: false, difficulty: 'intermediate', description: 'Olympic distance triathlon in beautiful Värmland.', descriptionSv: 'Olympisk distans triathlon i vackra Värmland.' },
  { id: 'otillo', name: 'ÖTILLÖ Swimrun World Championship', sport: 'swimrun', country: 'Sweden', month: 9, distanceKm: 75, klassiker: false, difficulty: 'advanced', description: 'The original swimrun. 75km across Stockholm\'s archipelago.', descriptionSv: 'Ursprungliga swimrun. 75 km genom Stockholms skärgård.' },
  { id: 'otillo-sprint', name: 'ÖTILLÖ Sprint Stockholm', sport: 'swimrun', country: 'Sweden', month: 6, distanceKm: 15, klassiker: false, difficulty: 'intermediate', description: 'Sprint swimrun in Stockholm archipelago.', descriptionSv: 'Sprint swimrun i Stockholms skärgård.' },

  // ===== SWEDISH SWIMMING =====
  { id: 'vansbro-3km', name: 'Vansbrosimningen 3km', sport: 'swimming', country: 'Sweden', month: 7, distanceKm: 3, klassiker: false, difficulty: 'intermediate', description: 'The longer open water swim event in Vansbro.', descriptionSv: 'Den längre öppenvattensimningen i Vansbro.' },
  { id: 'oresundssimningen', name: 'Öresundssimningen', sport: 'swimming', country: 'Sweden', month: 8, distanceKm: 8, klassiker: false, difficulty: 'advanced', description: 'Swim across the Öresund strait between Sweden and Denmark.', descriptionSv: 'Simma över Öresund mellan Sverige och Danmark.' },

  // ===== EUROPEAN RUNNING =====
  { id: 'copenhagen-marathon', name: 'Copenhagen Marathon', sport: 'running', country: 'Denmark', month: 5, distanceKm: 42.2, klassiker: false, difficulty: 'intermediate', description: 'Marathon through the streets of Copenhagen.', descriptionSv: 'Maraton genom Köpenhamns gator.' },
  { id: 'copenhagen-half', name: 'Copenhagen Half Marathon', sport: 'running', country: 'Denmark', month: 9, distanceKm: 21.1, klassiker: false, difficulty: 'intermediate', description: 'Half marathon in Copenhagen.', descriptionSv: 'Halvmaraton i Köpenhamn.' },
  { id: 'oslo-marathon', name: 'Oslo Marathon', sport: 'running', country: 'Norway', month: 9, distanceKm: 42.2, klassiker: false, difficulty: 'intermediate', description: 'Marathon through Oslo.', descriptionSv: 'Maraton genom Oslo.' },
  { id: 'berlin-marathon', name: 'Berlin Marathon', sport: 'running', country: 'Germany', month: 9, distanceKm: 42.2, klassiker: false, difficulty: 'intermediate', description: 'One of the World Marathon Majors. Flat and fast.', descriptionSv: 'Ett av World Marathon Majors. Plant och snabbt.' },
  { id: 'london-marathon', name: 'London Marathon', sport: 'running', country: 'UK', month: 4, distanceKm: 42.2, klassiker: false, difficulty: 'intermediate', description: 'One of the World Marathon Majors.', descriptionSv: 'Ett av World Marathon Majors.' },
  { id: 'paris-marathon', name: 'Paris Marathon', sport: 'running', country: 'France', month: 4, distanceKm: 42.2, klassiker: false, difficulty: 'intermediate', description: 'Marathon through Paris, finishing on Avenue Foch.', descriptionSv: 'Maraton genom Paris med mål på Avenue Foch.' },
  { id: 'amsterdam-marathon', name: 'Amsterdam Marathon', sport: 'running', country: 'Netherlands', month: 10, distanceKm: 42.2, klassiker: false, difficulty: 'intermediate', description: 'Fast marathon in Amsterdam. Finishes in the Olympic Stadium.', descriptionSv: 'Snabbt maraton i Amsterdam. Mål i Olympiastadion.' },
  { id: 'geneva-marathon', name: 'Geneva Marathon', sport: 'running', country: 'Switzerland', month: 5, distanceKm: 42.2, klassiker: false, difficulty: 'intermediate', description: 'Marathon along Lake Geneva.', descriptionSv: 'Maraton längs Genèvesjön.' },
  { id: 'nyc-marathon', name: 'New York City Marathon', sport: 'running', country: 'USA', month: 11, distanceKm: 42.2, klassiker: false, difficulty: 'advanced', description: 'The world\'s largest marathon. Through all five boroughs.', descriptionSv: 'Världens största maraton. Genom alla fem stadsdelarna.' },
  { id: 'boston-marathon', name: 'Boston Marathon', sport: 'running', country: 'USA', month: 4, distanceKm: 42.2, klassiker: false, difficulty: 'advanced', description: 'The world\'s oldest annual marathon. Requires a qualifying time.', descriptionSv: 'Världens äldsta årliga maraton. Kräver kvaltid.' },
  { id: 'great-north-run', name: 'Great North Run', sport: 'running', country: 'UK', month: 9, distanceKm: 21.1, klassiker: false, difficulty: 'intermediate', description: 'The world\'s largest half marathon. Newcastle.', descriptionSv: 'Världens största halvmaraton. Newcastle.' },
  { id: 'prague-half', name: 'Prague Half Marathon', sport: 'running', country: 'Czech Republic', month: 4, distanceKm: 21.1, klassiker: false, difficulty: 'intermediate', description: 'Fast half marathon in Prague.', descriptionSv: 'Snabbt halvmaraton i Prag.' },
  { id: 'valencia-marathon', name: 'Valencia Marathon', sport: 'running', country: 'Spain', month: 12, distanceKm: 42.2, klassiker: false, difficulty: 'intermediate', description: 'One of the fastest marathons in Europe.', descriptionSv: 'Ett av Europas snabbaste maraton.' },
  { id: 'barcelona-half', name: 'Barcelona Half Marathon', sport: 'running', country: 'Spain', month: 2, distanceKm: 21.1, klassiker: false, difficulty: 'intermediate', description: 'Half marathon in Barcelona.', descriptionSv: 'Halvmaraton i Barcelona.' },
  { id: 'hamburg-marathon', name: 'Hamburg Marathon', sport: 'running', country: 'Germany', month: 4, distanceKm: 42.2, klassiker: false, difficulty: 'intermediate', description: 'Fast and flat marathon through Hamburg.', descriptionSv: 'Snabbt och plant maraton genom Hamburg.' },
  { id: 'stockholm-10', name: 'Stockholm 10', sport: 'running', country: 'Sweden', month: 5, distanceKm: 10, klassiker: false, difficulty: 'beginner', description: '10K race through central Stockholm.', descriptionSv: '10 km-lopp genom centrala Stockholm.' },
  { id: 'athensmarathon', name: 'Athens Marathon', sport: 'running', country: 'Greece', month: 11, distanceKm: 42.2, klassiker: false, difficulty: 'intermediate', description: 'The original marathon route from Marathon to Athens.', descriptionSv: 'Den ursprungliga maratonrutten från Marathon till Aten.' },

  // ===== EUROPEAN CYCLING =====
  { id: 'la-marmotte', name: 'La Marmotte', sport: 'cycling', country: 'France', month: 7, distanceKm: 174, klassiker: false, difficulty: 'advanced', description: 'Epic Alpine sportive. Col du Glandon, Col du Télégraphe, Col du Galibier, and Alpe d\'Huez.', descriptionSv: 'Episk alpinsportive. Col du Glandon, Col du Télégraphe, Col du Galibier och Alpe d\'Huez.' },
  { id: 'etape-du-tour', name: 'L\'Étape du Tour', sport: 'cycling', country: 'France', month: 7, distanceKm: 170, klassiker: false, difficulty: 'advanced', description: 'Ride a stage of the Tour de France. Changes route each year.', descriptionSv: 'Cykla en etapp av Tour de France. Banan ändras varje år.' },
  { id: 'sportful-dolomiti', name: 'Sportful Dolomiti Race', sport: 'cycling', country: 'Italy', month: 6, distanceKm: 210, klassiker: false, difficulty: 'advanced', description: 'One of Europe\'s toughest gran fondos. 5 Dolomite passes.', descriptionSv: 'En av Europas tuffaste gran fondos. 5 Dolomitpass.' },
  { id: 'amstel-gold', name: 'Amstel Gold Race (sportive)', sport: 'cycling', country: 'Netherlands', month: 4, distanceKm: 150, klassiker: false, difficulty: 'intermediate', description: 'Sportive version of the classic race. Rolling hills of Limburg.', descriptionSv: 'Sportiveversion av det klassiska loppet. Limburgska kullar.' },
  { id: 'mallorca-312', name: 'Mallorca 312', sport: 'cycling', country: 'Spain', month: 4, distanceKm: 312, klassiker: false, difficulty: 'advanced', description: '312km around the entire island of Mallorca.', descriptionSv: '312 km runt hela Mallorca.' },
  { id: 'gran-fondo-stelvio', name: 'Gran Fondo Stelvio', sport: 'cycling', country: 'Italy', month: 6, distanceKm: 138, klassiker: false, difficulty: 'advanced', description: 'Climb the legendary Stelvio Pass from Bormio.', descriptionSv: 'Bestig det legendariska Stelviopasset från Bormio.' },

  // ===== EUROPEAN TRIATHLON =====
  { id: 'ironman-copenhagen', name: 'Ironman Copenhagen', sport: 'triathlon', country: 'Denmark', month: 8, distanceKm: 226, klassiker: false, difficulty: 'advanced', description: 'Full Ironman in Copenhagen. Flat and fast bike course.', descriptionSv: 'Helt Ironman i Köpenhamn. Platt och snabb cykelbana.' },
  { id: 'ironman-frankfurt', name: 'Ironman European Championship', sport: 'triathlon', country: 'Germany', month: 6, distanceKm: 226, klassiker: false, difficulty: 'advanced', description: 'European Championship Ironman in Frankfurt.', descriptionSv: 'EM i Ironman i Frankfurt.' },
  { id: 'ironman-703-helsinki', name: 'Ironman 70.3 Helsinki', sport: 'triathlon', country: 'Finland', month: 7, distanceKm: 113, klassiker: false, difficulty: 'intermediate', description: 'Half Ironman in Helsinki.', descriptionSv: 'Halv Ironman i Helsingfors.' },
  { id: 'ironman-703-jonkoping', name: 'Ironman 70.3 Jönköping', sport: 'triathlon', country: 'Sweden', month: 7, distanceKm: 113, klassiker: false, difficulty: 'intermediate', description: 'Half Ironman in Jönköping by Lake Vättern.', descriptionSv: 'Halv Ironman i Jönköping vid Vättern.' },
  { id: 'challenge-roth', name: 'Challenge Roth', sport: 'triathlon', country: 'Germany', month: 7, distanceKm: 226, klassiker: false, difficulty: 'advanced', description: 'One of the world\'s largest long-distance triathlons. Legendary atmosphere.', descriptionSv: 'En av världens största långdistanstriathlons. Legendarisk stämning.' },

  // ===== EUROPEAN XC SKIING =====
  { id: 'birkebeinerrennet', name: 'Birkebeinerrennet', sport: 'xc_skiing', country: 'Norway', month: 3, distanceKm: 54, klassiker: false, difficulty: 'advanced', description: 'Norway\'s most prestigious ski race. 54km with a pack.', descriptionSv: 'Norges mest prestigefyllda skidlopp. 54 km med ryggsäck.' },
  { id: 'marcialonga', name: 'Marcialonga', sport: 'xc_skiing', country: 'Italy', month: 1, distanceKm: 70, klassiker: false, difficulty: 'advanced', description: '70km classic race in Val di Fiemme, Italy.', descriptionSv: '70 km klassiskt lopp i Val di Fiemme, Italien.' },
  { id: 'finlandia-hiihto', name: 'Finlandia-hiihto', sport: 'xc_skiing', country: 'Finland', month: 2, distanceKm: 50, klassiker: false, difficulty: 'intermediate', description: '50km ski race in Lahti, Finland.', descriptionSv: '50 km skidlopp i Lahtis, Finland.' },
  { id: 'konig-ludwig-lauf', name: 'König Ludwig Lauf', sport: 'xc_skiing', country: 'Germany', month: 2, distanceKm: 50, klassiker: false, difficulty: 'intermediate', description: '50km ski race in Oberammergau, Germany.', descriptionSv: '50 km skidlopp i Oberammergau, Tyskland.' },
  { id: 'tartu-maraton', name: 'Tartu Maraton', sport: 'xc_skiing', country: 'Estonia', month: 2, distanceKm: 63, klassiker: false, difficulty: 'intermediate', description: '63km ski marathon in Estonia. Part of Worldloppet.', descriptionSv: '63 km skidmaraton i Estland. Del av Worldloppet.' },
  { id: 'jizerska-50', name: 'Jizerská 50', sport: 'xc_skiing', country: 'Czech Republic', month: 2, distanceKm: 50, klassiker: false, difficulty: 'intermediate', description: '50km classic technique race in the Jizera Mountains.', descriptionSv: '50 km klassiskt lopp i Jizerabergen.' },

  // ===== EUROPEAN SWIMMING =====
  { id: 'stockholm-open-water', name: 'Stockholm Open Water', sport: 'swimming', country: 'Sweden', month: 8, distanceKm: 3, klassiker: false, difficulty: 'intermediate', description: 'Open water swimming in central Stockholm.', descriptionSv: 'Öppet vatten-simning i centrala Stockholm.' },
  { id: 'bosphorus-swim', name: 'Bosphorus Cross-Continental Swim', sport: 'swimming', country: 'Turkey', month: 7, distanceKm: 6.5, klassiker: false, difficulty: 'advanced', description: 'Swim across the Bosphorus strait from Asia to Europe.', descriptionSv: 'Simma över Bosporen från Asien till Europa.' },
  { id: 'capri-napoli', name: 'Capri–Napoli', sport: 'swimming', country: 'Italy', month: 9, distanceKm: 36, klassiker: false, difficulty: 'advanced', description: 'Historic marathon swim from Capri to Naples.', descriptionSv: 'Historisk maratonsimning från Capri till Neapel.' },

  // ===== ADDITIONAL EUROPEAN RUNNING =====
  { id: 'oslo-half', name: 'Oslo Half Marathon', sport: 'running', country: 'Norway', month: 9, distanceKm: 21.1, klassiker: false, difficulty: 'intermediate', description: 'Half marathon through the streets of Oslo.', descriptionSv: 'Halvmaraton genom Oslos gator.' },
  { id: 'helsinki-marathon', name: 'Helsinki Marathon', sport: 'running', country: 'Finland', month: 5, distanceKm: 42.2, klassiker: false, difficulty: 'intermediate', description: 'Marathon in the Finnish capital along the Baltic Sea.', descriptionSv: 'Maraton i Finlands huvudstad längs Östersjön.' },
  { id: 'rome-marathon', name: 'Rome Marathon', sport: 'running', country: 'Italy', month: 3, distanceKm: 42.2, klassiker: false, difficulty: 'intermediate', description: 'Run past the Colosseum, Vatican, and Trevi Fountain.', descriptionSv: 'Spring förbi Colosseum, Vatikanen och Trevifontänen.' },
  { id: 'lisbon-half', name: 'Lisbon Half Marathon', sport: 'running', country: 'Portugal', month: 3, distanceKm: 21.1, klassiker: false, difficulty: 'intermediate', description: 'Fast half marathon crossing the 25 de Abril Bridge.', descriptionSv: 'Snabbt halvmaraton som korsar 25 de Abril-bron.' },
  { id: 'zurich-marathon', name: 'Zurich Marathon', sport: 'running', country: 'Switzerland', month: 4, distanceKm: 42.2, klassiker: false, difficulty: 'intermediate', description: 'Marathon along Lake Zurich.', descriptionSv: 'Maraton längs Zürichsjön.' },

  // ===== ADDITIONAL SWEDISH =====
  { id: 'gotland-runt', name: 'Gotland Runt', sport: 'cycling', country: 'Sweden', month: 6, distanceKm: 175, klassiker: false, difficulty: 'intermediate', description: 'Cycling around the island of Gotland.', descriptionSv: 'Cykling runt Gotland.' },
  { id: 'klaralven-swim', name: 'Klarälvsloppet', sport: 'swimming', country: 'Sweden', month: 8, distanceKm: 1.5, klassiker: false, difficulty: 'beginner', description: 'Open water swim in the Klarälven river.', descriptionSv: 'Öppet vatten-simning i Klarälven.' },
  { id: 'vasastafetten', name: 'Vasastafetten', sport: 'running', country: 'Sweden', month: 6, distanceKm: 90, klassiker: false, difficulty: 'intermediate', description: 'Running relay on the Vasaloppet trail. 5 legs.', descriptionSv: 'Löparstafett på Vasaloppsspåret. 5 sträckor.' },
  { id: 'kinnekulle-trail', name: 'Kinnekulle Trail', sport: 'running', country: 'Sweden', month: 9, distanceKm: 21, klassiker: false, difficulty: 'intermediate', description: 'Trail half marathon on Kinnekulle mountain.', descriptionSv: 'Trail halvmaraton på Kinnekulle.' },
];

export function searchRaces(query: string, sport?: Sport): Race[] {
  let results = RACES;
  if (sport) results = results.filter(r => r.sport === sport);
  if (query && query.length >= 2) {
    const q = query.toLowerCase();
    results = results.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.country.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q)
    );
  }
  return results.sort((a, b) => a.month - b.month);
}

export function getKlassikerRaces(): Race[] {
  return RACES.filter(r => r.klassiker);
}

export function getRaceById(id: string): Race | undefined {
  return RACES.find(r => r.id === id);
}

export function getRacesBySport(sport: Sport): Race[] {
  return RACES.filter(r => r.sport === sport).sort((a, b) => a.month - b.month);
}
