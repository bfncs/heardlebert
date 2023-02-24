import React, { useEffect, useRef, useState } from "react";
import classes from "./SpotifyPlayer.module.css";
import { Icon, Spinner } from "@blueprintjs/core";

interface Props {
	spotifyIframeApi: IframeApi;
	uri: string;
	stopAfterMs: number;
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
						console.log("embed ready")
					);
					embedController.addListener("playback_update", (event) => {
						console.log(
							"playback_update",
							event.data,
							event.data.position > stopAfterMs.current
						);
						if (
							!event.data.isPaused &&
							event.data.position > stopAfterMs.current
						) {
							console.log("time over, setting back");
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
					console.log(props.spotifyIframeApi, embedController);
				}
			);
		}
	}, []);

	useEffect(() => {
		console.log("new uri: " + props.uri);
		embedControllerRef.current?.loadUri(props.uri);
		embedControllerRef.current?.seek(0);
		setState({ isPlaying: false, isLoading: false, positionMs: 0 });
	}, [props.uri]);

	return (
		<div className={classes.wrapper}>
			<button
				onClick={() => {
					embedControllerRef.current?.play();
					setState({ ...state, isLoading: true });
				}}
				disabled={state.isLoading || state.isPlaying}
			>
				<Icon icon="play" />
				Play
				{state.isLoading ? (
					<Spinner size={12} className={classes.spinner} />
				) : null}
			</button>
			<div className={classes.progress}>
				{state?.positionMs ? `${(state?.positionMs / 1000).toFixed(1)}s` : "-"}
			</div>
			<div className={classes.player}>
				<div ref={player} />
			</div>
		</div>
	);
}

export default SpotifyPlayer;
