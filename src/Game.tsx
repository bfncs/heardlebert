import SpotifyPlayer from "./SpotifyPlayer";
import React, { SyntheticEvent, useEffect, useMemo, useState } from "react";
import classes from "./Game.module.scss";
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
import { fetchAlbumImage, fetchUsernames } from "./spotifyApi";
import { RoundState, Track } from "./types/types";
import {
	deleteAlbumDuplicates,
	deleteArtistDuplicates,
	deleteDuplicates,
	deleteUserDuplicates,
	deleteYearDuplicates,
	getEverythingRightText,
	getJustArtistRightText,
	getPlaceholderForInput,
	getPointsForGuess,
} from "./utils/helperMethods";
import { GuessList } from "./GuessList";
import { Solution } from "./Solution";

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
				gamemode === GameMode.USER ? usernames : undefined,
			);

		const toMenu = () => {
			setState(initialState);
			props.setNumberOfSkips(gameStateSlice.getInitialState().numberOfSkips);
			navigate("/");
		};
		const tryGuess = (event: SyntheticEvent) => {
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
		};
		const getDatalist = (sortedTracks: Track[]) => {
			switch (gamemode) {
				case GameMode.TITLE:
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
				case GameMode.ARTIST:
					return (
						<>
							{deleteArtistDuplicates(sortedTracks).map((track) => (
								<option key={track.uri}>`{track.artists.join(", ")}`</option>
							))}
						</>
					);
				case GameMode.BOTH:
					return (
						<>
							{sortedTracks.map((track) => (
								<option key={track.uri}>
									`{track.title}` by `{track.artists.join(", ")}`
								</option>
							))}
						</>
					);
				case GameMode.USER:
					return (
						<>
							{deleteUserDuplicates(sortedTracks).map((track) => (
								<option key={track.uri}>{usernames.get(track.addedBy)}</option>
							))}
						</>
					);
				case GameMode.ALBUM:
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
				case GameMode.YEAR:
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
		};
		const getUserNameRightText = () => {
			return (
				"You did it! You have guessed the user „" +
				usernames.get(currentTrack.addedBy) +
				"“ right, by the way the title was „" +
				currentTrack.title +
				"“."
			);
		};
		const getSuccessfullyText = () => {
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
							? getEverythingRightText(currentTrack, usernames)
							: getJustArtistRightText(currentTrack)}
					</>
				);
			}
		};
		const getSuccessfullyGuessed = () => {
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
		};
		const goToNextSong = (points: number) => {
			setState({
				...initialState,
				track: state.track + 1,
				score: state.score + points,
				solution: {
					uri: currentTrack.uri,
					id: currentTrack.id,
					popularity: currentTrack.popularity,
					title: currentTrack.title,
					artists: currentTrack.artists,
					album: currentTrack.album,
					addedBy: currentTrack.addedBy,
					release_date: currentTrack.release_date,
				},
			});
		};
		const getFormIfNotRightGuessed = () => {
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
							placeholder={getPlaceholderForInput(gamemode)}
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
		};
		const getSolutionIfGuessedOrForm = () => {
			return hasBeenSuccessfullyGuessed
				? getSuccessfullyGuessed()
				: getFormIfNotRightGuessed();
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
					{
						<Solution
							gamemode={gamemode}
							solution={state.solution!}
							usernames={usernames}
						/>
					}
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
						{<GuessList guesses={state.guesses} />}
					</>
				) : null}

				{state.solution != null && !hasBeenSuccessfullyGuessed ? (
					<Solution
						gamemode={gamemode}
						solution={state.solution}
						usernames={usernames}
					/>
				) : null}

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
