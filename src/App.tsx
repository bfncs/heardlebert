import SpotifyPlayer from "./SpotifyPlayer";
import {useState} from "react";
import {tracks} from "./tracks";

interface Props {
    spotifyIframeApi: IframeApi
}

function App(props: Props) {
    const [currentTrack, setCurrentTrack] = useState(0);
    return (
        <div className="App">
            <h1>Guess this song</h1>
            <button onClick={() => {
                setCurrentTrack((currentTrack + 1 >= tracks.length) ? 0 : currentTrack + 1);
            }
            }>Skip track</button>
            <SpotifyPlayer spotifyIframeApi={props.spotifyIframeApi} uri={tracks[currentTrack].uri} stopAfterMs={1500}/>
        </div>
    )
}

export default App
