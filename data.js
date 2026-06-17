/* ============================================================
   The Leftist Map: node index (lightweight)

   This file holds ONLY what is needed to draw each node and its
   hover/inline preview. The heavy modal content (full summary +
   sources) lives in one file per entry under entries/<id>.js and
   is loaded on click. Keeping them apart stops this file from
   bloating as the map grows.

   Fields:
     id        unique string (used for lineage links + content file)
     name      display name
     school    school / current of thought
     years     human-readable range (lived, or "est. 18xx")
     yearSort  number used only for vertical ordering
     era       loose grouping label (optional)
     lane      horizontal branch slot: 0 = root column, 1, 2 ... shift right
     parents   array of ids this entry descends from (draws connectors)
     thumb     image path or URL (falls back to initials on error).
               Local copy in img/ is most robust; a remote URL also works.
     thumbPos  optional CSS object-position to frame the face, e.g. "center 22%"
     initials  shown when no image is present / image fails to load
     preview   one or two sentences (hover card + mobile inline)

   The matching content file looks like:
     window.LM_CONTENT["marx"] = { summary: "<p>...</p>", sources: [...] };
   ============================================================ */

// Organizational / International affiliation (icon taxonomy). This is distinct
// from the school-of-thought text on each card: it marks which body a thinker
// actually belonged to. A card may carry more than one, or none.
window.ORGS = {
  "first-intl":  { label: "First International (IWA, 1864–1876)", mono: "I", color: "#2f6f6a" },
  "anti-auth":   { label: "Anarchist movement (Anti-Authoritarian International)", mono: "Ⓐ", color: "#2b2b2b" },
  "second-intl": { label: "Second International (1889–1916)", mono: "II", color: "#42528c" },
  "third-intl":  { label: "Third International / Comintern (1919–1943)", mono: "★", color: "#9a3324" },
  "fourth-intl": { label: "Fourth International (1938– )", mono: "IV", color: "#7a3e86" },
  "frankfurt":   { label: "Frankfurt School (Institute for Social Research)", mono: "FS", color: "#586b7a" },
  "industrial":  { label: "Industrial Unionism (IWW / CIO tradition)", mono: "IU", color: "#9c6b2e" }
};

window.ENTRIES = [
  {
    id: "marx",
    orgs: ["first-intl"],
    quote: "The philosophers have only interpreted the world, in various ways; the point is to change it.",
    archive: { label: "Marxists Internet Archive", url: "https://www.marxists.org/archive/marx/index.htm" },
    books: [
      { title: "The Communist Manifesto", isbn: "9780879754464" },
      { title: "Capital, Volume One", isbn: "9781478371885" },
      { title: "The Eighteenth Brumaire of Louis Bonaparte", isbn: "9798715825339" }
    ],
    name: "Karl Marx",
    school: "Marxism · Scientific Socialism",
    years: "1818–1883",
    yearSort: 1818,
    era: "Foundations",
    row: 0,
    lane: -0.6,
    center: true,
    parents: ["saint-simon", "fourier", "owen"],
    thumb: "img/marx.png",
    thumbPos: "center 25%",
    initials: "KM",
    preview:
      "German philosopher, economist and revolutionary socialist. Developed historical materialism, co-wrote The Communist Manifesto (1848), and wrote Das Kapital."
  },
  {
    id: "engels",
    orgs: ["first-intl", "second-intl"],
    quote: "The state is not abolished, it withers away.",
    archive: { label: "Marx / Engels Archive", url: "https://www.marxists.org/archive/marx/index.htm" },
    books: [
      { title: "The Condition of the Working Class in England", isbn: "9781406525151" },
      { title: "Socialism: Utopian and Scientific", isbn: "9781544964966" },
      { title: "The Origin of the Family, Private Property and the State", isbn: "9781541015364" }
    ],
    name: "Friedrich Engels",
    school: "Marxism · Co-founder",
    years: "1820–1895",
    yearSort: 1820,
    era: "Foundations",
    row: 0,
    lane: 0.6,
    parents: ["marx"],
    pinNear: "marx",
    thumb: "img/engels.jpg",
    thumbPos: "center 22%",
    initials: "FE",
    preview:
      "Marx's lifelong collaborator and co-author of The Communist Manifesto. A Manchester cotton manufacturer who bankrolled Marx, wrote The Condition of the Working Class in England, and edited the unfinished volumes of Das Kapital."
  },
  {
    id: "bakunin",
    orgs: ["first-intl", "anti-auth"],
    quote: "Freedom without socialism is privilege and injustice; socialism without freedom is slavery and brutality.",
    archive: { label: "Bakunin Archive (Marxists.org)", url: "https://www.marxists.org/reference/archive/bakunin/index.htm" },
    books: [
      { title: "God and the State", isbn: "9781511534390" },
      { title: "Statism and Anarchy", isbn: "9780521369732" }
    ],
    name: "Mikhail Bakunin",
    school: "Collectivist Anarchism",
    years: "1814–1876",
    yearSort: 1868,
    era: "The first split",
    row: 1,
    lane: -2.4,
    parents: ["marx", "proudhon"],
    thumb: "img/bakunin.jpg",
    thumbPos: "center 22%",
    initials: "MB",
    preview:
      "Russian revolutionary anarchist and Marx's great rival in the First International. Warned that a workers' state would become a new dictatorship over the proletariat, and argued for federations of self-governing communes."
  },
  {
    id: "bernstein",
    orgs: ["second-intl"],
    quote: "The movement is everything, the final goal nothing.",
    archive: { label: "Bernstein Archive (Marxists.org)", url: "https://www.marxists.org/reference/archive/bernstein/index.htm" },
    books: [
      { title: "The Preconditions of Socialism", isbn: "9780521391214" },
      { title: "Evolutionary Socialism", isbn: "9780359733361" }
    ],
    name: "Eduard Bernstein",
    school: "Revisionism · Reformist Social Democracy",
    years: "1850–1932",
    yearSort: 1899,
    era: "The reformist road",
    row: 1,
    lane: 2.0,
    parents: ["marx", "engels"],
    thumb: "img/bernstein.jpg",
    thumbPos: "center 22%",
    initials: "EB",
    preview:
      "German social democrat who launched 'revisionism.' Rejected the inevitability of capitalist collapse and argued socialists should pursue gradual reform through democratic institutions."
  },
  {
    id: "lenin",
    orgs: ["second-intl", "third-intl"],
    quote: "Without revolutionary theory there can be no revolutionary movement.",
    archive: { label: "Lenin Internet Archive (Marxists.org)", url: "https://www.marxists.org/archive/lenin/index.htm" },
    books: [
      { title: "What Is to Be Done?", isbn: "9781900007924" },
      { title: "The State and Revolution", isbn: "9781637525401" },
      { title: "Imperialism, the Highest Stage of Capitalism", isbn: "9781726312653" }
    ],
    name: "Vladimir Lenin",
    school: "Marxism–Leninism · Vanguardism",
    years: "1870–1924",
    yearSort: 1903,
    era: "The vanguard road",
    row: 2,
    lane: -0.6,
    parents: ["marx", "kautsky", "plekhanov"],
    thumb: "img/lenin.jpg",
    thumbPos: "center 22%",
    initials: "VL",
    preview:
      "Russian revolutionary who led the Bolsheviks and the October Revolution. Founder of the vanguard-party model and head of the first Soviet state, credited with the revolution and condemned for its repression."
  },
  {
    id: "kropotkin",
    orgs: ["anti-auth"],
    quote: "Mutual aid is as much a law of animal life as mutual struggle.",
    archive: { label: "Kropotkin at The Anarchist Library", url: "" },
    books: [
      { title: "The Conquest of Bread", isbn: "9780521459907" },
      { title: "Mutual Aid: A Factor of Evolution", isbn: "9781729542262" },
      { title: "Fields, Factories and Workshops", isbn: "9781614275930" }
    ],
    name: "Peter Kropotkin",
    school: "Anarchist Communism",
    years: "1842–1921",
    yearSort: 1892,
    era: "Anarchism deepens",
    row: 2,
    lane: -2.4,
    parents: ["bakunin"],
    thumb: "img/kropotkin.jpg",
    thumbPos: "center 25%",
    initials: "PK",
    preview:
      "Russian anarchist and geographer who carried Bakunin's anarchism into anarcho-communism. Argued in Mutual Aid that cooperation is a force in evolution, and broke with the Bolsheviks after 1917."
  },
  {
    id: "kautsky",
    orgs: ["second-intl"],
    quote: "Social Democracy is a revolutionary party, but not a party that makes revolutions.",
    archive: { label: "Kautsky Archive (Marxists.org)", url: "https://www.marxists.org/archive/kautsky/index.htm" },
    books: [
      { title: "The Road to Power", isbn: "9780916695125" },
      { title: "The Class Struggle" },
      { title: "The Dictatorship of the Proletariat", isbn: "9781015489677" }
    ],
    name: "Karl Kautsky",
    school: "Orthodox Marxism · Second International",
    years: "1854–1938",
    yearSort: 1891,
    era: "The orthodox centre",
    row: 1,
    lane: 0.6,
    parents: ["engels", "marx"],
    thumb: "img/kautsky.jpg",
    thumbPos: "center 22%",
    initials: "KK",
    preview:
      "The 'Pope of Marxism' and leading theorist of the Second International. Defended orthodoxy against Bernstein, opposed Luxemburg's spontaneity, and condemned the Bolshevik revolution as a new dictatorship."
  },
  {
    id: "luxemburg",
    orgs: ["second-intl"],
    quote: "Freedom is always the freedom of the one who thinks differently.",
    archive: { label: "Luxemburg Archive (Marxists.org)", url: "https://www.marxists.org/archive/luxemburg/index.htm" },
    books: [
      { title: "Reform or Revolution", isbn: "9780486447766" },
      { title: "The Mass Strike", isbn: "9780979336331" },
      { title: "The Accumulation of Capital", isbn: "9781138834613" }
    ],
    name: "Rosa Luxemburg",
    school: "Revolutionary Marxism · Socialist Democracy",
    years: "1871–1919",
    yearSort: 1900,
    era: "The democratic revolutionary",
    row: 2,
    lane: 0.8,
    parents: ["marx", "kautsky"],
    thumb: "img/luxemburg.jpg",
    thumbPos: "center 22%",
    initials: "RL",
    preview:
      "Polish-German revolutionary who attacked both Bernstein's reformism and Lenin's authoritarian centralism. Champion of mass-strike spontaneity and socialist democracy; murdered in 1919."
  },
  {
    id: "goldman",
    orgs: ["anti-auth"],
    quote: "The most violent element in society is ignorance.",
    archive: { label: "Goldman at The Anarchist Library", url: "https://theanarchistlibrary.org/category/author/emma-goldman" },
    books: [
      { title: "Anarchism and Other Essays", isbn: "9781609441135" },
      { title: "Living My Life", isbn: "9781387871704" }
    ],
    name: "Emma Goldman",
    school: "Anarchism · Anarcha-Feminism",
    years: "1869–1940",
    yearSort: 1910,
    era: "Anarchism widens",
    row: 3,
    lane: -2.4,
    parents: ["kropotkin", "bakunin"],
    thumb: "img/goldman.jpg",
    thumbPos: "center 22%",
    initials: "EG",
    preview:
      "Anarchist orator on free speech, women's emancipation, and free love, and a fierce critic of the Bolshevik state after Kronstadt. A bridge from Kropotkin's anarchism to anarcha-feminism."
  },
  {
    id: "trotsky",
    orgs: ["third-intl", "fourth-intl"],
    quote: "The end justifies the means so long as there is something that justifies the end.",
    archive: { label: "Trotsky Internet Archive (Marxists.org)", url: "https://www.marxists.org/archive/trotsky/index.htm" },
    books: [
      { title: "The Revolution Betrayed", isbn: "9781597407625" },
      { title: "History of the Russian Revolution", isbn: "9781931859455" },
      { title: "The Permanent Revolution", isbn: "9781015463653" }
    ],
    name: "Leon Trotsky",
    school: "Trotskyism · Permanent Revolution",
    years: "1879–1940",
    yearSort: 1923,
    era: "The left opposition",
    row: 3,
    lane: -1.1,
    parents: ["lenin"],
    thumb: "img/trotsky.jpg",
    thumbPos: "center 22%",
    initials: "LT",
    preview:
      "Bolshevik leader of the October Revolution and founder of the Red Army, later the chief Marxist opponent of Stalin. Exiled and assassinated in 1940; his Trotskyism kept a revolutionary critique of the Soviet bureaucracy alive."
  },
  {
    id: "stalin",
    orgs: ["third-intl"],
    quote: "Core idea: \"socialism in one country.\" Build and defend the socialist state within the USSR, by any means, rather than wait on world revolution.",
    archive: { label: "Stalin Reference Archive (Marxists.org)", url: "https://www.marxists.org/reference/archive/stalin/index.htm" },
    books: [
      { title: "Foundations of Leninism", isbn: "9780898752120" },
      { title: "Marxism and the National Question", isbn: "9781105460425" }
    ],
    name: "Joseph Stalin",
    school: "Marxism–Leninism · Stalinism",
    years: "1878–1953",
    yearSort: 1924,
    era: "The authoritarian state",
    row: 3,
    lane: -0.1,
    parents: ["lenin"],
    thumb: "img/stalin.jpg",
    thumbPos: "center 22%",
    initials: "JS",
    preview:
      "Soviet dictator who codified Marxism–Leninism into Stalinism and ruled from 1924 to 1953. Forced industrialisation and collectivisation, mass famine, the Great Purge, and the Gulag; also led the USSR to victory over Nazi Germany."
  },
  {
    id: "mao",
    orgs: ["third-intl"],
    quote: "Political power grows out of the barrel of a gun.",
    archive: { label: "Mao Reference Archive (Marxists.org)", url: "https://www.marxists.org/reference/archive/mao/index.htm" },
    books: [
      { title: "On Practice and On Contradiction", isbn: "9781786633408" },
      { title: "On Guerrilla Warfare", isbn: "9781442166714" }
    ],
    name: "Mao Zedong",
    school: "Maoism · Marxism–Leninism",
    years: "1893–1976",
    yearSort: 1949,
    era: "Revolution in the global South",
    row: 4,
    lane: -0.6,
    parents: ["lenin", "stalin"],
    thumb: "img/mao.jpg",
    thumbPos: "center 20%",
    initials: "MZ",
    preview:
      "Founder of the People's Republic of China and author of Maoism, a peasant-based adaptation of Marxism–Leninism. Led the 1949 revolution; his Great Leap Forward and Cultural Revolution caused tens of millions of deaths."
  },
  {
    id: "pannekoek",
    orgs: ["second-intl"],
    quote: "Core idea: the workers' revolution must be made by the workers themselves, through their own councils, not by a party ruling in their name.",
    archive: { label: "Pannekoek Archive (Marxists.org)", url: "https://www.marxists.org/archive/pannekoe/index.htm" },
    books: [
      { title: "Workers' Councils", isbn: "9781902593562" },
      { title: "Lenin as Philosopher", isbn: "9780850361865" }
    ],
    name: "Anton Pannekoek",
    school: "Council Communism · Libertarian Marxism",
    years: "1873–1960",
    yearSort: 1920,
    era: "Marxism from below",
    row: 3,
    lane: 0.9,
    parents: ["marx", "luxemburg"],
    thumb: "img/pannekoek.jpg",
    thumbPos: "center 22%",
    initials: "AP",
    preview:
      "Dutch astronomer and council communist who held the workers' revolution must be made by the workers themselves through democratic councils, not a vanguard party. Reached anti-authoritarian conclusions from inside Marxism."
  },
  {
    id: "guerin",
    orgs: [],
    quote: "Core idea: Marxism supplies the critique of capitalism, anarchism the refusal of the state; a living socialism needs both.",
    archive: { label: "Guérin Archive (Marxists.org)", url: "https://www.marxists.org/history/etol/writers/guerin/index.htm" },
    books: [
      { title: "Anarchism: From Theory to Practice", isbn: "9780853451754" },
      { title: "No Gods No Masters: An Anthology of Anarchism", isbn: "9781904859253" }
    ],
    name: "Daniel Guérin",
    school: "Libertarian Marxism · Anarchism",
    years: "1904–1988",
    yearSort: 1965,
    era: "The synthesis",
    row: 4,
    lane: -1.4,
    parents: ["luxemburg", "goldman", "bakunin"],
    thumb: "img/guerin.png",
    thumbPos: "center 22%",
    initials: "DG",
    preview:
      "French writer who set out, more explicitly than almost anyone, to weld anarchism and Marxism together. Anti-colonialist and a pioneer of queer liberation; the cleanest 'two tracks, one person' figure."
  },
  {
    id: "bookchin",
    orgs: [],
    quote: "The very notion of the domination of nature by man stems from the very real domination of human by human.",
    archive: { label: "Bookchin at The Anarchist Library", url: "https://theanarchistlibrary.org/category/author/murray-bookchin" },
    books: [
      { title: "Post-Scarcity Anarchism", isbn: "9781904859062" },
      { title: "The Ecology of Freedom", isbn: "9781904859260" },
      { title: "The Next Revolution", isbn: "9781781685808" }
    ],
    name: "Murray Bookchin",
    school: "Social Ecology · Communalism",
    years: "1921–2006",
    yearSort: 1982,
    era: "The synthesis",
    row: 5,
    lane: -1.6,
    parents: ["trotsky", "kropotkin", "landauer"],
    thumb: "img/bookchin.jpg",
    thumbPos: "center 22%",
    initials: "MB",
    preview:
      "Traveled from Marxism through anarchism to 'communalism,' founding social ecology and libertarian municipalism. His ideas later shaped the democratic confederalism of Rojava."
  },
  {
    id: "proudhon",
    orgs: [],
    quote: "Property is theft!",
    archive: { label: "Proudhon Archive (Marxists.org)", url: "https://www.marxists.org/reference/subject/economics/proudhon/index.htm" },
    books: [
      { title: "What Is Property?", isbn: "9781512254150" },
      { title: "The Philosophy of Poverty" },
      { title: "The General Idea of the Revolution in the Nineteenth Century", isbn: "9780486163581" }
    ],
    name: "Pierre-Joseph Proudhon",
    school: "Mutualism · Anarchism",
    years: "1809–1865",
    yearSort: 1840,
    era: "Foundations",
    lane: -2.0,
    parents: ["godwin", "fourier", "saint-simon"],
    thumb: "img/proudhon.jpg",
    thumbPos: "center 22%",
    initials: "PP",
    preview:
      "French printer and philosopher, the first thinker to call himself an 'anarchist.' His mutualism, built on the maxim 'property is theft,' proposed worker cooperatives and federalism against both capitalism and the state."
  },
  {
    id: "fourier",
    orgs: [],
    quote: "The extension of women's rights is the general principle of all social progress.",
    archive: { label: "Fourier Archive (Marxists.org)", url: "https://www.marxists.org/reference/archive/fourier/index.htm" },
    books: [
      { title: "The Theory of the Four Movements", isbn: "9780521356930" }
    ],
    name: "Charles Fourier",
    school: "Utopian Socialism",
    years: "1772–1837",
    yearSort: 1772,
    era: "Foundations",
    lane: -1.0,
    parents: [],
    thumb: "img/fourier.jpg",
    thumbPos: "center 22%",
    initials: "CF",
    preview:
      "French utopian socialist who envisioned cooperative communities (phalansteries) designed to make work attractive and liberate natural human passions. A pioneering feminist whose social critique influenced Marx and later communitarians."
  },
  {
    id: "plekhanov",
    orgs: ["second-intl"],
    quote: "Core idea: Marxism is a complete and harmonious world-outlook, grounded in the dialectical and historical materialist method; the economic base shapes the entire political and ideological superstructure.",
    archive: { label: "Plekhanov Archive (Marxists.org)", url: "https://www.marxists.org/archive/plekhanov/index.htm" },
    books: [
      { title: "The Development of the Monist View of History", isbn: "9781410203229" },
      { title: "Fundamental Problems of Marxism" },
      { title: "The Role of the Individual in History", isbn: "9781410209481" }
    ],
    name: "Georgi Plekhanov",
    school: "Orthodox Marxism",
    years: "1856–1918",
    yearSort: 1883,
    era: "The orthodox centre",
    lane: 0.4,
    parents: ["marx", "engels"],
    thumb: "img/plekhanov.jpg",
    thumbPos: "center 22%",
    initials: "GP",
    preview:
      "The 'Father of Russian Marxism' who broke with populism to found the Emancipation of Labor group in 1883. Introduced a generation of Russian revolutionaries to Marxist theory, but condemned the October Revolution as premature."
  },
  {
    id: "connolly",
    orgs: ["second-intl", "industrial"],
    quote: "The worker is the slave of capitalist society, the female worker is the slave of that slave.",
    archive: { label: "Connolly Archive (Marxists.org)", url: "https://www.marxists.org/archive/connolly/index.htm" },
    books: [
      { title: "Labour in Irish History", isbn: "9781015398641" },
      { title: "The Re-Conquest of Ireland" }
    ],
    name: "James Connolly",
    school: "Revolutionary Socialism · Irish Republicanism",
    years: "1868–1916",
    yearSort: 1896,
    era: "Socialism and nationalism",
    lane: -0.8,
    parents: ["marx", "engels"],
    thumb: "img/connolly.jpg",
    thumbPos: "center 22%",
    initials: "JC",
    preview:
      "Irish Marxist, syndicalist organizer, and republican executed for leading the 1916 Easter Rising. Wove class struggle and anti-colonial national liberation into a single revolutionary strategy."
  },
  {
    id: "malatesta",
    orgs: ["first-intl", "anti-auth"],
    quote: "Core idea: anarchists do not seek to emancipate the people; the people must emancipate themselves, through their own organizations and direct action.",
    archive: { label: "Malatesta at The Anarchist Library", url: "https://theanarchistlibrary.org/category/author/errico-malatesta" },
    books: [
      { title: "Anarchy", isbn: "9781512061338" },
      { title: "At the Cafe" }
    ],
    name: "Errico Malatesta",
    school: "Anarchist Communism",
    years: "1853–1932",
    yearSort: 1872,
    era: "Anarchism deepens",
    lane: -2.2,
    parents: ["bakunin"],
    thumb: "img/malatesta.png",
    thumbPos: "center 22%",
    initials: "EM",
    preview:
      "Italian anarchist revolutionary and close Bakunin ally who spent more than half his life in exile or prison. Championed practical, popular anarchism rooted in mass organization rather than minority conspiracies."
  },
  {
    id: "gramsci",
    orgs: ["third-intl"],
    quote: "The old world is dying, and the new world struggles to be born: now is the time of monsters.",
    archive: { label: "Gramsci Archive (Marxists.org)", url: "https://www.marxists.org/archive/gramsci/index.htm" },
    books: [
      { title: "Selections from the Prison Notebooks", isbn: "9780521411431" }
    ],
    name: "Antonio Gramsci",
    school: "Marxism · Cultural Hegemony",
    years: "1891–1937",
    yearSort: 1926,
    era: "Marxism in the West",
    lane: -0.3,
    parents: ["marx", "lenin"],
    thumb: "img/gramsci.png",
    thumbPos: "center 22%",
    initials: "AG",
    preview:
      "Italian Marxist whose Prison Notebooks developed the concept of cultural hegemony, explaining how ruling classes maintain power through consent and ideology as much as coercion. Argued Western revolution requires a 'war of position' in civil society."
  },
  {
    id: "kollontai",
    orgs: ["third-intl"],
    quote: "Core idea: the Workers' Opposition insists that the working class itself, through its unions and councils, must direct the economy; the party cannot substitute itself for the class.",
    archive: { label: "Kollontai Archive (Marxists.org)", url: "https://www.marxists.org/archive/kollonta/index.htm" },
    books: [
      { title: "The Workers' Opposition", isbn: "9781467968584" },
      { title: "Sexual Relations and the Class Struggle" },
      { title: "A Great Love", isbn: "9781466406711" }
    ],
    name: "Alexandra Kollontai",
    school: "Marxism · Revolutionary Feminism",
    years: "1872–1952",
    yearSort: 1920,
    era: "The vanguard road",
    lane: -0.9,
    parents: ["lenin", "luxemburg", "zetkin"],
    thumb: "img/kollontai.jpg",
    thumbPos: "center 22%",
    initials: "AK",
    preview:
      "Russian Bolshevik, the world's first woman cabinet minister, and leader of the Workers' Opposition. Advocated for free love, sexual revolution, and the transformation of family life under socialism, but was sidelined under Stalin."
  },
  {
    id: "saint-simon",
    orgs: [],
    quote: "The golden age, which blind tradition has placed in the past, is before us.",
    archive: { label: "Saint-Simon Archive (Marxists.org)", url: "https://www.marxists.org/reference/subject/philosophy/works/fr/st-simon.htm" },
    books: [
      { title: "The New Christianity" }
    ],
    name: "Henri de Saint-Simon",
    school: "Utopian Socialism",
    years: "1760–1825",
    yearSort: 1760,
    era: "Foundations",
    lane: 1.2,
    parents: [],
    thumb: "img/saint-simon.jpg",
    thumbPos: "center 22%",
    initials: "SS",
    preview:
      "French aristocrat turned social theorist, one of the founding figures of utopian socialism. Argued society should be reorganized under the leadership of scientists and industrialists for the benefit of the poorest class."
  },
  {
    id: "owen",
    orgs: [],
    quote: "Core idea: human character is formed by environment, not by innate nature; transform the social conditions and you transform the person.",
    archive: { label: "Owen Archive (Marxists.org)", url: "https://www.marxists.org/reference/subject/economics/owen/index.htm" },
    books: [
      { title: "A New View of Society", isbn: "9781015990357" }
    ],
    name: "Robert Owen",
    school: "Utopian Socialism · Cooperative Movement",
    years: "1771–1858",
    yearSort: 1771,
    era: "Foundations",
    lane: 1.8,
    parents: ["godwin"],
    thumb: "img/owen.jpg",
    thumbPos: "center 22%",
    initials: "RO",
    preview:
      "Welsh manufacturer and reformer who founded the cooperative movement and pioneered humane factory conditions. His New Lanark mills demonstrated that decent working conditions and profitability could coexist."
  },
  {
    id: "stirner",
    orgs: [],
    quote: "I have set my cause upon nothing.",
    archive: { label: "Stirner at The Anarchist Library", url: "https://theanarchistlibrary.org/category/author/max-stirner" },
    books: [
      { title: "The Ego and Its Own", isbn: "9781365308864" }
    ],
    name: "Max Stirner",
    school: "Individualist Anarchism · Egoism",
    years: "1806–1856",
    yearSort: 1844,
    era: "Foundations",
    lane: -2.8,
    parents: [],
    thumb: "img/stirner.jpg",
    thumbPos: "center 22%",
    initials: "MS",
    preview:
      "German philosopher whose The Ego and Its Own founded individualist anarchism on radical egoism. Marx devoted much of The German Ideology to refuting him; his thought later influenced anarchism and existentialism alike."
  },
  {
    id: "lafargue",
    orgs: ["second-intl"],
    quote: "Core idea: the working class is afflicted by a strange delusion, the love of work; the goal of socialism is not full employment but the right to be lazy, to enjoy leisure, culture, and pleasure.",
    archive: { label: "Lafargue Archive (Marxists.org)", url: "https://www.marxists.org/archive/lafargue/index.htm" },
    books: [
      { title: "The Right to Be Lazy", isbn: "9781512097283" }
    ],
    name: "Paul Lafargue",
    school: "Marxism · French Socialism",
    years: "1842–1911",
    yearSort: 1883,
    era: "The orthodox centre",
    lane: -0.4,
    parents: ["marx", "proudhon"],
    thumb: "img/lafargue.jpg",
    thumbPos: "center 22%",
    initials: "PL",
    preview:
      "French Marxist, Marx's Cuban-born son-in-law, and author of The Right to Be Lazy. His witty critique of the 'dogma of work' and defense of leisure as the goal of socialism made him a unique, heterodox voice."
  },
  {
    id: "fanon",
    orgs: [],
    quote: "Each generation must, out of relative obscurity, discover its mission, fulfill it, or betray it.",
    archive: { label: "Fanon Archive (Marxists.org)", url: "" },
    books: [
      { title: "The Wretched of the Earth", isbn: "9781777257361" },
      { title: "Black Skin, White Masks" }
    ],
    name: "Frantz Fanon",
    school: "Anti-Colonialism · Revolutionary Humanism",
    years: "1925–1961",
    yearSort: 1961,
    era: "Revolution in the global South",
    lane: -1.0,
    parents: ["marx", "sartre"],
    thumb: "img/fanon.png",
    thumbPos: "center 22%",
    initials: "FF",
    preview:
      "Martinican psychiatrist and revolutionary whose The Wretched of the Earth became a foundational text of anti-colonial struggle. His analysis of racism, violence, and the pitfalls of post-colonial nationalism reshaped radical thought globally."
  },
  {
    id: "makhno",
    orgs: ["anti-auth"],
    quote: "Core idea: the free, self-governing soviet is the true organ of the revolution; any party that subordinates the soviets to its authority, Bolsheviks included, betrays the workers and peasants.",
    archive: { label: "Makhno at The Anarchist Library", url: "https://theanarchistlibrary.org/category/author/nestor-makhno" },
    books: [
      { title: "The Struggle Against the State and Other Essays", isbn: "9781873176788" }
    ],
    name: "Nestor Makhno",
    school: "Anarchist Communism · Platformism",
    years: "1888–1934",
    yearSort: 1918,
    era: "Anarchism in arms",
    lane: -2.3,
    parents: ["bakunin", "kropotkin"],
    thumb: "img/makhno.jpg",
    thumbPos: "center 22%",
    initials: "NM",
    preview:
      "Ukrainian anarchist who led a massive peasant partisan army during the Russian Civil War, fighting Whites and Bolsheviks alike. His platformism sought to reconcile anarchist principles with organized revolutionary discipline."
  },
  {
    id: "marcuse",
    orgs: ["frankfurt"],
    quote: "A comfortable, smooth, reasonable, democratic unfreedom prevails in advanced industrial civilization.",
    archive: { label: "Marcuse Reference Archive (Marxists.org)", url: "https://www.marxists.org/reference/archive/marcuse/index.htm" },
    books: [
      { title: "One-Dimensional Man", isbn: "9780415289771" },
      { title: "Eros and Civilization", isbn: "9781138137950" }
    ],
    name: "Herbert Marcuse",
    school: "Frankfurt School · Critical Theory",
    years: "1898–1979",
    yearSort: 1964,
    era: "Marxism in the West",
    lane: -1.3,
    parents: ["marx", "gramsci"],
    thumb: "img/marcuse.jpg",
    thumbPos: "center 22%",
    initials: "HM",
    preview:
      "German-American philosopher of the Frankfurt School who combined Marx with Freud to diagnose consumer capitalism. One-Dimensional Man and his concept of 'repressive tolerance' made him the philosophical father of the 1960s New Left."
  },
  {
    id: "dubois",
    orgs: [],
    quote: "The problem of the twentieth century is the problem of the color-line.",
    archive: { label: "Du Bois Reference Archive (Marxists.org)", url: "" },
    books: [
      { title: "The Souls of Black Folk", isbn: "9781535103305" },
      { title: "Black Reconstruction in America", isbn: "9780199385652" }
    ],
    name: "W. E. B. Du Bois",
    school: "Pan-Africanism · Marxism",
    years: "1868–1963",
    yearSort: 1903,
    era: "Race and revolution",
    lane: -0.6,
    parents: ["marx"],
    thumb: "img/dubois.jpg",
    thumbPos: "center 22%",
    initials: "WD",
    preview:
      "American sociologist, historian, and Pan-Africanist who declared the color-line the defining problem of the twentieth century. His Black Reconstruction rewrote post-Civil War history, and he moved toward Marxism late in his long life."
  },
  {
    id: "godwin",
    orgs: [],
    quote: "Core idea: government, even at its best, is an evil that stifles human reason; society can be organized through rational discourse and voluntary association alone.",
    archive: { label: "Godwin at The Anarchist Library", url: "https://theanarchistlibrary.org/category/author/william-godwin" },
    books: [
      { title: "An Enquiry Concerning Political Justice", isbn: "9780199642625" },
      { title: "Caleb Williams", isbn: "9781604245554" }
    ],
    name: "William Godwin",
    school: "Philosophical Anarchism",
    years: "1756–1836",
    yearSort: 1756,
    era: "Foundations",
    lane: -2.0,
    parents: [],
    thumb: "img/godwin.jpg",
    thumbPos: "center 22%",
    initials: "WG",
    preview:
      "English philosopher and novelist, the first major exponent of philosophical anarchism. His Enquiry Concerning Political Justice argued that government is inherently corrupting and that reason and voluntary cooperation can replace it."
  },
  {
    id: "de-cleyre",
    orgs: ["anti-auth"],
    quote: "Core idea: anarchism without adjectives: the various schools of anarchism should cooperate rather than quarrel over blueprints; what matters is the shared commitment to liberty, with each person free to pursue their own vision.",
    archive: { label: "De Cleyre at The Anarchist Library", url: "https://theanarchistlibrary.org/category/author/voltairine-de-cleyre" },
    books: [
      { title: "Selected Works of Voltairine de Cleyre", isbn: "9780548186121" }
    ],
    name: "Voltairine de Cleyre",
    school: "Anarcha-Feminism · Anarchism Without Adjectives",
    years: "1866–1912",
    yearSort: 1900,
    era: "Anarchism widens",
    lane: -2.3,
    parents: ["bakunin", "stirner"],
    thumb: "img/de-cleyre.jpg",
    thumbPos: "center 22%",
    initials: "VC",
    preview:
      "American anarchist and feminist whose eloquent essays bridged individualist and social anarchism. Championed 'anarchism without adjectives' and wrote brilliantly on direct action, women's oppression, and the case for voluntary organization."
  },
  {
    id: "mariategui",
    orgs: ["third-intl"],
    quote: "We do not wish that socialism in America be a tracing or a copy. It must be a heroic creation.",
    archive: { label: "Mariátegui Archive (Marxists.org)", url: "https://www.marxists.org/archive/mariateg/index.htm" },
    books: [
      { title: "Seven Interpretive Essays on Peruvian Reality" }
    ],
    name: "José Carlos Mariátegui",
    school: "Latin American Marxism · Indigenous Socialism",
    years: "1894–1930",
    yearSort: 1928,
    era: "Revolution in the global South",
    lane: -0.8,
    parents: ["marx", "gramsci"],
    thumb: "img/mariategui.jpg",
    thumbPos: "center 22%",
    initials: "JM",
    preview:
      "Peruvian Marxist who argued that Latin American socialism must be a 'heroic creation' rooted in Indigenous communal traditions, not a copy of European models. His Seven Interpretive Essays made him the founder of decolonial Marxism."
  },
  {
    id: "cabral",
    orgs: [],
    quote: "Tell no lies, claim no easy victories.",
    archive: { label: "Cabral Archive (Marxists.org)", url: "" },
    books: [
      { title: "Unity and Struggle", isbn: "9780853456254" },
      { title: "Return to the Source", isbn: "9781685900052" }
    ],
    name: "Amílcar Cabral",
    school: "African Liberation · Revolutionary Marxism",
    years: "1924–1973",
    yearSort: 1963,
    era: "Revolution in the global South",
    lane: -0.9,
    parents: ["marx", "fanon"],
    thumb: "img/cabral.png",
    thumbPos: "center 22%",
    initials: "AC",
    preview:
      "Agronomist, revolutionary, and founding leader of the PAIGC in Guinea-Bissau and Cape Verde. His synthesis of class analysis, cultural resistance, and practical organizing made him one of Africa's greatest liberation theorists."
  },
  {
    id: "clrjames",
    orgs: ["fourth-intl"],
    quote: "Core idea: every cook can govern; the working class, through its own self-activity and democratic councils, is fully capable of running society without a vanguard state or party bureaucracy.",
    archive: { label: "James Archive (Marxists.org)", url: "https://www.marxists.org/archive/james-clr/index.htm" },
    books: [
      { title: "The Black Jacobins", isbn: "9780679724674" },
      { title: "Beyond a Boundary", isbn: "9780822355632" }
    ],
    name: "C. L. R. James",
    tag: "C. L. R. James",
    school: "Pan-Africanism · Libertarian Marxism",
    years: "1901–1989",
    yearSort: 1938,
    era: "Race and revolution",
    lane: -0.5,
    parents: ["marx", "trotsky", "dubois"],
    thumb: "img/clrjames.png",
    thumbPos: "center 22%",
    initials: "CJ",
    preview:
      "Trinidadian Marxist historian whose The Black Jacobins gave the Haitian Revolution its definitive account. Combined Trotskyism with Pan-Africanism and argued that ordinary people are fully capable of democratic self-rule."
  },
  {
    id: "davis",
    orgs: [],
    quote: "I am no longer accepting the things I cannot change. I am changing the things I cannot accept.",
    archive: { label: "Davis Reference Archive (Marxists.org)", url: "" },
    books: [
      { title: "Women, Race and Class", isbn: "9780307798497" },
      { title: "Are Prisons Obsolete?", isbn: "9781583225813" }
    ],
    name: "Angela Davis",
    school: "Marxist Feminism · Prison Abolition",
    years: "1944–",
    yearSort: 1981,
    era: "Race and revolution",
    lane: -0.8,
    parents: ["marx", "dubois", "marcuse", "fanon"],
    thumb: "img/davis.jpg",
    thumbPos: "center 22%",
    initials: "AD",
    preview:
      "American Marxist feminist, philosopher, and prison abolitionist. Her Women, Race and Class traced the linked histories of abolition, suffrage, and labor struggles, centering Black women's liberation as key to any progressive project."
  },
  {
    id: "gorter",
    orgs: ["third-intl"],
    quote: "Core idea: the Western revolution must be a mass movement of the working class itself, organized through workers' councils; the Bolshevik model of party-led minority insurrection is inapplicable in the advanced capitalist West.",
    archive: { label: "Gorter Archive (Marxists.org)", url: "https://www.marxists.org/archive/gorter/index.htm" },
    books: [
      { title: "Open Letter to Comrade Lenin", isbn: "9781467903240" }
    ],
    name: "Herman Gorter",
    school: "Council Communism · Libertarian Marxism",
    years: "1864–1927",
    yearSort: 1920,
    era: "Marxism from below",
    lane: 0.7,
    parents: ["marx", "luxemburg"],
    thumb: "img/gorter.jpg",
    thumbPos: "center 22%",
    initials: "HG",
    preview:
      "Dutch poet and Marxist who broke with Lenin over the role of the party, becoming a leading theorist of council communism. Argued that only workers' councils, not parties or unions, could lead socialist revolution in the West."
  },
  {
    id: "ruhle",
    orgs: ["second-intl", "third-intl"],
    quote: "Core idea: the party form itself is a bourgeois inheritance that reproduces class division between leaders and led; the workers' council is the authentic organ of proletarian self-emancipation.",
    archive: { label: "Rühle Archive (Marxists.org)", url: "https://www.marxists.org/archive/ruhle/index.htm" },
    books: [
      { title: "Karl Marx: His Life and Work", isbn: "9781453779422" }
    ],
    name: "Otto Rühle",
    school: "Council Communism",
    years: "1874–1943",
    yearSort: 1920,
    era: "Marxism from below",
    lane: 0.8,
    parents: ["marx", "pannekoek"],
    thumb: "img/ruhle.jpg",
    thumbPos: "center 22%",
    initials: "OR",
    preview:
      "German Marxist and council communist who moved from the SPD left to the KAPD. One of only two Reichstag deputies to vote against war credits in 1915; argued that the party form itself reproduces class division."
  },
  {
    id: "serge",
    orgs: ["third-intl", "fourth-intl"],
    quote: "Core idea: the revolution must be defended as a liberation, not merely as a new regime; the means prefigure the ends, and the revolution devours those who are not truly its children.",
    archive: { label: "Serge Archive (Marxists.org)", url: "https://www.marxists.org/archive/serge/index.htm" },
    books: [
      { title: "Memoirs of a Revolutionary", isbn: "9781590174517" },
      { title: "Year One of the Russian Revolution", isbn: "9781608466092" }
    ],
    name: "Victor Serge",
    school: "Libertarian Bolshevism · Anti-Stalinism",
    years: "1890–1947",
    yearSort: 1930,
    era: "The left opposition",
    lane: -1.2,
    parents: ["trotsky", "bakunin"],
    thumb: "img/serge.jpg",
    thumbPos: "center 22%",
    initials: "VS",
    preview:
      "Russian-born writer and revolutionary whose path from anarchism to Bolshevism to anti-Stalinist opposition made him an indispensable chronicler of the revolution's degeneration. His memoirs are a classic of participant history."
  },
  {
    id: "liebknecht-k",
    orgs: ["second-intl"],
    quote: "The main enemy is at home.",
    archive: { label: "Liebknecht Archive (Marxists.org)", url: "https://www.marxists.org/archive/liebknecht-k/index.htm" },
    books: [
      { title: "Militarism", isbn: "9781551643410" }
    ],
    name: "Karl Liebknecht",
    school: "Revolutionary Marxism · Spartacism",
    years: "1871–1919",
    yearSort: 1918,
    era: "The democratic revolutionary",
    lane: 0.6,
    parents: ["marx", "luxemburg"],
    thumb: "img/liebknecht-k.jpg",
    thumbPos: "center 22%",
    initials: "KL",
    preview:
      "German Marxist lawyer who was the only Reichstag deputy to vote against war credits in 1914. Co-founded the Spartacus League and KPD with Rosa Luxemburg; murdered by Freikorps in 1919 after the failed Spartacist uprising."
  },
  {
    id: "adorno",
    orgs: ["frankfurt"],
    quote: "There is no right life in the wrong one.",
    archive: { label: "Adorno Reference Archive (Marxists.org)", url: "https://www.marxists.org/reference/archive/adorno/index.htm" },
    books: [
      { title: "Dialectic of Enlightenment", isbn: "9780804736329" },
      { title: "Minima Moralia", isbn: "9781788738538" }
    ],
    name: "Theodor W. Adorno",
    school: "Frankfurt School · Critical Theory",
    years: "1903–1969",
    yearSort: 1944,
    era: "Marxism in the West",
    lane: -1.3,
    parents: ["marx", "horkheimer", "benjamin"],
    thumb: "img/adorno.jpg",
    thumbPos: "center 22%",
    initials: "TA",
    preview:
      "German philosopher and leading Frankfurt School theorist who critiqued the 'culture industry' for manufacturing conformity. His Negative Dialectics insisted philosophy's task was to resist all affirmative ideologies, including positivism and Soviet Marxism."
  },
  {
    id: "benjamin",
    orgs: ["frankfurt"],
    quote: "Even the dead will not be safe from the enemy if he wins. And this enemy has not ceased to be victorious.",
    archive: { label: "Benjamin Reference Archive (Marxists.org)", url: "https://www.marxists.org/reference/archive/benjamin/index.htm" },
    books: [
      { title: "The Work of Art in the Age of Mechanical Reproduction", isbn: "9780359046393" },
      { title: "Theses on the Philosophy of History", isbn: "9780547540658" }
    ],
    name: "Walter Benjamin",
    school: "Frankfurt School · Cultural Criticism",
    years: "1892–1940",
    yearSort: 1936,
    era: "Marxism in the West",
    lane: -1.5,
    parents: ["marx"],
    thumb: "img/benjamin.jpg",
    thumbPos: "center 22%",
    initials: "WB",
    preview:
      "German Jewish philosopher and cultural critic who combined Marxism with Jewish mysticism. His essays on art, history, and cities influenced literary theory, art history, and radical thought across disciplines."
  },
  {
    id: "fromm",
    orgs: ["frankfurt"],
    quote: "Man's main task in life is to give birth to himself, to become what he potentially is.",
    archive: { label: "Fromm Archive (Marxists.org)", url: "" },
    books: [
      { title: "Escape from Freedom", isbn: "9780805031492" },
      { title: "The Sane Society", isbn: "9781480402515" }
    ],
    name: "Erich Fromm",
    school: "Humanist Marxism · Freudo-Marxism",
    years: "1900–1980",
    yearSort: 1941,
    era: "Marxism in the West",
    lane: 0.2,
    parents: ["marx", "horkheimer"],
    thumb: "img/fromm.jpg",
    thumbPos: "center 22%",
    initials: "EF",
    preview:
      "German-American psychoanalyst who fused Freud and Marx into a humanist critique of both capitalism and Soviet communism. Argued modern society creates a 'fear of freedom' and that a democratic socialist 'sane society' is achievable."
  },
  {
    id: "althusser",
    orgs: [],
    quote: "Ideology represents the imaginary relationship of individuals to their real conditions of existence.",
    archive: { label: "Althusser Archive (Marxists.org)", url: "https://www.marxists.org/reference/archive/althusser/index.htm" },
    books: [
      { title: "For Marx", isbn: "9781844670529" },
      { title: "Reading Capital", isbn: "9781844673476" }
    ],
    name: "Louis Althusser",
    school: "Structural Marxism",
    years: "1918–1990",
    yearSort: 1965,
    era: "Marxism in the West",
    lane: 0.0,
    parents: ["marx", "lenin", "gramsci"],
    thumb: "img/althusser.jpg",
    thumbPos: "center 22%",
    initials: "LA",
    preview:
      "French Marxist philosopher who proposed an 'epistemological break' between the young humanist Marx and the mature scientific Marx. His structuralist reading of Capital and theory of ideology were enormously influential."
  },
  {
    id: "federici",
    orgs: [],
    quote: "Core idea: capitalism was built on the expropriation of women's bodies and unpaid reproductive labor; the witch hunts were not medieval superstition but a rational campaign of terror to enforce the new gender order required by primitive accumulation.",
    archive: { label: "Federici Reference Archive (Marxists.org)", url: "" },
    books: [
      { title: "Caliban and the Witch", isbn: "9781570270598" }
    ],
    name: "Silvia Federici",
    school: "Marxist Feminism · Autonomism",
    years: "1942–",
    yearSort: 2004,
    era: "Race and revolution",
    lane: -1.2,
    parents: ["marx", "davis", "luxemburg", "selma-james"],
    thumb: "img/federici.jpg",
    thumbPos: "center 22%",
    initials: "SF",
    preview:
      "Italian-American Marxist feminist and Wages for Housework co-founder. Her Caliban and the Witch argued that the subjugation of women's bodies was as foundational to capitalism as the enclosure of land."
  },
  {
    id: "sartre",
    orgs: [],
    quote: "Man is condemned to be free; because once thrown into the world, he is responsible for everything he does.",
    archive: { label: "Sartre Reference Archive (Marxists.org)", url: "https://www.marxists.org/reference/archive/sartre/index.htm" },
    books: [
      { title: "Being and Nothingness" },
      { title: "Critique of Dialectical Reason", isbn: "9781859844854" }
    ],
    name: "Jean-Paul Sartre",
    school: "Existentialist Marxism",
    years: "1905–1980",
    yearSort: 1943,
    era: "Marxism in the West",
    lane: -0.8,
    parents: ["marx"],
    thumb: "img/sartre.jpg",
    thumbPos: "center 22%",
    initials: "JS",
    preview:
      "French philosopher and the most prominent intellectual of the post-war left, who attempted to reconcile existentialism with Marxism. Argued Marxism remains the 'unsurpassable horizon of our time' but required re-grounding in individual praxis."
  },
  {
    id: "thompson",
    orgs: [],
    quote: "Class happens when some men, as a result of common experiences, feel and articulate the identity of their interests as against other men whose interests are different from theirs.",
    archive: { label: "Thompson Reference Archive (Marxists.org)", url: "" },
    books: [
      { title: "The Making of the English Working Class", isbn: "9780394703220" }
    ],
    name: "E. P. Thompson",
    school: "Socialist Humanism · History from Below",
    years: "1924–1993",
    yearSort: 1963,
    era: "Marxism in the West",
    lane: 0.5,
    parents: ["marx", "gramsci"],
    thumb: "img/thompson.jpg",
    thumbPos: "center 22%",
    initials: "ET",
    preview:
      "English historian and peace activist whose The Making of the English Working Class rescued the losers of history 'from the enormous condescension of posterity.' Defended historical agency against structuralist Marxism."
  },
  {
    id: "guevara",
    orgs: [],
    quote: "Let me say, at the risk of seeming ridiculous, that the true revolutionary is guided by great feelings of love.",
    archive: { label: "Guevara Archive (Marxists.org)", url: "https://www.marxists.org/archive/guevara/index.htm" },
    books: [
      { title: "Guerrilla Warfare", isbn: "9789391181932" },
      { title: "The Motorcycle Diaries", isbn: "9781876175702" }
    ],
    name: "Che Guevara",
    school: "Marxism–Leninism · Guevarism",
    years: "1928–1967",
    yearSort: 1960,
    era: "Revolution in the global South",
    lane: -0.7,
    parents: ["marx", "lenin", "mao"],
    thumb: "img/guevara.jpg",
    thumbPos: "center 22%",
    initials: "CG",
    preview:
      "Argentine-born revolutionary, a central leader of the Cuban Revolution, and the most famous internationalist martyr of the twentieth century. His theory of the foco and call for 'two, three, many Vietnams' inspired global insurgencies."
  },
  {
    id: "harvey",
    orgs: [],
    quote: "The right to the city is far more than the individual liberty to access urban resources: it is a right to change ourselves by changing the city.",
    archive: { label: "Harvey Reference Archive (Marxists.org)", url: "" },
    books: [
      { title: "A Brief History of Neoliberalism", isbn: "9781799978015" },
      { title: "The Limits to Capital", isbn: "9781844670956" }
    ],
    name: "David Harvey",
    school: "Marxist Geography · Spatial Theory",
    years: "1935–",
    yearSort: 1982,
    era: "Marxism in the West",
    lane: 0.4,
    parents: ["marx", "luxemburg", "lenin"],
    thumb: "img/harvey.png",
    thumbPos: "center 22%",
    initials: "DH",
    preview:
      "British geographer and the most widely read living Marxist scholar. His concept of the 'spatial fix' showed how capitalism resolves contradictions by building and destroying space, and his lectures on Capital have reached millions."
  },
  {
    id: "poulantzas",
    orgs: [],
    quote: "The state is a social relation; it is the condensation of a balance of forces.",
    archive: { label: "Poulantzas Reference Archive (Marxists.org)", url: "" },
    books: [
      { title: "State, Power, Socialism", isbn: "9781859842744" },
      { title: "Political Power and Social Classes" }
    ],
    name: "Nicos Poulantzas",
    school: "Structural Marxism · State Theory",
    years: "1936–1979",
    yearSort: 1978,
    era: "Marxism in the West",
    lane: 0.2,
    parents: ["marx", "althusser", "gramsci"],
    thumb: "img/poulantzas.jpg",
    thumbPos: "center 22%",
    initials: "NP",
    preview:
      "Greek-French Marxist who developed the most sophisticated structuralist theory of the capitalist state. Argued the state is 'relatively autonomous' from any single fraction of capital, existing as a condensation of class forces."
  },
  {
    id: "graeber",
    orgs: ["anti-auth"],
    quote: "The ultimate, hidden truth of the world is that it is something that we make, and could just as easily make differently.",
    archive: { label: "Graeber at The Anarchist Library", url: "https://theanarchistlibrary.org/category/author/david-graeber" },
    books: [
      { title: "Debt: The First 5,000 Years", isbn: "9781612194202" },
      { title: "The Dawn of Everything", isbn: "9786075694160" },
      { title: "Bullshit Jobs", isbn: "9781501143342" }
    ],
    name: "David Graeber",
    school: "Anarchist Anthropology · Communalism",
    years: "1961–2020",
    yearSort: 2011,
    era: "The synthesis",
    lane: -1.6,
    parents: ["kropotkin", "bookchin", "scott"],
    thumb: "img/graeber.jpg",
    thumbPos: "center 22%",
    initials: "GR",
    preview:
      "American anthropologist and anarchist whose Debt: The First 5,000 Years overturned conventional economic history. A central Occupy Wall Street organizer, he argued that the world we inhabit is one we collectively make and can remake."
  },
  {
    id: "horkheimer",
    orgs: ["frankfurt"],
    quote: "If you do not want to talk about capitalism, then you had better keep quiet about fascism.",
    archive: { label: "Horkheimer Reference Archive (Marxists.org)", url: "https://www.marxists.org/reference/archive/horkheimer/index.htm" },
    books: [
      { title: "Dialectic of Enlightenment", isbn: "9780804736329" },
      { title: "Eclipse of Reason", isbn: "9781443730419" },
      { title: "Critical Theory: Selected Essays", isbn: "9780826400833" }
    ],
    name: "Max Horkheimer",
    school: "Critical Theory · Frankfurt School",
    years: "1895–1973",
    yearSort: 1936,
    era: "Marxism in the West",
    lane: -1.3,
    parents: ["marx"],
    pinNear: "adorno",
    thumb: "img/horkheimer.jpg",
    thumbPos: "center 20%",
    initials: "MH",
    preview:
      "German philosopher and sociologist who directed the Frankfurt School's Institute for Social Research and coined 'critical theory.' Co-authored Dialectic of Enlightenment with Adorno."
  },
  {
    id: "rocker",
    orgs: ["anti-auth"],
    quote: "Political rights do not originate in parliaments; they are forced upon them from without.",
    archive: { label: "Rocker at The Anarchist Library", url: "https://theanarchistlibrary.org/category/author/rudolf-rocker" },
    books: [
      { title: "Anarcho-Syndicalism: Theory and Practice", isbn: "9780745313870" },
      { title: "Nationalism and Culture", isbn: "9781551640945" }
    ],
    name: "Rudolf Rocker",
    school: "Anarcho-Syndicalism",
    years: "1873–1958",
    yearSort: 1925,
    era: "Anarchism in the 20th century",
    parents: ["kropotkin", "parsons"],
    thumb: "img/rocker.jpg",
    thumbPos: "center 20%",
    initials: "RR",
    preview:
      "German anarcho-syndicalist and the current's foremost theorist. His Anarcho-Syndicalism tied anarchism to the revolutionary labor union, and he helped found the syndicalist International Workers' Association."
  },
  {
    id: "chomsky",
    orgs: ["anti-auth"],
    quote: "If you assume that there is no hope, you guarantee that there will be no hope.",
    archive: { label: "Chomsky at The Anarchist Library", url: "https://theanarchistlibrary.org/category/author/noam-chomsky" },
    books: [
      { title: "On Anarchism", isbn: "9781595589101" },
      { title: "Understanding Power", isbn: "9781565847033" },
      { title: "Manufacturing Consent", isbn: "9780099533115" }
    ],
    name: "Noam Chomsky",
    school: "Anarcho-Syndicalism · Libertarian Socialism",
    years: "1928–present",
    yearSort: 1970,
    era: "Anarchism in the 20th century",
    parents: ["rocker", "bakunin", "kropotkin"],
    thumb: "img/chomsky.jpg",
    thumbPos: "center 18%",
    initials: "NC",
    preview:
      "Linguist and the most prominent living anarchist, a self-described anarcho-syndicalist who traces his politics to Rocker and Kropotkin. A relentless critic of US foreign policy and corporate media power."
  },
  {
    id: "scott",
    orgs: [],
    quote: "Core idea: states make society 'legible' in order to control it, and much human freedom survives in the everyday practices that resist that legibility.",
    archive: { label: "James C. Scott", url: "" },
    books: [
      { title: "Seeing Like a State", isbn: "9780300246759" },
      { title: "The Art of Not Being Governed", isbn: "9780300169171" },
      { title: "Two Cheers for Anarchism", isbn: "9780691161037" }
    ],
    name: "James C. Scott",
    school: "Anarchist Anthropology · Agrarian Studies",
    years: "1936–2024",
    yearSort: 2005,
    era: "The new anarchism",
    parents: ["kropotkin"],
    thumb: "img/scott.jpg",
    thumbPos: "center 22%",
    initials: "JC",
    preview:
      "Political scientist and anthropologist whose Seeing Like a State and Two Cheers for Anarchism made him a touchstone for anti-statist thought, and a close intellectual neighbor of Graeber's anarchist anthropology."
  },
  {
    id: "landauer",
    orgs: ["anti-auth"],
    quote: "The state is a relationship between human beings; we destroy it by contracting other relationships, by behaving differently toward one another.",
    archive: { label: "Landauer at The Anarchist Library", url: "https://theanarchistlibrary.org/category/author/gustav-landauer" },
    books: [
      { title: "For Socialism", isbn: "9781547120147" },
      { title: "Revolution and Other Writings", isbn: "9781604864137" }
    ],
    name: "Gustav Landauer",
    school: "Communitarian Anarchism",
    years: "1870–1919",
    yearSort: 1907,
    era: "Anarchism in the 20th century",
    parents: ["kropotkin"],
    thumb: "img/landauer.jpg",
    thumbPos: "center 20%",
    initials: "GL",
    preview:
      "German anarchist who saw the state as a relationship to be undone by living differently, not an institution to be smashed. His communitarian anarchism influenced Martin Buber and Murray Bookchin; murdered in the crushing of the Bavarian Soviet Republic in 1919."
  },
  {
    id: "durruti",
    orgs: ["anti-auth"],
    quote: "We are not in the least afraid of ruins. We carry a new world, here, in our hearts.",
    archive: { label: "Durruti at The Anarchist Library", url: "https://theanarchistlibrary.org/category/author/buenaventura-durruti" },
    books: [
      { title: "Durruti in the Spanish Revolution" }
    ],
    name: "Buenaventura Durruti",
    school: "Anarcho-Syndicalism · Spanish Revolution",
    years: "1896–1936",
    yearSort: 1936,
    era: "Anarchism in the 20th century",
    parents: ["malatesta", "parsons"],
    thumb: "img/durruti.jpg",
    thumbPos: "center 20%",
    initials: "BD",
    preview:
      "Spanish anarchist militant of the CNT-FAI and a central figure of the 1936 revolution, when workers collectivised much of Catalonia. He died at the siege of Madrid; his funeral drew hundreds of thousands."
  },
  {
    id: "ward",
    orgs: ["anti-auth"],
    quote: "An anarchist society, a society which organises itself without authority, is always in existence, like a seed beneath the snow.",
    archive: { label: "Ward at The Anarchist Library", url: "https://theanarchistlibrary.org/category/author/colin-ward" },
    books: [
      { title: "Anarchy in Action", isbn: "9781629632384" },
      { title: "Talking Anarchy", isbn: "9781604868128" }
    ],
    name: "Colin Ward",
    school: "Anarchism · Everyday Anarchy",
    years: "1924–2010",
    yearSort: 1973,
    era: "The new anarchism",
    parents: ["kropotkin", "landauer"],
    thumb: "img/ward.jpg",
    thumbPos: "center 20%",
    initials: "CW",
    preview:
      "British anarchist who located anarchy not in a future revolution but in the cooperative self-organisation already woven through everyday life. His Anarchy in Action drew directly on Kropotkin's mutual aid."
  },
  {
    id: "berkman",
    orgs: ["anti-auth"],
    quote: "Anarchism teaches that we can live in a society where there is no compulsion of any kind.",
    archive: { label: "Berkman at The Anarchist Library", url: "https://theanarchistlibrary.org/category/author/alexander-berkman" },
    books: [
      { title: "Prison Memoirs of an Anarchist", isbn: "9781984292698" },
      { title: "What Is Anarchism?", isbn: "9780948984112" }
    ],
    name: "Alexander Berkman",
    school: "Anarchist Communism",
    years: "1870–1936",
    yearSort: 1912,
    era: "Anarchism in the 20th century",
    parents: ["kropotkin"],
    pinNear: "goldman",
    thumb: "img/berkman.jpg",
    thumbPos: "center 20%",
    initials: "AB",
    preview:
      "Russian-American anarchist and Emma Goldman's lifelong comrade, who served fourteen years for the attempted killing of industrialist Henry Clay Frick. His ABC of Anarchism remains a classic primer; he too broke with the Bolsheviks after Kronstadt."
  },
  {
    id: "parsons",
    orgs: ["anti-auth", "industrial"],
    quote: "Never be deceived that the rich will permit you to vote away their wealth.",
    archive: { label: "Parsons at The Anarchist Library", url: "https://theanarchistlibrary.org/category/author/lucy-e-parsons" },
    books: [
      { title: "Lucy Parsons: Freedom, Equality, and Solidarity", isbn: "9780882860121" }
    ],
    name: "Lucy Parsons",
    school: "Anarcho-Communism · Labor Anarchism",
    years: "1851–1942",
    yearSort: 1905,
    era: "Anarchism in the 20th century",
    parents: ["kropotkin"],
    thumb: "img/parsons.jpg",
    thumbPos: "center 22%",
    initials: "LP",
    preview:
      "American labor organizer and anarcho-communist, widow of Haymarket martyr Albert Parsons and a founder of the IWW. Of Black, Indigenous, and Mexican heritage, she was called by Chicago police 'more dangerous than a thousand rioters.'"
  },
  {
    id: "tristan",
    orgs: [],
    quote: "Core idea: the woman is the proletarian of the proletarian himself; there is no emancipation of the workers without the emancipation of women.",
    archive: { label: "Flora Tristan Reference Archive", url: "" },
    books: [
      { title: "The Workers' Union", isbn: "9780252075292" },
      { title: "Peregrinations of a Pariah", isbn: "9782911571275" }
    ],
    name: "Flora Tristan",
    school: "Utopian Socialism · Socialist Feminism",
    years: "1803–1844",
    yearSort: 1842,
    era: "Precursors",
    parents: ["fourier", "saint-simon"],
    thumb: "img/tristan.jpg",
    thumbPos: "center 22%",
    initials: "FT",
    preview:
      "French-Peruvian socialist and feminist who, ahead of Marx, called for an international union of workers and tied the emancipation of labour to the emancipation of women. A foundational figure of socialist feminism."
  },
  {
    id: "zetkin",
    orgs: ["second-intl", "third-intl"],
    quote: "The liberation of women, like that of the whole human race, will be the work of the emancipation of labour from capital.",
    archive: { label: "Clara Zetkin Internet Archive (Marxists.org)", url: "https://www.marxists.org/archive/zetkin/index.htm" },
    books: [
      { title: "Selected Writings", isbn: "9781608463909" },
      { title: "Fighting Fascism: How to Struggle and How to Win", isbn: "9781608468522" }
    ],
    name: "Clara Zetkin",
    school: "Marxism · Socialist Feminism",
    years: "1857–1933",
    yearSort: 1898,
    era: "The Second International",
    parents: ["marx", "engels", "tristan"],
    thumb: "img/zetkin.jpg",
    thumbPos: "center 20%",
    initials: "CZ",
    preview:
      "German Marxist and leader of the socialist women's movement who proposed International Women's Day. A founder of the Spartacus League and the German Communist Party, and a sharp early theorist of the fight against fascism."
  },
  {
    id: "pankhurst",
    orgs: ["third-intl"],
    quote: "I am going to fight capitalism even if it kills me. It is wrong that people like me should be comfortable when other people are starving.",
    archive: { label: "Sylvia Pankhurst Archive (Marxists.org)", url: "https://www.marxists.org/archive/pankhurst-sylvia/index.htm" },
    books: [
      { title: "The Suffragette Movement", isbn: "9781446514184" },
      { title: "Soviet Russia As I Saw It" }
    ],
    name: "Sylvia Pankhurst",
    school: "Council Communism · Socialist Feminism",
    years: "1882–1960",
    yearSort: 1919,
    era: "Revolution and after",
    parents: ["marx", "luxemburg", "zetkin"],
    thumb: "img/pankhurst.webp",
    thumbPos: "center 20%",
    initials: "SP",
    preview:
      "British suffragette who moved from the women's franchise struggle to revolutionary communism and workers' councils, editing the Workers' Dreadnought. Lenin criticised her 'left-wing' communism; she later devoted herself to anti-fascism and Ethiopian independence."
  },
  {
    id: "beauvoir",
    orgs: [],
    quote: "One is not born, but rather becomes, a woman.",
    archive: { label: "Simone de Beauvoir Reference Archive", url: "" },
    books: [
      { title: "The Second Sex", isbn: "9782070323524" },
      { title: "The Ethics of Ambiguity", isbn: "9781480442801" }
    ],
    name: "Simone de Beauvoir",
    school: "Existentialist Feminism · Marxism",
    years: "1908–1986",
    yearSort: 1948,
    era: "Existential / New Left",
    parents: ["marx", "sartre"],
    thumb: "img/beauvoir.jpg",
    thumbPos: "center 22%",
    initials: "SB",
    preview:
      "French existentialist philosopher whose The Second Sex (1949) founded modern feminist theory with the argument that woman is made, not born. A lifelong socialist who fused existentialism with a materialist analysis of women's oppression."
  },
  {
    id: "dunayevskaya",
    orgs: ["fourth-intl"],
    quote: "Core idea: Marxism is a philosophy of human liberation rooted in Hegel's dialectic, not a theory of economics; freedom is its driving force.",
    archive: { label: "Raya Dunayevskaya Archive (Marxists.org)", url: "https://www.marxists.org/archive/dunayevskaya/index.htm" },
    books: [
      { title: "Marxism and Freedom", isbn: "9781573928199" },
      { title: "Philosophy and Revolution", isbn: "9780739105597" },
      { title: "Rosa Luxemburg, Women's Liberation, and Marx's Philosophy of Revolution", isbn: "9780252061899" }
    ],
    name: "Raya Dunayevskaya",
    school: "Marxist Humanism",
    years: "1910–1987",
    yearSort: 1945,
    era: "Heterodox Marxisms",
    parents: ["trotsky", "clrjames"],
    thumb: "img/dunayevskaya.jpg",
    thumbPos: "center 22%",
    initials: "RD",
    preview:
      "Russian-American revolutionary who served as Trotsky's Russian-language secretary, broke with him over the class nature of the USSR, and with C.L.R. James founded the Johnson-Forest Tendency. Founder of Marxist-Humanism in the United States."
  },
  {
    id: "selma-james",
    orgs: [],
    quote: "Core idea: the unwaged housework of women is the hidden foundation of capitalist production; 'wages for housework' names that exploitation and demands its end.",
    archive: { label: "Selma James Reference Archive", url: "" },
    books: [
      { title: "The Power of Women and the Subversion of the Community" },
      { title: "Sex, Race and Class", isbn: "9781604864540" }
    ],
    name: "Selma James",
    tag: "S. James",
    school: "Marxist Feminism · Wages for Housework",
    years: "b. 1930",
    yearSort: 1968,
    era: "Autonomist feminism",
    parents: ["clrjames", "marx"],
    thumb: "img/selma-james.jpg",
    thumbPos: "center 22%",
    initials: "SJ",
    preview:
      "American-British activist and writer who launched the International Wages for Housework Campaign in 1972, arguing that women's unpaid domestic labour underpins all capitalist production. A collaborator of C.L.R. James and a founder of the Global Women's Strike."
  },
  {
    id: "lorde",
    orgs: [],
    quote: "The master's tools will never dismantle the master's house.",
    archive: { label: "Audre Lorde Reference Archive", url: "" },
    books: [
      { title: "Sister Outsider", isbn: "9781799984467" },
      { title: "Zami: A New Spelling of My Name", isbn: "9780895941220" }
    ],
    name: "Audre Lorde",
    school: "Black Feminism · Queer Theory",
    years: "1934–1992",
    yearSort: 1979,
    era: "Black radical feminism",
    parents: ["dubois", "fanon"],
    thumb: "img/lorde.jpg",
    thumbPos: "center 22%",
    initials: "AL",
    preview:
      "American poet and theorist who described herself as 'black, lesbian, mother, warrior, poet.' Insisted that there is no single-issue struggle because we do not live single-issue lives, and that difference is a source of power rather than division."
  },
  {
    id: "mies",
    orgs: [],
    quote: "Core idea: capitalist accumulation rests on the colonisation of women, nature, and the global South, all treated as free resources to be exploited.",
    archive: { label: "Maria Mies Reference Archive", url: "" },
    books: [
      { title: "Patriarchy and Accumulation on a World Scale", isbn: "9781350348189" },
      { title: "Ecofeminism", isbn: "9781350379886" }
    ],
    name: "Maria Mies",
    school: "Ecofeminism · Marxist Feminism",
    years: "1931–2023",
    yearSort: 1986,
    era: "Ecological & feminist Marxism",
    parents: ["marx", "luxemburg"],
    thumb: "img/mies.png",
    thumbPos: "center 22%",
    initials: "MM",
    preview:
      "German sociologist and ecofeminist who argued that capitalism depends on the unpaid 'housewifised' labour of women and the plunder of the colonies and nature. With Vandana Shiva she helped found the ecofeminist current."
  },
  {
    id: "hooks",
    orgs: [],
    quote: "Feminism is a movement to end sexism, sexist exploitation, and oppression.",
    archive: { label: "bell hooks Reference Archive", url: "" },
    books: [
      { title: "Ain't I a Woman: Black Women and Feminism", isbn: "9781138821514" },
      { title: "Feminism Is for Everybody", isbn: "9781138821620" },
      { title: "Where We Stand: Class Matters", isbn: "9780415929134" }
    ],
    name: "bell hooks",
    school: "Black Feminism · Intersectionality",
    years: "1952–2021",
    yearSort: 1990,
    era: "Intersectional feminism",
    parents: ["davis", "lorde", "beauvoir"],
    thumb: "img/hooks.jpg",
    thumbPos: "center 22%",
    initials: "bh",
    preview:
      "American feminist theorist (born Gloria Jean Watkins) who centred the experience of Black working-class women and insisted that race, class, and gender oppression are interlocking. Wrote accessibly to make feminism a movement for everybody."
  },
  {
    id: "fraser",
    orgs: [],
    quote: "Core idea: justice requires both economic redistribution and cultural recognition; a feminism that forgets capitalism becomes its handmaiden.",
    archive: { label: "Nancy Fraser Reference Archive", url: "" },
    books: [
      { title: "Fortunes of Feminism", isbn: "9781788738576" },
      { title: "Cannibal Capitalism", isbn: "9781839761232" }
    ],
    name: "Nancy Fraser",
    school: "Socialist Feminism · Critical Theory",
    years: "b. 1947",
    yearSort: 1995,
    era: "Contemporary critical theory",
    parents: ["marx", "marcuse"],
    thumb: "img/fraser.jpg",
    thumbPos: "center 22%",
    initials: "NF",
    preview:
      "American critical theorist who argues that justice demands both redistribution and recognition, and that mainstream 'lean-in' feminism has been captured by capitalism. A leading voice for a socialist, anti-capitalist feminism."
  },
  {
    id: "zizek",
    orgs: [],
    quote: "Core idea: ideology is not a false picture we can simply see through; we keep obeying it even when we know better, because it structures our desire itself.",
    archive: { label: "Slavoj Žižek Reference Archive", url: "" },
    books: [
      { title: "The Sublime Object of Ideology", isbn: "9781844673001" },
      { title: "First as Tragedy, Then as Farce", isbn: "9781786635938" },
      { title: "Living in the End Times", isbn: "9781844677023" }
    ],
    name: "Slavoj Žižek",
    school: "Hegelian Marxism · Psychoanalysis",
    years: "b. 1949",
    yearSort: 1992,
    era: "Contemporary",
    parents: ["marx", "lenin", "althusser"],
    thumb: "img/zizek.jpg",
    thumbPos: "center 20%",
    initials: "SŽ",
    preview:
      "Slovenian philosopher who fuses Hegel, Marx, and Lacanian psychoanalysis into a restless critique of ideology and global capitalism. Provocative and prolific, he champions a renewed communism while skewering liberal pieties across left and right."
  },
  {
    id: "mcalevey",
    orgs: ["industrial"],
    quote: "Core idea: there are no shortcuts to power. Unions win only by organising the vast majority of workers themselves, testing their strength, and building toward the supermajority strike.",
    archive: { label: "Jane McAlevey Reference Archive", url: "" },
    books: [
      { title: "No Shortcuts: Organizing for Power in the New Gilded Age", isbn: "9780190868659" },
      { title: "A Collective Bargain: Unions, Organizing, and the Fight for Democracy", isbn: "9780062908599" },
      { title: "Raising Expectations (and Raising Hell)", isbn: "9781781683156" }
    ],
    name: "Jane McAlevey",
    school: "Labor Organizing · Rank-and-File Strategy",
    years: "1964–2024",
    yearSort: 2016,
    era: "Contemporary organizing",
    parents: ["luxemburg", "mazzocchi", "ross"],
    thumb: "img/mcalevey.jpg",
    thumbPos: "center 20%",
    initials: "JM",
    preview:
      "American labor organizer and scholar who insisted there are 'no shortcuts' to building worker power: only mass, worker-led organizing and the supermajority strike. Her work revived the rank-and-file tradition for a new generation of unionists."
  },
  {
    id: "mazzocchi",
    orgs: ["industrial"],
    quote: "When you build a big movement from down below, regardless of who's in the White House, you can bring about change.",
    archive: { label: "Tony Mazzocchi Reference Archive", url: "" },
    books: [
      { title: "The Man Who Hated Work and Loved Labor: The Life and Times of Tony Mazzocchi" }
    ],
    name: "Tony Mazzocchi",
    school: "Labor Organizing · Just Transition",
    years: "1926–2002",
    yearSort: 1975,
    era: "Postwar labor militancy",
    parents: ["luxemburg", "gramsci", "connolly"],
    thumb: "img/mazzocchi.webp",
    thumbPos: "center 20%",
    initials: "TM",
    preview:
      "American labor leader of the Oil, Chemical and Atomic Workers, a driving force behind the 1970 OSHA Act. He coined the 'just transition' for workers displaced by environmental change and founded an independent Labor Party."
  },
  {
    id: "ross",
    orgs: [],
    quote: "A good organizer is a social arsonist who goes around setting people on fire.",
    archive: { label: "Fred Ross Reference Archive", url: "" },
    books: [
      { title: "Conquering Goliath: Cesar Chavez at the Beginning" },
      { title: "Axioms for Organizers" }
    ],
    name: "Fred Ross",
    school: "Community Organizing · House Meetings",
    years: "1910–1992",
    yearSort: 1955,
    era: "Postwar community organizing",
    parents: [],
    thumb: "img/ross.jpg",
    thumbPos: "center 20%",
    initials: "FR",
    preview:
      "American community organizer who built the Community Service Organization, developed the 'house meeting' method, and trained a generation of organizers, including Cesar Chavez and Dolores Huerta."
  }
];
