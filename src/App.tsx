import React, { useEffect, useState } from "react";
import Game from "./Game";
import { Track } from "./tracks";
import { fetchPlaylist, Playlist } from "./spotifyApi";
import { Simulate } from "react-dom/test-utils";
import play = Simulate.play;

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
	const [playlist, setPlaylist] = useState<Playlist | null>(null);
	useEffect(() => {
		const playlistId = getPlaylistIdFromUrl() || "37i9dQZF1DWXRqgorJj26U";
		(async () => {
			const playlist = await fetchPlaylist(playlistId);
			console.log("Fetched playlist", playlist);
			setPlaylist({ ...playlist, tracks: shuffle(playlist.tracks) });
		})();
	}, []);
	return (
		<div>
			<h1>Guess this song</h1>
			<h2>{playlist?.name}</h2>
			<Game
				spotifyIframeApi={props.spotifyIframeApi}
				tracks={playlist?.tracks || []}
			/>
		</div>
	);
}

export default App;
