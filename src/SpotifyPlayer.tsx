import React, { useEffect, useRef, useState } from "react";
import classes from "./SpotifyPlayer.module.scss";

interface Props {
	spotifyIframeApi: IframeApi;
	uri: string;
	stopAfterMs: number;
	progressBarTicksMs: number[];
}

interface State {
	isPlaying: boolean;
	isLoading: boolean;
	trackStartTime: number | null;
}

const initialState: State = {
	isPlaying: false,
	isLoading: false,
	trackStartTime: null,
};

function SpotifyPlayer(props: Props) {
	const player = useRef<HTMLDivElement>(null);
	const embedControllerRef = useRef<EmbedController | null>(null);
	const [state, setState] = useState<State>(initialState);
	const stopAfterMs = useRef<number>(0);
	useEffect(() => {
		stopAfterMs.current = props.stopAfterMs;
	}, [props.stopAfterMs]);

	useEffect(() => {
		if (player.current) {
			props.spotifyIframeApi.createController(
				player.current,
				{
					uri: props.uri,
				},
				(embedController) => {
					if (!embedControllerRef.current) {
						embedControllerRef.current = embedController;
					}
					embedController.addListener("ready", () =>
						console.debug("embed ready")
					);
					embedController.addListener("playback_update", (event) => {
						console.debug(
							"playback_update",
							event.data,
							event.data.position > stopAfterMs.current
						);
						setState((prevState) => {
							let nextTrackStartTime;
							if (event.data.isPaused) {
								nextTrackStartTime = null;
							} else if (prevState.trackStartTime !== null) {
								nextTrackStartTime = prevState.trackStartTime;
							} else {
								nextTrackStartTime = Date.now() - event.data.position;
							}
							return {
								isPlaying: !event.data.isPaused,
								isLoading: event.data.position === 0,
								trackStartTime: nextTrackStartTime,
							};
						});
					});
					console.debug(props.spotifyIframeApi, embedController);
				}
			);
		}
	}, []);

	useEffect(() => {
		console.debug("new uri: " + props.uri);
		embedControllerRef.current?.loadUri(props.uri);
		embedControllerRef.current?.seek(0);
		setState(initialState);
	}, [props.uri]);

	const maxPlayLength =
		props.progressBarTicksMs[props.progressBarTicksMs.length - 1];
	const progressBarRef = useRef<HTMLDivElement | null>(null);
	useEffect(() => {
		const intervalId = setInterval(() => {
			const positionMs = state.trackStartTime
				? Math.min(Date.now() - state.trackStartTime, props.stopAfterMs)
				: 0;
			progressBarRef.current?.setAttribute(
				"style",
				`transform: scaleX(${positionMs / maxPlayLength})`
			);

			if (positionMs >= props.stopAfterMs && embedControllerRef.current) {
				console.debug("time's up, pause & rewind");
				embedControllerRef.current.pause();
				embedControllerRef.current.seek(0);
				setState((prevState) => ({
					...prevState,
					isPlaying: false,
					isLoading: false,
				}));
			}
		}, 50);
		return () => clearInterval(intervalId);
	});

	return (
		<div className={classes.wrapper}>
			<div className={classes.progressWrapper}>
				<div
					className={classes.stopAfterBar}
					style={{ transform: `scaleX(${props.stopAfterMs / maxPlayLength})` }}
				/>
				<div className={classes.progressBar} ref={progressBarRef} />
				{props.progressBarTicksMs.map((tick) => (
					<span
						key={`span-${tick}`}
						className={classes.progressTick}
						style={{ left: `${(tick / maxPlayLength) * 100}%` }}
					/>
				))}
			</div>
			<div className={classes.buttonAndContainerDescription}>
				<span className={classes.times}>
					{state.trackStartTime
						? (
								Math.min(Date.now() - state.trackStartTime, props.stopAfterMs) /
								1000
						  ).toFixed(0)
						: "0"}
					s
				</span>

				<button
					className={classes.playButton}
					onClick={() => {
						embedControllerRef.current?.play();
						setState({ ...state, isLoading: true });
					}}
					disabled={state.isLoading || state.isPlaying}
				/>

				<span className={classes.times}>15s</span>

				<div className={classes.player}>
					<div ref={player} />
				</div>
			</div>
		</div>
	);
}

export default SpotifyPlayer;
