import SpotifyPlayer from "./SpotifyPlayer";
import React, { SyntheticEvent, useEffect, useMemo, useState } from "react";
import { Track } from "./tracks";
import classes from "./Game.module.scss";
import { Spinner } from "@blueprintjs/core";
import { Simulate } from "react-dom/test-utils";
import input = Simulate.input;

interface Props {
	spotifyIframeApi: IframeApi;
	tracks: Track[];
	level: "easy" | "hard";
}

interface track {
	title: string;
	artists: string[];
}

type GameState = {
	track: number;
	guesses: string[];
	solution: track | null;
};
const initialState: GameState = {
	track: 0,
	guesses: [],
	solution: null,
};

function isAnyArtistMatching(currentTrack: Track, inputValue: string) {
	for (const artist of currentTrack.artists) {
		if (inputValue.toLowerCase().includes(artist.toLowerCase())) return true;
	}
	return false;
}

function isTitleMatching(inputValue: string, currentTrack: Track) {
	return inputValue.toLowerCase().includes(currentTrack.title.toLowerCase());
}

function isCorrectAnswer(
	inputValue: string,
	currentTrack: Track,
	level: "easy" | "hard" = "easy"
) {
	if (level === "hard") {
		return (
			isAnyArtistMatching(currentTrack, inputValue) &&
			isTitleMatching(inputValue, currentTrack)
		);
	} else {
		return isAnyArtistMatching(currentTrack, inputValue);
	}
}

function sortTracks(tracks: Track[]) {
	return [...tracks].sort(
		(a, b) =>
			a.artists[0].localeCompare(b.artists[0]) || a.title.localeCompare(b.title)
	);
}

function deleteDuplicates(tracks: Track[]) {
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
}

const GUESSABLE_TRACK_LENGTHS = [1000, 2000, 4000, 7000, 11000, 16000];

function Game(props: Props) {
	const [state, setState] = useState<GameState>(initialState);
	useEffect(() => {
		setState(initialState);
	}, [props.tracks]);

	const [inputValue, setInputValue] = useState("");
	const sortedTracks = useMemo(
		() => deleteDuplicates(props.tracks),
		[props.tracks]
	);

	const currentTrack: Track = props.tracks[state.track];
	let playSongLength = GUESSABLE_TRACK_LENGTHS[state.guesses.length];
	const hasBeenSuccessfullyGuessed =
		state.guesses.length > 0 &&
		state.guesses.length <= GUESSABLE_TRACK_LENGTHS.length &&
		isCorrectAnswer(
			state.guesses[state.guesses.length - 1],
			currentTrack,
			props.level
		);

	if (props.tracks.length === 0) {
		return (
			<div>
				<Spinner />
			</div>
		);
	}

	function tryGuess(event: SyntheticEvent) {
		setState({
			...state,
			guesses: [...state.guesses, inputValue],
		});
		setInputValue("");
		if (
			state.guesses.length >= GUESSABLE_TRACK_LENGTHS.length - 1 &&
			!isCorrectAnswer(inputValue, props.tracks[state.track], props.level)
		) {
			goToNextSong();
		}
		event.preventDefault();
	}

	function getEverythingRightText() {
		return (
			"You did it! You have guessed the Title „" +
			currentTrack.title +
			"“ and the artist „" +
			currentTrack.artists.join(" & ") +
			"“ right."
		);
	}

	function getJustArtistRightText() {
		return (
			"You did it! You have guessed the artist „" +
			currentTrack.artists.join(" & ") +
			"“ right, but the title was „" +
			currentTrack.title +
			"“."
		);
	}

	function getSuccessfullyGuessed() {
		return (
			<div className={classes.successDiv}>
				<span className={classes.smiley}>🥳</span>
				<div className={classes.messageSuccess}>
					{isTitleMatching(
						state.guesses[state.guesses.length - 1],
						currentTrack
					)
						? getEverythingRightText()
						: getJustArtistRightText()}
				</div>
				<button className={classes.nextTrack} onClick={goToNextSong}>
					{"Get a new Song"}
				</button>
			</div>
		);
	}

	function goToNextSong() {
		setState({
			...initialState,
			track: state.track + 1 >= props.tracks.length ? 0 : state.track + 1,
			solution: {
				title: currentTrack.title,
				artists: currentTrack.artists,
			},
		});
	}

	function getFormIfNotRightGuessed() {
		const isSkippingAllowed =
			state.guesses.length < GUESSABLE_TRACK_LENGTHS.length - 1;
		return (
			<form
				onSubmit={(event) => {
					tryGuess(event);
				}}
			>
				<div className={classes.formRow}>
					<input
						className={classes.input}
						placeholder={"search for artist / song title"}
						type="text"
						value={inputValue}
						onChange={(event) => setInputValue(event.target.value)}
						list="tracks"
					/>
					<datalist id="tracks">
						{sortedTracks.map((track) => (
							<option key={track.uri}>
								{track.artists[0]} – {track.title}
							</option>
						))}
					</datalist>
				</div>
				<div className={classes.formButtons}>
					<button
						className={classes.hearMore}
						type="button"
						onClick={() => {
							if (isSkippingAllowed) {
								setState({
									...state,
									guesses: [...state.guesses, "skipped"],
								});
							} else {
								goToNextSong();
							}
						}}
					>
						{isSkippingAllowed
							? `Skip (+${
									(GUESSABLE_TRACK_LENGTHS[state.guesses.length + 1] -
										GUESSABLE_TRACK_LENGTHS[state.guesses.length]) /
									1000
							  }s)`
							: "Next track"}
					</button>

					<button
						className={classes.submit}
						type="submit"
						onClick={(event) => {
							tryGuess(event);
						}}
					>
						Submit
					</button>
				</div>
			</form>
		);
	}

	function getSolutionIfGuessedOrForm() {
		return hasBeenSuccessfullyGuessed
			? getSuccessfullyGuessed()
			: getFormIfNotRightGuessed();
	}

	if (hasBeenSuccessfullyGuessed) {
		playSongLength = GUESSABLE_TRACK_LENGTHS[5];
	}

	return (
		<div className={classes.game}>
			{!hasBeenSuccessfullyGuessed ? (
				<>
					<span>
						You have{" "}
						<b>
							{GUESSABLE_TRACK_LENGTHS.length - state.guesses.length} guesses
							left
						</b>
					</span>
					<ol className={classes.guessList}>
						{state.guesses.map((guess, index) => (
							<li key={index} className={classes.guessListItem}>
								{index + 1 + ". " + guess}
							</li>
						))}
					</ol>
				</>
			) : null}

			{state.solution != null && !hasBeenSuccessfullyGuessed ? (
				<div className={classes.lastSolution}>
					<p>
						The solution of the last Track was <b>{state.solution.title}</b> by
						&nbsp;
						<b>{state.solution.artists.join(" & ")}</b>
					</p>
				</div>
			) : null}

			<SpotifyPlayer
				spotifyIframeApi={props.spotifyIframeApi}
				uri={currentTrack.uri}
				stopAfterMs={playSongLength}
				progressBarTicksMs={GUESSABLE_TRACK_LENGTHS}
			/>

			{state.guesses.length <= GUESSABLE_TRACK_LENGTHS.length ? (
				<div className={classes.gameForm}>{getSolutionIfGuessedOrForm()}</div>
			) : null}
		</div>
	);
}

export default Game;
