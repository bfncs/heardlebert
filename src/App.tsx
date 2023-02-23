import SpotifyPlayer from "./SpotifyPlayer";
import { useState } from "react";
import { Track, tracks } from "./tracks";
import classes from "./App.module.css";

interface Props {
	spotifyIframeApi: IframeApi;
}

type GameState = {
	track: number;
	guesses: string[];
};
const initialState: GameState = {
	track: 0,
	guesses: [],
};

function isCorrectAnswer(inputValue: string, currentTrack: Track) {
	return (
		inputValue.toLowerCase().includes(currentTrack.artist.toLowerCase()) ||
		inputValue.toLowerCase().includes(currentTrack.title.toLowerCase())
	);
}

function App(props: Props) {
	const [inputValue, setInputValue] = useState("");
	const [state, setState] = useState<GameState>(initialState);
	const currentTrack: Track = tracks[state.track];
	const playSongLength = 1500 + state.guesses.length * 1500;
	const hasBeenSuccessfullyGuessed =
		state.guesses.length > 0 &&
		isCorrectAnswer(state.guesses[state.guesses.length - 1], currentTrack);
	return (
		<div className="App">
			<h1>Guess this song</h1>
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
					{currentTrack.artist} 🎉🎉🎉
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
					/>
				</form>
			)}
			<SpotifyPlayer
				spotifyIframeApi={props.spotifyIframeApi}
				uri={currentTrack.uri}
				stopAfterMs={playSongLength}
			/>
			<button
				onClick={() => {
					setState({
						...initialState,
						track: state.track + 1 >= tracks.length ? 0 : state.track + 1,
					});
				}}
			>
				Skip to next track
			</button>
		</div>
	);
}

export default App;
