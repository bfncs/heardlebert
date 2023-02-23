import { Track } from "./tracks";

async function fetchAccessToken() {
	const CLIENT_ID = "04c44ad2809141efb9cf0a9237ff461b";
	const CLIENT_SECRET = "63089efaa6694022a37ac00734a043ff";

	const response = await fetch("https://accounts.spotify.com/api/token", {
		method: "POST",
		headers: {
			Authorization: `Basic ${btoa(CLIENT_ID + ":" + CLIENT_SECRET)}`,
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({
			grant_type: "client_credentials",
		}),
	});

	if (response.status !== 200) {
		return null;
	}
	const payload = await response.json();

	return payload.access_token;
}

export interface Playlist {
	name: string;
	tracks: Track[];
}
export async function fetchPlaylist(playlistId: string): Promise<Playlist> {
	const accessToken = await fetchAccessToken();
	const response = await fetch(
		`https://api.spotify.com/v1/playlists/${playlistId}`,
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		}
	);

	if (response.status !== 200) {
		throw new Error(
			`Unable to fetch playlist (${response.status}): ${response.body}`
		);
	}
	const payload: {
		name: string;
		tracks: {
			items: {
				track: {
					artists: {
						name: string;
					}[];
					name: string;
					uri: string;
				};
			}[];
		};
	} = await response.json();

	// TODO: load other pages

	return {
		name: payload.name,
		tracks: payload.tracks.items.map((item) => ({
			artists: item.track.artists.map((artist) => artist.name),
			title: item.track.name,
			uri: item.track.uri,
		})),
	};
}
