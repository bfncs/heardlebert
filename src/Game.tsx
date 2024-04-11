import SpotifyPlayer from "./SpotifyPlayer";
import React, { SyntheticEvent, useEffect, useMemo, useState } from "react";
import { Track } from "./tracks";
import classes from "./Game.module.scss";
import Spinner from "./Spinner";
import { Simulate } from "react-dom/test-utils";
import { useAppSelector } from "./hook";
import { useNavigate } from "react-router-dom";
import input = Simulate.input;
import {
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
import { fetchAlbumImage, fetchUsernames, Playlist } from "./spotifyApi";

interface track {
	title: string;
	artists: string[];
	album: string;
	addedBy: string;
	release_date: string;
}

type RoundState = {
	score: number;
	track: number;
	guesses: string[];
	solution: track | null;
};
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

function sortTracks(tracks: Track[]) {
	return [...tracks].sort(
		(a, b) =>
			a.artists[0].localeCompare(b.artists[0]) ||
			a.title.localeCompare(b.title),
	);
}

function deleteDuplicates(tracks: Track[]) {
	const sortedTracks = sortTracks(tracks);
	const result: Track[] = [];
	for (let i = 0; i < sortedTracks.length; i++) {
		if (
			i === 0 ||
			sortedTracks[i].artists[0] !== sortedTracks[i - 1].artists[0] ||
			sortedTracks[i].title !== sortedTracks[i - 1].title
		) {
			result.push(sortedTracks[i]);
		}
	}
	return result;
}

function deleteAlbumDuplicates(tracks: Track[]): Track[] {
	const result: Track[] = [];
	for (let i = 0; i < tracks.length; i++) {
		if (
			i === 0 ||
			result.filter((t) => t.album === tracks[i].album).length === 0
		) {
			result.push(tracks[i]);
		}
	}
	return result;
}

function deleteArtistDuplicates(tracks: Track[]): Track[] {
	const result: Track[] = [];
	for (let i = 0; i < tracks.length; i++) {
		if (
			i === 0 ||
			result.filter((t) => t.artists.join(",") === tracks[i].artists.join(","))
				.length === 0
		) {
			result.push(tracks[i]);
		}
	}
	return result;
}

function deleteUserDuplicates(tracks: Track[]): Track[] {
	const result: Track[] = [];
	for (let i = 0; i < tracks.length; i++) {
		if (
			i === 0 ||
			result.filter((t) => t.addedBy === tracks[i].addedBy).length === 0
		) {
			result.push(tracks[i]);
		}
	}
	return result;
}

const GUESSABLE_TRACK_LENGTHS_EASY = [3000, 4000, 6000, 9000, 13000, 18000];
const GUESSABLE_TRACK_LENGTHS_MEDIUM = [1500, 2500, 4500, 7500, 11500, 16500];
const GUESSABLE_TRACK_LENGTHS_HARD = [1000, 2000, 4000, 7000, 11000, 16000];

function loadAlbumImages(
	setLoadingAlbum: (value: ((prevState: boolean) => boolean) | boolean) => void,
	tracks: Track[],
	setAlbumImages: (
		value:
			| ((prevState: Map<string, string>) => Map<string, string>)
			| Map<string, string>,
	) => void,
) {
	// useEffect with an empty dependency array works the same way as componentDidMount
	useEffect(() => {
		try {
			// set loading to true before calling API
			setLoadingAlbum(true);
			const albumImages: Map<string, string> = new Map();
			for (const track of tracks) {
				fetchAlbumImage(track.id).then((url) => {
					albumImages.set(track.id, url);
				});
			}
			setAlbumImages(albumImages);

			// switch loading to false after fetch is complete
			setLoadingAlbum(false);
		} catch (error) {
			// add error handling here
			setLoadingAlbum(false);
			console.log(error);
		}
	}, []);
}

function getAllUsernames(
	setLoadUsernames: (
		value: ((prevState: boolean) => boolean) | boolean,
	) => void,
	userIds: string[],
	setUsernames: (
		value:
			| ((prevState: Map<string, string>) => Map<string, string>)
			| Map<string, string>,
	) => void,
) {
	// useEffect with an empty dependency array works the same way as componentDidMount
	useEffect(() => {
		try {
			// set loading to true before calling API
			setLoadUsernames(true);
			fetchUsernames(userIds).then((response) => {
				setUsernames(response);
				setLoadUsernames(false);
			});

			// switch loading to false after fetch is complete
			setLoadUsernames(false);
		} catch (error) {
			// add error handling here
			setLoadUsernames(false);
			console.log(error);
		}
	}, []);
}

function Game(props: Props) {
	const [state, setState] = useState<RoundState>(initialState);
	const [loadingAlbum, setLoadingAlbum] = useState(true);
	const [albumImages, setAlbumImages] = useState(new Map<string, string>());
	const [usernames, setUsernames] = useState(new Map<string, string>());
	const [loadUsernames, setLoadUsernames] = useState(true);
	const gameState = useAppSelector((state) => state.gameState);
	const navigate = useNavigate();
	getAllUsernames(setLoadUsernames, gameState.usernames, setUsernames);

	useEffect(() => {
		setState(initialState);
	}, [props]);

	function deleteYearDuplicates(sortedTracks: Track[]) {
		const result: Track[] = [];
		for (let i = 0; i < sortedTracks.length; i++) {
			if (
				i === 0 ||
				result.filter((t) => t.release_date === sortedTracks[i].release_date)
					.length === 0
			) {
				result.push(sortedTracks[i]);
			}
		}
		return result.sort((a, b) => a.release_date.localeCompare(b.release_date));
	}

	if (gameState == null) {
		return <Spinner />;
	} else {
		const songs = gameState.songs;
		const level = gameState.level;
		const gamemode = gameState.gameMode;
		const spotifyApiFrame = props.spotifyIframeApi;
		const numberOfSkips = gameState.numberOfSkips;
		const [inputValue, setInputValue] = useState("");
		const sortedTracks = useMemo(
			() => deleteDuplicates(gameState.allSongs),
			[gameState.allSongs],
		);
		const currentTrack: Track = songs[state.track];

		loadAlbumImages(setLoadingAlbum, songs, setAlbumImages);

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
				gamemode === "user" ? usernames : undefined,
			);

		function toMenu() {
			setState(initialState);
			props.setNumberOfSkips(gameStateSlice.getInitialState().numberOfSkips);
			navigate("/");
		}

		function tryGuess(event: SyntheticEvent) {
			if (
				!isCorrectAnswer(
					inputValue,
					songs[state.track],
					gamemode,
					gamemode === "user" ? usernames : undefined,
				) &&
				numberOfSkips != null
			) {
				props.setNumberOfSkips(numberOfSkips - 1);
			}
			setState({
				...state,
				guesses: [...state.guesses, inputValue],
			});
			setInputValue("");
			if (
				state.guesses.length >= GUESSABLE_TRACK_LENGTHS.length - 1 &&
				!isCorrectAnswer(
					inputValue,
					songs[state.track],
					gamemode,
					gamemode === "user" ? usernames : undefined,
				)
			) {
				goToNextSong(0);
			}
			event.preventDefault();
		}

		function getDatalist(sortedTracks: Track[]) {
			switch (gamemode) {
				case "title":
					return (
						<>
							{sortedTracks.map((track) => (
								<option key={track.uri}>
									`{track.title}` - {track.artists.join(", ")} added by{" "}
									{usernames.get(track.addedBy)}
								</option>
							))}
						</>
					);
				case "artist":
					return (
						<>
							{deleteArtistDuplicates(sortedTracks).map((track) => (
								<option key={track.uri}>`{track.artists.join(", ")}`</option>
							))}
						</>
					);
				case "both":
					return (
						<>
							{sortedTracks.map((track) => (
								<option key={track.uri}>
									`{track.title}` by `{track.artists.join(", ")}`
								</option>
							))}
						</>
					);
				case "user":
					return (
						<>
							{deleteUserDuplicates(sortedTracks).map((track) => (
								<option key={track.uri}>{usernames.get(track.addedBy)}</option>
							))}
						</>
					);
				case "album":
					return (
						<>
							{deleteAlbumDuplicates(sortedTracks).map((track) => (
								<option key={track.uri}>
									`{track.album}` - `{track.title}` by `
									{track.artists.join(", ")}`
								</option>
							))}
						</>
					);
				case "year":
					return (
						<>
							{deleteYearDuplicates(sortedTracks).map((track) => (
								<option key={track.uri}>{track.release_date}</option>
							))}
						</>
					);
			}

			return (
				<>
					{sortedTracks.map((track) => (
						<option key={track.uri}>
							{track.artists[0]} – {track.title}
						</option>
					))}
				</>
			);
		}

		function getEverythingRightText() {
			return (
				"You did it! You have guessed the Title „" +
				currentTrack.title +
				"“ and the artist „" +
				currentTrack.artists.join(" & ") +
				"“ right." +
				" Added to your playlist by " +
				usernames.get(currentTrack.addedBy)
			);
		}

		function getUserNameRightText() {
			return (
				"You did it! You have guessed the user „" +
				usernames.get(currentTrack.addedBy) +
				"“ right, by the way the title was „" +
				currentTrack.title +
				"“."
			);
		}

		function getJustArtistRightText() {
			return (
				"You did it! You have guessed the artist „" +
				currentTrack.artists.join(" & ") +
				"“ right, but the title was „" +
				currentTrack.title +
				"“."
			);
		}

		function getSuccessfullyText() {
			if (gamemode === "album") {
				return (
					"You did it! You have guessed the album „" +
					currentTrack.album +
					"“ right."
				);
			} else if (gamemode === "user") {
				return getUserNameRightText();
			} else {
				return (
					<>
						{isTitleMatching(
							state.guesses[state.guesses.length - 1],
							currentTrack,
						)
							? getEverythingRightText()
							: getJustArtistRightText()}
					</>
				);
			}
		}

		function getPointsForGuess(
			gamemode: "title" | "artist" | "both" | "album" | "user" | "year",
			guessCount: number,
		) {
			if (gamemode === "year") {
				return 2000 - 50 * guessCount;
			}
			const gamemodePoint = gamemode === "album" ? 100 : 200;
			return 2000 - gamemodePoint * guessCount;
		}

		function getSuccessfullyGuessed() {
			const points = getPointsForGuess(gamemode, state.guesses.length);

			return loadingAlbum ? (
				<Spinner />
			) : (
				<div className={classes.successDiv}>
					<img
						src={albumImages.get(currentTrack.id)}
						alt={"Album Image"}
						className={classes.albumImage}
					/>
					<div className={classes.messageSuccess}>{getSuccessfullyText()}</div>
					<button
						className={classes.nextTrack}
						onClick={() => goToNextSong(points)}
					>
						{"Get a new Song"}
					</button>
				</div>
			);
		}

		function goToNextSong(points: number) {
			setState({
				...initialState,
				track: state.track + 1,
				score: state.score + points,
				solution: {
					title: currentTrack.title,
					artists: currentTrack.artists,
					album: currentTrack.album,
					addedBy: currentTrack.addedBy,
					release_date: currentTrack.release_date,
				},
			});
		}

		function getPlaceholderForInput() {
			switch (gamemode) {
				case "title":
					return "search for song title";
				case "artist":
					return "search for artist";
				case "both":
					return "search for artist / song title";
				case "user":
					return "search for user";
				case "album":
					return "search for album";
				case "year":
					return "search for year";
			}
		}

		function getFormIfNotRightGuessed() {
			const isSkippingAllowed =
				state.guesses.length < GUESSABLE_TRACK_LENGTHS.length - 1;
			const noMoreSkipsAllowed = numberOfSkips != null && numberOfSkips === 0;
			return (
				<form
					onSubmit={(event) => {
						tryGuess(event);
					}}
				>
					<div className={classes.formRow}>
						<input
							className={classes.input}
							placeholder={getPlaceholderForInput()}
							type="text"
							value={inputValue}
							onChange={(event) => setInputValue(event.target.value)}
							list="tracks"
						/>
						<datalist id="tracks">{getDatalist(sortedTracks)}</datalist>
					</div>
					<div className={classes.formButtons}>
						{!noMoreSkipsAllowed ? (
							<button
								className={classes.hearMore}
								type="button"
								onClick={() => {
									if (isSkippingAllowed) {
										setState({
											...state,
											guesses: [...state.guesses, "skipped"],
										});
										if (numberOfSkips) {
											props.setNumberOfSkips(numberOfSkips - 1);
										}
									} else {
										goToNextSong(0);
									}
								}}
							>
								{isSkippingAllowed
									? `Skip (+${
											(GUESSABLE_TRACK_LENGTHS[state.guesses.length + 1] -
												GUESSABLE_TRACK_LENGTHS[state.guesses.length]) /
											1000
										}s)`
									: "Next track"}
							</button>
						) : (
							<button
								className={classes.endGame}
								type="button"
								onClick={() => {
									if (numberOfSkips != null) {
										props.setNumberOfSkips(-1);
									}
									goToNextSong(0);
								}}
							>
								End Game
							</button>
						)}

						<button
							className={classes.submit}
							type="submit"
							onClick={(event) => {
								tryGuess(event);
							}}
						>
							Submit
						</button>
					</div>
				</form>
			);
		}

		function getSolutionIfGuessedOrForm() {
			return hasBeenSuccessfullyGuessed
				? getSuccessfullyGuessed()
				: getFormIfNotRightGuessed();
		}

		function getSolutionIfNotRightGuessed() {
			switch (gamemode) {
				case "album":
					return (
						<div className={classes.lastSolution}>
							<p>
								The Album of the last Track was <b>{state.solution!.album}</b>{" "}
								from <b>{state.solution!.artists.join(" & ")}</b> and the Title
								was <b>{state.solution!.title}</b> added by{" "}
								{usernames.get(state.solution!.addedBy)}
							</p>
						</div>
					);
				case "year":
					return (
						<div className={classes.lastSolution}>
							<p>
								The year of the last Track was{" "}
								<b>{state.solution!.release_date}</b> and the Title was{" "}
								<b>{state.solution!.title}</b> added by{" "}
								{usernames.get(state.solution!.addedBy)}
							</p>
						</div>
					);
				default:
					return (
						<div className={classes.lastSolution}>
							<p>
								The Title of the last Track was <b>{state.solution!.title}</b>{" "}
								and the Artist was <b>{state.solution!.artists.join(" & ")}</b>{" "}
								added by {usernames.get(state.solution!.addedBy)}
							</p>
						</div>
					);
			}
		}

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
					{getSolutionIfNotRightGuessed()}
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
				{!hasBeenSuccessfullyGuessed ? (
					<>
						<span>
							You have{" "}
							<b>
								{GUESSABLE_TRACK_LENGTHS.length - state.guesses.length} guesses
							</b>{" "}
							left <br />
						</span>
						{numberOfSkips != null ? (
							<span>
								You have <b>{numberOfSkips} skips or false anwers</b> left
							</span>
						) : null}
						<ol className={classes.guessList}>
							{state.guesses.map((guess, index) => (
								<li key={index} className={classes.guessListItem}>
									{index + 1 + ". " + guess}
								</li>
							))}
						</ol>
					</>
				) : null}

				{state.solution != null && !hasBeenSuccessfullyGuessed
					? getSolutionIfNotRightGuessed()
					: null}

				<SpotifyPlayer
					spotifyIframeApi={spotifyApiFrame}
					uri={currentTrack.uri}
					stopAfterMs={playSongLength}
					progressBarTicksMs={GUESSABLE_TRACK_LENGTHS}
				/>

				{state.guesses.length <= GUESSABLE_TRACK_LENGTHS.length ? (
					<div className={classes.gameForm}>{getSolutionIfGuessedOrForm()}</div>
				) : null}
			</div>
		);
	}
}

export default connect(null, mapDispatchToProps)(Game);
