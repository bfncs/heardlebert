import React, { useEffect, useState } from "react";
import {
	fetchAlbumImage,
	fetchPlaylist,
	fetchUsernames,
	Playlist,
} from "./spotifyApi";
import classes from "./GameMenu.module.scss";
import { useNavigate, useParams } from "react-router-dom";
import { useAppSelector } from "./hook";
import { connect } from "react-redux";
import {
	setGameMode,
	setLevel,
	setSongs,
	setSongSize,
	setAllSongs,
	setPlaylistName,
	setNumberOfSkips,
	setUsernames,
} from "./gameStateSlice";
import { Spinner } from "@blueprintjs/core";
import { Track } from "./tracks";

const STANDARD_PLAYLIST_ID = "37i9dQZF1DX4o1oenSJRJd";
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

function useUrlPlaylistId() {
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
	return [playlistId, setPlaylistId];
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
		if (playlistId) updatePlaylist(playlistId);
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

	function getChangePlaylist() {
		return (
			<div className={classes.changePlaylist}>
				{!playlistIsLoading ? (
					<>
						<input
							type="text"
							value={inputValue}
							onChange={(event) => setInputValue(event.target.value)}
						/>
						<button
							onClick={() => {
								setPlaylistId(inputValue);
								setChangePlaylist(false);
							}}
						>
							Set Playlist
						</button>
					</>
				) : (
					<Spinner />
				)}
			</div>
		);
	}

	return (
		<div className={classes.containerMenu}>
			<div className={classes.playlist}>
				{!changePlaylist ? (
					<div className={classes.notChangePlaylist}>
						<h3>
							Playlist: <b>{playlist?.name}</b>
						</h3>
						<button
							onClick={() => {
								setChangePlaylist(true);
							}}
						>
							Change
						</button>
					</div>
				) : (
					getChangePlaylist()
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
