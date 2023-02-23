import SpotifyPlayer from "./SpotifyPlayer";

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
    }
]

function App(props: Props) {
    return (
        <div className="App">
            <h1>Guess this song</h1>
            <SpotifyPlayer spotifyIframeApi={props.spotifyIframeApi} uri={tracks[0].uri} stopAfterMs={1500}/>
        </div>
    )
}

export default App
