export interface Track {
	id: string;
	uri: string;
	title: string;
	artists: string[];
	album: string;
	addedBy: string;
	release_date: string;
	popularity: number;
}

export type RoundState = {
	score: number;
	track: number;
	guesses: string[];
	solution: Track | null;
};
