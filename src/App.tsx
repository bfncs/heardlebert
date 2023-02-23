import SpotifyPlayer from "./SpotifyPlayer";
import {useState} from "react";

interface Props {
    spotifyIframeApi: IframeApi
}

interface Track {
    uri: string
    artist: string
    title: string
}

const tracks: Track[] = [
    {
        uri: "spotify:track:3JPcICirkAw4TLp9UzEcfl",
        artist: "Mr. Oizo",
        title: "Flat Beat"
    },
    {
        uri: "spotify:track:0usJ6ywAqqeJx1nQl5SWlP",
        artist: "No Doubt",
        title: "Don't speak"
    },
    {
        uri: "spotify:track:3MjUtNVVq3C8Fn0MP3zhXa",
        artist: "Britney Spears",
        title: "...Baby One More Time"
    }
]

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
