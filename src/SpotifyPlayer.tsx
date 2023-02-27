import React, { useEffect, useRef, useState } from "react";
import classes from "./SpotifyPlayer.module.scss";
import { Spinner } from "@blueprintjs/core";
import classNames from "classnames";

interface Props {
	spotifyIframeApi: IframeApi;
	uri: string;
	stopAfterMs: number;
	playerSpans: boolean[];
}

function SpotifyPlayer(props: Props) {
	const player = useRef<HTMLDivElement>(null);
	const embedControllerRef = useRef<EmbedController | null>(null);
	const [state, setState] = useState({
		isPlaying: false,
		isLoading: false,
		positionMs: 0,
	});
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
						// TODO: why is this executed multiple times???
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
						if (
							!event.data.isPaused &&
							event.data.position > stopAfterMs.current
						) {
							console.debug("time over, setting back");
							embedController.pause();
							embedController.seek(0);
							setState({ isPlaying: false, isLoading: false, positionMs: 0 });
						} else {
							setState({
								isPlaying: !event.data.isPaused,
								isLoading: event.data.position === 0,
								positionMs: event.data.position,
							});
						}
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
		setState({ isPlaying: false, isLoading: false, positionMs: 0 });
	}, [props.uri]);

	return (
		<div className={classes.wrapper}>
			<div className={classes.playContainer}>
				{props.playerSpans.map((span, index) => (
					<>
						<span
							key={index}
							className={classNames(classes.playingSpan, {
								[classes.playingFilled]: span,
								[classes.notLastPlaying]: index !== 9,
							})}
						></span>
						<span
							key={"border-" + index}
							className={classNames({ [classes.notLastBorder]: index !== 9 })}
						></span>
					</>
				))}
			</div>
			<div className={classes.buttonAndContainerDescription}>
				<span className={classes.times}>1.5s</span>

				{state.isLoading ? (
					<Spinner size={12} className={classes.spinner} />
				) : (
					<button
						className={classes.playButton}
						onClick={() => {
							embedControllerRef.current?.play();
							setState({ ...state, isLoading: true });
						}}
						disabled={state.isLoading || state.isPlaying}
					/>
				)}

				<span className={classes.times}>15s</span>

				<div className={classes.player}>
					<div ref={player} />
				</div>

				{/*<div className={classes.progress}>
					{state?.positionMs
						? `${Number((state?.positionMs / 1000).toPrecision(2)).toFixed(1)}s`
						: "-"}{" "}
					/ {(stopAfterMs.current / 1000).toFixed(1)}s
				</div>*/}
			</div>
		</div>
	);
}

export default SpotifyPlayer;
