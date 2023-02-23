import {useEffect, useRef, useState} from "react";
import classes from "./SpotifyPlayer.module.css";
interface Props {
    spotifyIframeApi: IframeApi,
    uri: string
    stopAfterMs: number
}

function SpotifyPlayer(props: Props) {
    const player = useRef<HTMLDivElement>(null);
    const embedControllerRef = useRef<EmbedController | null>(null);
    const [state, setState] = useState({
        isPlaying: false,
        positionMs: 0
    });

    useEffect(() => {
        if (player.current) {
            props.spotifyIframeApi.createController(
                player.current,
                {
                    uri: props.uri
                },
                (embedController) => {
                    if (!embedControllerRef.current) {
                        // TODO: why is this executed multiple times???
                        embedControllerRef.current = embedController;
                    }
                    embedController.addListener('ready', () => console.log('embed ready'));
                    embedController.addListener('playback_update', event => {
                        console.log('playback_update', event.data);
                        setState({ isPlaying: !event.data.isPaused, positionMs: event.data.position})
                        if (!event.data.isPaused && event.data.position > props.stopAfterMs) {
                            embedController.togglePlay();
                            embedController.seek(0);
                            setState({ isPlaying: false, positionMs: 0 });
                        }
                    });
                    console.log(props.spotifyIframeApi, embedController);
                }
            );
        }
    }, []);
    useEffect(() => {
        console.log('new uri: ' + props.uri);
        embedControllerRef.current?.loadUri(props.uri);
        embedControllerRef.current?.seek(0);
        setState({ isPlaying: false, positionMs: 0 });
    }, [props.uri]);

    return (
        <div>
            <button onClick={() => {
                embedControllerRef.current?.play();
            }
            } disabled={state.isPlaying}>Play</button>
            <span>{state?.positionMs ? `${(state?.positionMs / 1000).toFixed(1)}s` : "-"}</span>
            <div className={classes.player}>
                <div ref={player} />
            </div>
        </div>
    )
}

export default SpotifyPlayer
