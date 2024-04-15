import SpotifyPlayer from "./SpotifyPlayer";
import React, { useEffect, useState } from "react";
import classes from "./TimeGame.module.scss";
import Spinner from "./Spinner";
import { useAppSelector } from "./hook";
import { useNavigate } from "react-router-dom";
import {
	GameMode,
	gameStateSlice,
	setAllSongs,
	setGameMode,
	setLevel,
	setNumberOfSkips,
	setPlaylistName,
	setSongs,
	setSongSize,
} from "./gameStateSlice";
import { connect } from "react-redux";
import { RoundState, Track } from "./types/types";
import { useDrag } from "react-dnd";

const initialState: RoundState = {
	track: 0,
	guesses: [],
	solution: null,
	score: 0,
};

interface ExternalProps {
	spotifyIframeApi: IframeApi;
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

type Props = ExternalProps & typeof mapDispatchToProps;

function isAnyArtistMatching(currentTrack: Track, inputValue: string) {
	for (const artist of currentTrack.artists) {
		if (inputValue.toLowerCase().includes(artist.toLowerCase())) return true;
	}
	return false;
}

function isTitleMatching(inputValue: string, currentTrack: Track) {
	return inputValue.toLowerCase().includes(currentTrack.title.toLowerCase());
}

function isAlbumMatching(inputValue: string, currentTrack: Track) {
	return inputValue.toLowerCase().includes(currentTrack.album.toLowerCase());
}

function isUserMatching(
	inputValue: string,
	currentTrack: Track,
	usernames: Map<string, string>,
) {
	return inputValue
		.toLowerCase()
		.includes(usernames.get(currentTrack.addedBy)?.toLowerCase() ?? "");
}

function isCorrectAnswer(
	inputValue: string,
	currentTrack: Track,
	gamemode: "title" | "artist" | "both" | "album" | "user" | "year" = "both",
	usernames?: Map<string, string>,
) {
	switch (gamemode) {
		case "title":
			return isTitleMatching(inputValue, currentTrack);
		case "artist":
			return isAnyArtistMatching(currentTrack, inputValue);
		case "both":
			return (
				isTitleMatching(inputValue, currentTrack) &&
				isAnyArtistMatching(currentTrack, inputValue)
			);
		case "album":
			return isAlbumMatching(inputValue, currentTrack);
		case "user":
			return isUserMatching(inputValue, currentTrack, usernames!);
		case "year":
			return currentTrack.release_date.includes(inputValue);
	}
}

const GUESSABLE_TRACK_LENGTHS_EASY = [3000, 4000, 6000, 9000, 13000, 18000];
const GUESSABLE_TRACK_LENGTHS_MEDIUM = [1500, 2500, 4500, 7500, 11500, 16500];
const GUESSABLE_TRACK_LENGTHS_HARD = [1000, 2000, 4000, 7000, 11000, 16000];

const TimeGame = (props: Props) => {
	const [state, setState] = useState<RoundState>(initialState);
	const [usernames, setUsernames] = useState(new Map<string, string>());
	const gameState = useAppSelector((state) => state.gameState);
	const navigate = useNavigate();

	useEffect(() => {
		setState(initialState);
	}, [props]);

	if (gameState == null) {
		return <Spinner />;
	} else {
		const songs = gameState.songs;
		const level = gameState.level;
		const gamemode = gameState.gameMode;
		const spotifyApiFrame = props.spotifyIframeApi;
		const numberOfSkips = gameState.numberOfSkips;
		const currentTrack: Track = songs[state.track];

		const guessedSongs: Track[] = [];

		const [collected, drag, dragPreview] = useDrag(() => ({
			type: "TRACK",
			item: { id },
		}));

		guessedSongs.push(...songs);

		let GUESSABLE_TRACK_LENGTHS = GUESSABLE_TRACK_LENGTHS_EASY;
		if (level === "medium") {
			GUESSABLE_TRACK_LENGTHS = GUESSABLE_TRACK_LENGTHS_MEDIUM;
		} else if (level === "hard") {
			GUESSABLE_TRACK_LENGTHS = GUESSABLE_TRACK_LENGTHS_HARD;
		}

		let playSongLength = GUESSABLE_TRACK_LENGTHS[state.guesses.length];
		const hasBeenSuccessfullyGuessed =
			state.guesses.length > 0 &&
			state.guesses.length <= GUESSABLE_TRACK_LENGTHS.length &&
			isCorrectAnswer(
				state.guesses[state.guesses.length - 1],
				currentTrack,
				gamemode,
				gamemode === GameMode.USER ? usernames : undefined,
			);

		const toMenu = () => {
			setState(initialState);
			props.setNumberOfSkips(gameStateSlice.getInitialState().numberOfSkips);
			navigate("/");
		};

		if (songs.length === 0) {
			return (
				<div>
					<Spinner />
				</div>
			);
		}

		if (state.track >= songs.length || (numberOfSkips && numberOfSkips < 0)) {
			return (
				<div className={classes.endGameDiv}>
					{/*TODO: Endgame Solution einbauen*/}
					<div className={classes.endGame}>
						<p>You have a score of {state.score}</p>
						<button className={classes.backToMenu} onClick={() => toMenu()}>
							Back to Menu
						</button>
					</div>
				</div>
			);
		}

		if (hasBeenSuccessfullyGuessed) {
			playSongLength = GUESSABLE_TRACK_LENGTHS[5];
		}
		return (
			<div className={classes.game}>
				<div className={classes.playListName}>
					<span>{gameState.playlistName}</span>
				</div>
				<span className={classes.tracksLength}>
					{state.track + 1}/{gameState.songs.length}
				</span>
				<div className={classes.score}>
					<span>Score: {state.score}</span>
				</div>

				<div className={classes.songSpan} id="actualSong" ref={dragRef}>
					<p>
						{currentTrack.title} by {currentTrack.artists.join(" & ")}
					</p>
				</div>

				<div className={classes.timeLine}>
					{guessedSongs.map((track) => (
						<div key={track.id} className={classes.songSpan}>
							<p>
								{track.title} by {track.artists.join(" & ")}
							</p>
						</div>
					))}
				</div>

				<SpotifyPlayer
					spotifyIframeApi={spotifyApiFrame}
					uri={currentTrack.uri}
					stopAfterMs={playSongLength}
					progressBarTicksMs={GUESSABLE_TRACK_LENGTHS}
				/>
			</div>
		);
	}
};

export default connect(null, mapDispatchToProps)(TimeGame);
