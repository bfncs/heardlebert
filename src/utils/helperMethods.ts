import { Track } from "../types/types";
import { GameMode } from "../gameStateSlice";
import classes from "../Game.module.scss";
import React from "react";

export const deleteYearDuplicates = (sortedTracks: Track[]) => {
	const result: Track[] = [];
	for (let i = 0; i < sortedTracks.length; i++) {
		if (
			i === 0 ||
			result.filter((t) => t.release_date === sortedTracks[i].release_date)
				.length === 0
		) {
			result.push(sortedTracks[i]);
		}
	}
	return result.sort((a, b) => a.release_date.localeCompare(b.release_date));
};

export const sortTracks = (tracks: Track[]) => {
	return [...tracks].sort(
		(a, b) =>
			a.artists[0].localeCompare(b.artists[0]) ||
			a.title.localeCompare(b.title),
	);
};

export const deleteDuplicates = (tracks: Track[]) => {
	const sortedTracks = sortTracks(tracks);
	const result: Track[] = [];
	for (let i = 0; i < sortedTracks.length; i++) {
		if (
			i === 0 ||
			sortedTracks[i].artists[0] !== sortedTracks[i - 1].artists[0] ||
			sortedTracks[i].title !== sortedTracks[i - 1].title
		) {
			result.push(sortedTracks[i]);
		}
	}
	return result;
};

export const deleteAlbumDuplicates = (tracks: Track[]): Track[] => {
	const result: Track[] = [];
	for (let i = 0; i < tracks.length; i++) {
		if (
			i === 0 ||
			result.filter((t) => t.album === tracks[i].album).length === 0
		) {
			result.push(tracks[i]);
		}
	}
	return result;
};

export const deleteArtistDuplicates = (tracks: Track[]): Track[] => {
	const result: Track[] = [];
	for (let i = 0; i < tracks.length; i++) {
		if (
			i === 0 ||
			result.filter((t) => t.artists.join(",") === tracks[i].artists.join(","))
				.length === 0
		) {
			result.push(tracks[i]);
		}
	}
	return result;
};

export const deleteUserDuplicates = (tracks: Track[]): Track[] => {
	const result: Track[] = [];
	for (let i = 0; i < tracks.length; i++) {
		if (
			i === 0 ||
			result.filter((t) => t.addedBy === tracks[i].addedBy).length === 0
		) {
			result.push(tracks[i]);
		}
	}
	return result;
};

export const getEverythingRightText = (
	currentTrack: Track,
	usernames: Map<string, string>,
) => {
	return (
		"You did it! You have guessed the Title „" +
		currentTrack.title +
		"“ and the artist „" +
		currentTrack.artists.join(" & ") +
		"“ right." +
		" Added to your playlist by " +
		usernames.get(currentTrack.addedBy)
	);
};

export const getJustArtistRightText = (currentTrack: Track) => {
	return (
		"You did it! You have guessed the artist „" +
		currentTrack.artists.join(" & ") +
		"“ right, but the title was „" +
		currentTrack.title +
		"“."
	);
};

export const getPlaceholderForInput = (gamemode: GameMode) => {
	switch (gamemode) {
		case GameMode.TITLE:
			return "search for song title";
		case GameMode.ARTIST:
			return "search for artist";
		case GameMode.BOTH:
			return "search for artist / song title";
		case GameMode.USER:
			return "search for user";
		case GameMode.ALBUM:
			return "search for album";
		case GameMode.YEAR:
			return "search for year";
	}
};

export const getPointsForGuess = (
	gamemode: "title" | "artist" | "both" | "album" | "user" | "year",
	guessCount: number,
) => {
	if (gamemode === "year") {
		return 2000 - 50 * guessCount;
	}
	const gamemodePoint = gamemode === "album" ? 100 : 200;
	return 2000 - gamemodePoint * guessCount;
};
