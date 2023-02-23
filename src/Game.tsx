import SpotifyPlayer from "./SpotifyPlayer";
import { useEffect, useState } from "react";
import { Track } from "./tracks";
import classes from "./Game.module.css";
import { Spinner } from "@blueprintjs/core";

interface Props {
	spotifyIframeApi: IframeApi;
	tracks: Track[];
}

type GameState = {
	track: number;
	guesses: string[];
};
const initialState: GameState = {
	track: 0,
	guesses: [],
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

function isCorrectAnswer(inputValue: string, currentTrack: Track) {
	return (
		isAnyArtistMatching(currentTrack, inputValue) ||
		isTitleMatching(inputValue, currentTrack)
	);
}

function Game(props: Props) {
	const [state, setState] = useState<GameState>(initialState);
	useEffect(() => {
		setState(initialState);
	}, [props.tracks]);

	const [inputValue, setInputValue] = useState("");

	const currentTrack: Track = props.tracks[state.track];
	const playSongLength = 1500 + state.guesses.length * 1500;
	const hasBeenSuccessfullyGuessed =
		state.guesses.length > 0 &&
		isCorrectAnswer(state.guesses[state.guesses.length - 1], currentTrack);

	if (props.tracks.length === 0) {
		return (
			<div>
				<Spinner />
			</div>
		);
	}

	return (
		<div>
			<ul>
				{state.guesses.map((guess, index) => (
					<li key={index}>
						{guess} {isCorrectAnswer(guess, currentTrack) ? "✅" : "❎"}
					</li>
				))}
			</ul>
			{hasBeenSuccessfullyGuessed ? (
				<div className={classes.messageSuccess}>
					🎉🎉🎉 You correctly guessed {currentTrack.title} by{" "}
					{currentTrack.artists} 🎉🎉🎉
				</div>
			) : (
				<form
					onSubmit={(event) => {
						setState({
							...state,
							guesses: [...state.guesses, inputValue],
						});
						if (isCorrectAnswer(inputValue, currentTrack)) {
							console.log("guess correct!");
						} else {
							console.log("guess wrong!");
						}
						setInputValue("");
						event.preventDefault();
					}}
				>
					<input
						className={classes.input}
						placeholder={"Enter your guess"}
						type="text"
						value={inputValue}
						onChange={(event) => setInputValue(event.target.value)}
						list="tracks"
					/>
					<datalist id="tracks">
						{props.tracks.map((track) => (
							<option>
								{track.artists[0]} – {track.title}
							</option>
						))}
					</datalist>
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
					});
				}}
			>
				Skip to next track
			</button>
		</div>
	);
}

export default Game;
