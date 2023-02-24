import SpotifyPlayer from "./SpotifyPlayer";
import { useEffect, useMemo, useState } from "react";
import { Track } from "./tracks";
import classes from "./Game.module.scss";
import { Spinner } from "@blueprintjs/core";

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
	const playSongLength = 1500 + state.guesses.length * 1500;
	const hasBeenSuccessfullyGuessed =
		state.guesses.length > 0 &&
		state.guesses.length < 10 &&
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

	function tryGuess(
		event:
			| React.FormEvent<HTMLFormElement>
			| React.MouseEvent<HTMLButtonElement>
	) {
		setState({
			...state,
			guesses: [...state.guesses, inputValue],
		});
		setInputValue("");
		event.preventDefault();
	}

	function getEverythingRightText() {
		return (
			"🎉🎉🎉🎉🎉 You have guessed the Title „" +
			currentTrack.title +
			"“ and the artist " +
			currentTrack.artists.join(" & ") +
			" right. 🎉🎉🎉🎉🎉"
		);
	}

	function getJustArtistRightText() {
		return (
			"🎉 You have guessed the artist " +
			currentTrack.artists.join(" & ") +
			" right, but the title was „" +
			currentTrack.title +
			"“. 🎉"
		);
	}

	function getSuccessfullyGuessed() {
		return (
			<div className={classes.messageSuccess}>
				{isTitleMatching(state.guesses[state.guesses.length - 1], currentTrack)
					? getEverythingRightText()
					: getJustArtistRightText()}
			</div>
		);
	}

	function getFormIfNotRightGuessed() {
		return (
			<form
				onSubmit={(event) => {
					tryGuess(event);
				}}
			>
				<div className={classes.formRow}>
					<input
						className={classes.input}
						placeholder={"Enter your guess"}
						type="text"
						value={inputValue}
						onChange={(event) => setInputValue(event.target.value)}
						list="tracks"
					/>
					<datalist id="tracks">
						{sortedTracks.map((track) => (
							<option>
								{track.artists[0]} – {track.title}
							</option>
						))}
					</datalist>
					<button
						className={classes.submit}
						type="submit"
						onClick={(event) => {
							tryGuess(event);
						}}
					>
						guess
					</button>

					<button
						className={classes.hearMore}
						type="button"
						onClick={() => {
							setState({
								...state,
								guesses: [...state.guesses, "skipped"],
							});
						}}
					>
						hear more
					</button>
				</div>
			</form>
		);
	}

	function getSolutionIfGuessedOrForm() {
		return (
			<>
				{hasBeenSuccessfullyGuessed
					? getSuccessfullyGuessed()
					: getFormIfNotRightGuessed()}
			</>
		);
	}

	function getNoMoreGuesses() {
		return (
			<>
				<span>{state.guesses.length - 1} / 10</span>
				<span>You have no more guesses left</span>
			</>
		);
	}

	return (
		<div>
			<h5>Guesses: </h5>
			<ul>
				{state.guesses.map((guess, index) => (
					<li key={guess + index}>
						{guess}{" "}
						{isCorrectAnswer(guess, currentTrack, props.level)
							? "✅"
							: guess === "skipped"
							? ""
							: " is wrong"}
					</li>
				))}
			</ul>
			<span>You have {10 - state.guesses.length} guesses left!</span>

			{state.solution != null ? (
				<div className={classes.lastSolution}>
					<p>
						The solution of the last Track was {state.solution.title} by{" "}
						{state.solution.artists.join(" & ")}
					</p>
				</div>
			) : null}

			{state.guesses.length < 10
				? getSolutionIfGuessedOrForm()
				: getNoMoreGuesses()}
			<SpotifyPlayer
				spotifyIframeApi={props.spotifyIframeApi}
				uri={currentTrack.uri}
				stopAfterMs={playSongLength}
			/>

			<button
				onClick={() => {
					setState({
						...initialState,
						track: state.track + 1 >= props.tracks.length ? 0 : state.track + 1,
						solution: {
							title: currentTrack.title,
							artists: currentTrack.artists,
						},
					});
				}}
			>
				{hasBeenSuccessfullyGuessed ? "Get a new Song" : "Skip to next track"}
			</button>
		</div>
	);
}

export default Game;
