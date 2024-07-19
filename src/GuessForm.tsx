import classes from "./Game.module.scss";
import { AutoComplete } from "primereact/autocomplete";
import React, { useState } from "react";
import { Track } from "./types/types";
import { GameMode } from "./gameStateSlice";
import {
	deleteAlbumDuplicates,
	deleteArtistDuplicates,
	deleteUserDuplicates,
	deleteYearDuplicates,
} from "./utils/helperMethods";

interface Props {
	isSkippingAllowed: boolean;
	noMoreSkipsAllowed: boolean;
	tryGuess: (input: string) => void;
	userNames: Map<string, string>;
	gameMode: GameMode;
	tracks: Track[];
	onSkip: () => void;
	onEndGame: () => void;
	guessableTrackLengths: number[];
	guesses: string[];
}

const getSuggestions = (
	gameMode: GameMode,
	sortedTracks: Track[],
	usernames: Map<string, string>,
): string[] => {
	switch (gameMode) {
		case GameMode.TITLE:
			return sortedTracks.map(
				(track) =>
					`${track.title} - ${track.artists.join(
						", ",
					)} added by ${usernames.get(track.addedBy)}`,
			);
		case GameMode.ARTIST:
			return deleteArtistDuplicates(sortedTracks).map((track) =>
				track.artists.join(", "),
			);
		case GameMode.BOTH:
			return sortedTracks.map(
				(track) => `${track.title} by ${track.artists.join(", ")}`,
			);
		case GameMode.USER:
			return deleteUserDuplicates(sortedTracks).flatMap((track) => {
				return usernames.get(track.addedBy) || "";
			});
		case GameMode.ALBUM:
			return deleteAlbumDuplicates(sortedTracks).map(
				(track) =>
					`${track.album} - ${track.title} by ${track.artists.join(", ")}`,
			);
		case GameMode.YEAR:
			return deleteYearDuplicates(sortedTracks).map(
				(track) => track.release_date,
			);
	}

	return sortedTracks.map((track) => `${track.artists[0]} - ${track.title}`);
};

export function GuessForm(props: Props) {
	const [inputValue, setInputValue] = useState("");
	const [suggestions, setSuggestions] = useState<string[]>([]);

	return (
		<form
			onSubmit={(event) => {
				props.tryGuess(inputValue);
				setInputValue("");
				event.preventDefault();
			}}
		>
			<div className={classes.formRow}>
				<AutoComplete
					value={inputValue}
					suggestions={suggestions}
					onChange={(event) => setInputValue(event.target.value)}
					completeMethod={(event) => {
						const nextSuggestions = getSuggestions(
							props.gameMode,
							props.tracks,
							props.userNames,
						).filter((s) =>
							s.toLowerCase().includes(event.query.toLowerCase()),
						);
						setSuggestions(nextSuggestions);
					}}
				/>
			</div>
			<div className={classes.formButtons}>
				{!props.noMoreSkipsAllowed ? (
					<button
						className={classes.hearMore}
						type="button"
						onClick={props.onSkip}
					>
						{props.isSkippingAllowed
							? `Skip (+${
									(props.guessableTrackLengths[props.guesses.length + 1] -
										props.guessableTrackLengths[props.guesses.length]) /
									1000
								}s)`
							: "Next track"}
					</button>
				) : (
					<button
						className={classes.endGame}
						type="button"
						onClick={props.onEndGame}
					>
						End Game
					</button>
				)}

				<button className={classes.submit} type="submit">
					Submit
				</button>
			</div>
		</form>
	);
}
