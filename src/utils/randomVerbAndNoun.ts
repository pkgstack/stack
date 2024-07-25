
/**
 * Returns a combination of a random verb and noun from a list of words.
 * @returns {string} A random word
 */
export function randomVerbAndNoun(): string {
	const verbs = [
		"amazing",
		"awesome",
		"beautiful",
		"brilliant",
		"cool",
		"excellent",
		"fabulous",
		"fantastic",
		"incredible",
		"magnificent",
		"marvelous",
		"outstanding",
		"perfect",
		"remarkable",
		"sensational",
		"stunning",
		"superb",
		"terrific",
		"tremendous",
		"wonderful",
		"astonishing",
		"astounding",
		"awe-inspiring",
		"extraordinary",
		"eye-opening",
		"jaw-dropping",
		"miraculous",
		"phenomenal",
	]

	const nouns = [
		"achievement",
		"adventure",
		"amazement",
		"astonishment",
		"awe",
		"bliss",
		"celebration",
		"coolness",
		"delight",
		"eagerness",
		"elevation",
		"elation",
		"euphoria",
		"excitement",
		"exhilaration",
		"exultation",
		"exulting",
		"glory",
		"gratification",
		"high",
		"jubilation",
		"jubilance",
		"joy",
		"joyfulness",
		"joyousness",
		"pride",
		"rapture",
		"rejoicing",
		"revelry",
		"rhapsody",
		"satisfaction",
		"thrill",
		"triumph",
		"victory",
	];

	return `${verbs[Math.floor(Math.random() * verbs.length)]}-${nouns[Math.floor(Math.random() * nouns.length)]}`;
}