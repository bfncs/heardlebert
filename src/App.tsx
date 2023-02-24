import React, { useEffect, useState } from "react";
import Game from "./Game";
import { fetchPlaylist, Playlist } from "./spotifyApi";

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
		const playlistId = getPlaylistIdFromUrl() || "37i9dQZF1DWXRqgorJj26U";
		(async () => {
			const playlist = await fetchPlaylist(playlistId);
			console.debug("Fetched playlist", playlist);
			setPlaylist({ ...playlist, tracks: shuffle(playlist.tracks) });
		})();
	}, []);
	return (
		<div>
			<h1>Guess this song</h1>
			<h2>{playlist?.name}</h2>

			<h4>Level</h4>
			<fieldset id="levelFieldSet">
				<div className="radio">
					<input
						type="radio"
						value="easy"
						checked={state.level === "easy"}
						onChange={() => {
							setState({ ...state, level: "easy" });
						}}
					/>{" "}
					Easy
				</div>
				<div className="radio">
					<input
						type="radio"
						value="hard"
						checked={state.level === "hard"}
						onChange={() => {
							setState({ ...state, level: "hard" });
						}}
					/>{" "}
					Hard
				</div>
			</fieldset>

			<Game
				spotifyIframeApi={props.spotifyIframeApi}
				tracks={playlist?.tracks || []}
				level={state.level}
			/>
		</div>
	);
}

export default App;
