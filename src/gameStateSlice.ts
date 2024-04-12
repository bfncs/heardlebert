import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./store";
import { Track } from "./types/types";
// Define a type for the slice state
export interface GameState {
	level: "easy" | "medium" | "hard";
	gameMode: GameMode;
	songSize: number;

	songs: Track[];
	allSongs: Track[];
	currentSong: number;
	score: number;
	playlistName: string;
	numberOfSkips: number | null;
	usernames: string[];
}

export enum GameMode {
	TITLE = "title",
	ARTIST = "artist",
	BOTH = "both",
	ALBUM = "album",
	USER = "user",
	YEAR = "year",
}

export const initialState: GameState = {
	level: "hard",
	gameMode: GameMode.BOTH,
	songSize: 10,
	songs: [],
	allSongs: [],
	currentSong: 0,
	score: 0,
	playlistName: "",
	numberOfSkips: null,
	usernames: [],
};

export const gameStateSlice = createSlice({
	name: "gameState",
	// `createSlice` will infer the state type from the `initialState` argument
	initialState,
	reducers: {
		setSongs: (state, action: PayloadAction<Track[]>) => {
			state.songs = action.payload;
		},
		setLevel: (state, action: PayloadAction<"easy" | "medium" | "hard">) => {
			state.level = action.payload;
		},
		setGameMode: (state, action: PayloadAction<GameMode>) => {
			state.gameMode = action.payload;
		},
		setSongSize: (state, action: PayloadAction<number>) => {
			state.songSize = action.payload;
		},
		setCurrentSong: (state, action: PayloadAction<number>) => {
			state.currentSong = action.payload;
		},
		setScore: (state, action: PayloadAction<number>) => {
			state.score = action.payload;
		},
		setAllSongs: (state, action: PayloadAction<Track[]>) => {
			state.allSongs = action.payload;
		},
		setPlaylistName: (state, action: PayloadAction<string>) => {
			state.playlistName = action.payload;
		},
		setNumberOfSkips: (state, action: PayloadAction<number | null>) => {
			state.numberOfSkips = action.payload;
		},
		setUsernames: (state, action: PayloadAction<string[]>) => {
			state.usernames = action.payload;
		},
	},
});

export const {
	setSongs,
	setLevel,
	setCurrentSong,
	setSongSize,
	setScore,
	setGameMode,
	setAllSongs,
	setPlaylistName,
	setNumberOfSkips,
	setUsernames,
} = gameStateSlice.actions;
