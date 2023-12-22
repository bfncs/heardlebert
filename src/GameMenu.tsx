import React, { useEffect, useState } from "react";
import { fetchPlaylist, fetchUsernames, Playlist } from "./spotifyApi";
import classes from "./GameMenu.module.scss";
import { useNavigate, useParams } from "react-router-dom";
import { useAppSelector } from "./hook";
import { connect } from "react-redux";
import {
	setAllSongs,
	setGameMode,
	setLevel,
	setNumberOfSkips,
	setPlaylistName,
	setSongs,
	setSongSize,
	setUsernames,
} from "./gameStateSlice";
import { Spinner } from "@blueprintjs/core";
import { Track } from "./tracks";
import PlaylistSelector from "./PlaylistSelector";

const STANDARD_PLAYLISTS = [
	{ id: "0alpnkjV6cDmzJRxts58u5", title: "Metropolis" },
	{ id: "37i9dQZF1DX4o1oenSJRJd", title: "All Out 2000s" },
	{ id: "37i9dQZF1DXbTxeAdrVG2l", title: "All Out 90s" },
	{ id: "37i9dQZF1DX4UtSsGT1Sbe", title: "All Out 80s" },
	{ id: "37i9dQZF1DWTJ7xPn4vNaz", title: "All Out 70s" },
	{ id: "37i9dQZF1DXaKIA8E7WcJj", title: "All Out 60s" },
	{ id: "37i9dQZF1DXcBWIGoYBM5M", title: "Today's Top Hits" },
	{ id: "37i9dQZEVXbMDoHDwVN2tF", title: "Top 50 Global" },
	{ id: "37i9dQZF1DX0XUsuxWHRQd", title: "Rap Caviar" },
	{ id: "37i9dQZF1DWXRqgorJj26U", title: "Rock Caviar" },
	{ id: "37i9dQZF1DWWMOmoXKqHTD", title: "Songs To Sing to in the Car" },
	{ id: "37i9dQZF1DWSqmBTGDYngZ", title: "Songs To Sing in the Shower" },
	{ id: "37i9dQZF1DX186v583rmzp", title: "I Love My 90s HipHop" },
];

const STANDARD_PLAYLIST_ID = STANDARD_PLAYLISTS[0].title;
const LOCALSTORAGE_KEY_LAST_PLAYLIST_ID = "lastPlaylistId";

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

const mapDispatchToProps = {
	setGameMode,
	setLevel,
	setSongSize,
	setSongs,
	setAllSongs,
	setNumberOfSkips,
	setPlaylistName,
	setUsernames,
};

type Props = typeof mapDispatchToProps;

function useUrlPlaylistId(): [string | null, (nextId: string) => void] {
	const navigate = useNavigate();
	const { playListId: playlistId } = useParams();

	function setPlaylistId(id: string) {
		navigate("/" + id);
	}

	useEffect(() => {
		if (!playlistId) {
			const lastPlaylistId = localStorage.getItem(
				LOCALSTORAGE_KEY_LAST_PLAYLIST_ID
			);
			const initialPlaylistId = lastPlaylistId || STANDARD_PLAYLIST_ID;
			setPlaylistId(initialPlaylistId);
		}
	}, [playlistId]);

	return [playlistId || null, setPlaylistId];
}

function GameMenu(props: Props) {
	const navigate = useNavigate();
	const [playlistId, setPlaylistId] = useUrlPlaylistId();

	const [playlist, setPlaylist] = useState<Playlist | null>(null);
	const [inputValue, setInputValue] = useState("");
	const [playlistIsLoading, setPlaylistIsLoading] = useState(true);
	const [changePlaylist, setChangePlaylist] = useState(false);
	const [uniqueUsers, setUniqueUsers] = useState<string[]>([]);
	const [shouldChooseEvenlyFromUsers, setShouldChooseEvenlyFromUsers] =
		useState(false);
	const [selectedUsernames, setSelectedUsernames] = useState<string[]>([]);
	const [usernames, setUsernames] = useState(new Map<string, string>());
	const [loadUsernames, setLoadUsernames] = useState(true);

	const gameState = useAppSelector((state) => state.gameState);

	function randomInteger(min: number, max: number) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	function startGame() {
		const songSize = gameState.songSize;
		let usersInGame: string[] = [];
		const songs: Track[] = [];

		if (playlist === null) {
			return;
		}
		if (uniqueUsers.length > 0 && shouldChooseEvenlyFromUsers) {
			for (let i = 0; i < songSize; i++) {
				const song =
					playlist.tracks[randomInteger(0, playlist.tracks.length - 1)];
				if (
					usersInGame.length === uniqueUsers.length ||
					usersInGame.length === selectedUsernames.length
				) {
					usersInGame = [];
				}
				if (
					usersInGame.includes(song.addedBy) ||
					(selectedUsernames.length > 0 &&
						!selectedUsernames.includes(usernames.get(song.addedBy) || ""))
				) {
					i--;
					continue;
				}
				usersInGame.push(song.addedBy);
				songs.push(song);
				playlist.tracks.splice(playlist.tracks.indexOf(song), 1);
			}
		} else {
			songs.push(...playlist.tracks.slice(0, songSize));
		}

		props.setSongs(songs);
		playlist.tracks.push(...songs);
		props.setAllSongs(shuffle(playlist.tracks));
		props.setUsernames([...new Set(uniqueUsers)]);
		navigate("/game");
	}

	useEffect(() => {
		if (playlistId) {
			updatePlaylist(playlistId);
		}
	}, [playlistId]);

	async function updatePlaylist(playlistId: string) {
		setPlaylistIsLoading(true);
		const playlist = await fetchPlaylist(playlistId);
		setPlaylist({ ...playlist, tracks: shuffle(playlist.tracks) });
		props.setPlaylistName(playlist.name);

		const isStandard = playlistId === STANDARD_PLAYLIST_ID;
		if (isStandard) {
			localStorage.removeItem(LOCALSTORAGE_KEY_LAST_PLAYLIST_ID);
		} else {
			localStorage.setItem(LOCALSTORAGE_KEY_LAST_PLAYLIST_ID, playlistId);
			const uniqueUsers = new Set(
				playlist.tracks
					.flatMap((track) => track.addedBy)
					.filter((user) => !!user)
			);
			setUniqueUsers(Array.from(uniqueUsers));
			setLoadUsernames(true);
			try {
				await fetchUsernames(Array.from(uniqueUsers)).then((response) => {
					setUsernames(response);
					setLoadUsernames(false);
				});

				// switch loading to false after fetch is complete
				setLoadUsernames(false);
			} catch (error) {
				// add error handling here
				setLoadUsernames(false);
				console.error(error);
			}
		}
		setPlaylistIsLoading(false);
	}

	return (
		<div className={classes.containerMenu}>
			<div className={classes.playlist}>
				{!changePlaylist ? (
					<div className={classes.notChangePlaylist}>
						<h3>
							Playlist:{" "}
							<b>
								{playlist
									? `${playlist.name} (${playlist.tracks.length}🎵)`
									: ""}
							</b>
						</h3>
						<button
							onClick={() => {
								setChangePlaylist(true);
							}}
						>
							Change
						</button>
					</div>
				) : playlistIsLoading ? (
					<Spinner />
				) : (
					<PlaylistSelector
						defaultPlaylists={STANDARD_PLAYLISTS}
						onPlaylistSelected={(id) => {
							setPlaylistId(id);
							setChangePlaylist(false);
						}}
					/>
				)}
			</div>
			<div className={classes.gamemode}>
				<label>Gamemode: </label>
				<select
					value={gameState.gameMode}
					onChange={(event) => {
						props.setGameMode(
							event.target.value as
								| "title"
								| "album"
								| "both"
								| "artist"
								| "user"
						);
					}}
				>
					<option value="title">Title, Artist and User</option>
					<option value="album">Album</option>
					<option value="both">Title & Artist</option>
					<option value="artist">Artist</option>
					<option value="user">User</option>
				</select>{" "}
			</div>
			<div className={classes.difficulty}>
				<label>Difficulty: </label>
				<select
					value={gameState.level}
					onChange={(event) => {
						props.setLevel(event.target.value as "easy" | "medium" | "hard");
					}}
				>
					<option value="easy">Easy</option>
					<option value="medium">Medium</option>
					<option value="hard">Hard</option>
				</select>{" "}
			</div>
			<div className={classes.songSize}>
				<label>Number of songs: </label>
				<select
					value={gameState.songSize.toString()}
					onChange={(event) => {
						props.setSongSize(
							Number.parseInt(
								event.target.value as "5" | "10" | "20" | "30" | "40" | "50"
							)
						);
					}}
				>
					<option value="5">5</option>
					<option value="10">10</option>
					<option value="20">20</option>
					<option value="30">30</option>
					<option value="40">40</option>
					<option value="50">50</option>
				</select>
			</div>
			<div className={classes.numberOfSkips}>
				<label>Number of skips: </label>
				<input
					type="number"
					value={gameState.numberOfSkips || ""}
					onChange={(event) => {
						props.setNumberOfSkips(
							event.target.value.trim() !== ""
								? Number.parseInt(event.target.value)
								: null
						);
					}}
				/>
			</div>
			{uniqueUsers.length > 1 && !loadUsernames && !changePlaylist && (
				<div className={classes.usernames}>
					<label>Usernames: </label>
					<div className={classes.allUsers}>
						{uniqueUsers.map((user) => (
							<div className={classes.checkbox} key={"div-" + user}>
								<input
									type="checkbox"
									key={"checkbox-" + user}
									onChange={(e) => {
										const username = usernames.get(user);
										if (username === undefined) {
											return;
										}

										if (e.target.checked) {
											setSelectedUsernames([...selectedUsernames, username]);
										} else {
											setSelectedUsernames(
												selectedUsernames.filter((u) => u !== username)
											);
										}
									}}
								/>
								<label key={user}>{usernames.get(user)}</label>
							</div>
						))}
					</div>
				</div>
			)}
			<div className={classes.equalDistribution}>
				<label>Equal distribution: </label>
				<input
					type="checkbox"
					checked={shouldChooseEvenlyFromUsers}
					onChange={(event) => {
						setShouldChooseEvenlyFromUsers(event.target.checked);
					}}
				/>
			</div>

			{!playlistIsLoading && (
				<button
					onClick={() => {
						startGame();
					}}
				>
					Play
				</button>
			)}
		</div>
	);
}

export default connect(null, mapDispatchToProps)(GameMenu);
