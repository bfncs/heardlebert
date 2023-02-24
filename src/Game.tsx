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

function Game(props: Props) {
	const [state, setState] = useState<GameState>(initialState);
	useEffect(() => {
		setState(initialState);
	}, [props.tracks]);

	const [inputValue, setInputValue] = useState("");
	const sortedTracks = useMemo(() => sortTracks(props.tracks), [props.tracks]);

	const currentTrack: Track = props.tracks[state.track];
	const playSongLength = 1500 + state.guesses.length * 1500;
	const hasBeenSuccessfullyGuessed =
		state.guesses.length > 0 &&
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
		if (isCorrectAnswer(inputValue, currentTrack, props.level)) {
			console.log("guess correct!");
		} else {
			console.log("guess wrong!");
		}
		setInputValue("");
		event.preventDefault();
	}

	function getEverythingRightText() {
		return (
			"You have guessed the Title „" +
			currentTrack.title +
			"“ and the artist " +
			currentTrack.artists.join(" & ") +
			"right."
		);
	}

	function getJustArtistRightText() {
		return (
			"You have guessed the artist " +
			currentTrack.artists.join(" & ") +
			" right, but the title was „" +
			currentTrack.title +
			"“."
		);
	}

	return (
		<div>
			<ul>
				{state.guesses.map((guess, index) => (
					<li key={guess + index}>
						{guess}{" "}
						{isCorrectAnswer(guess, currentTrack, props.level)
							? "✅"
							: guess === "no guess :("
							? ""
							: " is wrong"}
					</li>
				))}
			</ul>

			{state.solution != null ? (
				<div className={classes.lastSolution}>
					<p>
						The solution of the last Track was {state.solution.title} by{" "}
						{state.solution.artists.join(" & ")}
					</p>
				</div>
			) : null}

			{hasBeenSuccessfullyGuessed ? (
				<div className={classes.messageSuccess}>
					{isTitleMatching(inputValue, currentTrack)
						? getEverythingRightText()
						: getJustArtistRightText()}
				</div>
			) : (
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
									guesses: [...state.guesses, "no guess :("],
								});
							}}
						>
							hear more
						</button>
					</div>
				</form>
			)}
			<SpotifyPlayer
				spotifyIframeApi={props.spotifyIframeApi}
				uri={currentTrack.uri}
				stopAfterMs={playSongLength}
			/>

			<button
				onClick={() => {
					console.log(
						`This was „${currentTrack.title}“ by ${currentTrack.artists.join(
							" & "
						)}`
					);
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
				Skip to next track
			</button>
		</div>
	);
}

export default Game;
