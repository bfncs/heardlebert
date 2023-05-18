import React, { useEffect, useState } from "react";
import { fetchPlaylist, Playlist } from "./spotifyApi";
import classes from "./GameMenu.module.scss";
import { useNavigate } from "react-router-dom";
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
} from "./gameStateSlice";
import { Spinner } from "@blueprintjs/core";

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
};

type Props = typeof mapDispatchToProps;

function GameMenu(props: Props) {
	const [playlist, setPlaylist] = useState<Playlist | null>(null);
	const [inputValue, setInputValue] = useState("");
	const [playlistIsLoading, setPlaylistIsLoading] = useState(true);
	const [changePlaylist, setChangePlaylist] = useState(false);

	const navigate = useNavigate();
	const gameState = useAppSelector((state) => state.gameState);

	function startGame() {
		props.setSongs(playlist?.tracks.slice(0, gameState.songSize) || []);
		props.setAllSongs(playlist?.tracks || []);
		navigate("/game");
	}

	useEffect(() => {
		const standardPlaylistId = "37i9dQZF1DX4o1oenSJRJd";
		(async () => {
			setPlaylistId(standardPlaylistId, true);
		})();
	}, []);

	async function setPlaylistId(playlistId: string, isStandard = false) {
		setPlaylistIsLoading(true);
		const playlist = await fetchPlaylist(playlistId);
		setPlaylist({ ...playlist, tracks: shuffle(playlist.tracks) });
		props.setPlaylistName(playlist.name);
		setPlaylistIsLoading(false);
		if (!isStandard) {
			setChangePlaylist(false);
		}
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
						<button onClick={() => setPlaylistId(inputValue)}>
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
							event.target.value as "title" | "album" | "both" | "artist"
						);
					}}
				>
					<option value="title">Title</option>
					<option value="album">Album</option>
					<option value="both">Title & Artist</option>
					<option value="artist">Artist</option>
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
				<select
					value={gameState.numberOfSkips.toString()}
					onChange={(event) => {
						props.setNumberOfSkips(
							Number.parseInt(
								event.target.value as "1" | "5" | "8" | "10" | "12"
							)
						);
					}}
				>
					<option value="1">1</option>
					<option value="5">5</option>
					<option value="8">8</option>
					<option value="10">10</option>
					<option value="12">12</option>
				</select>
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
