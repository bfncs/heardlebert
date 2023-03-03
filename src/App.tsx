import React, { useEffect, useState } from "react";
import Game from "./Game";
import { fetchPlaylist, Playlist } from "./spotifyApi";
import classes from "./App.module.scss";

function shuffle<T>(arr: T[]): T[] {
	let j, x, i;
	for (i = arr.length - 1; i > 0; i--) {
		j = Math.floor(Math.random() * (i + 1));
		x = arr[i];
		arr[i] = arr[j];
		arr[j] = x;
	}
	return arr;
}

type AppState = {
	level: "easy" | "hard";
};
const initialState: AppState = {
	level: "easy",
};

interface Props {
	spotifyIframeApi: IframeApi;
}

function getPlaylistIdFromUrl(): string | null {
	if (
		!window.location.pathname.startsWith("/") &&
		window.location.pathname.length > 1
	) {
		return null;
	}
	return window.location.pathname.substring(1);
}

function App(props: Props) {
	const [state, setState] = useState<AppState>(initialState);
	const [playlist, setPlaylist] = useState<Playlist | null>(null);
	useEffect(() => {
		const playlistId = getPlaylistIdFromUrl() || "37i9dQZF1DX4o1oenSJRJd";
		(async () => {
			const playlist = await fetchPlaylist(playlistId);
			console.debug("Fetched playlist", playlist);
			setPlaylist({ ...playlist, tracks: shuffle(playlist.tracks) });
		})();
	}, []);
	return (
		<div>
			<div className={classes.headlines}>
				<h1>Heardlebert</h1>
				<h2>Guess this song</h2>
			</div>
			<span>
				The songs are chosen from the playlist <b>{playlist?.name}</b> <br />
				and you play on &nbsp;
				<select
					value={state.level}
					onChange={(event) => {
						setState({
							...state,
							level: event.target.value as "easy" | "hard",
						});
					}}
				>
					<option value="easy">Easy</option>
					<option value="hard">Hard</option>
				</select>{" "}
				difficulty.
			</span>

			<Game
				spotifyIframeApi={props.spotifyIframeApi}
				tracks={playlist?.tracks || []}
				level={state.level}
			/>
		</div>
	);
}

export default App;
