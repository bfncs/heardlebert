import SpotifyPlayer from "./SpotifyPlayer";
import {useState} from "react";
import {Track, tracks} from "./tracks";
import classes from "./App.module.css";

interface Props {
    spotifyIframeApi: IframeApi
}

type GameState = {
    track: number, guesses: string[]
};

function isCorrectAnswer(inputValue: string, currentTrack: Track) {
    return inputValue.toLowerCase().includes(currentTrack.title.toLowerCase());
}

function App(props: Props) {
    const [inputValue, setInputValue] = useState("");
    const [state, setState] = useState<GameState>(
        {
            track: 0,
            guesses: []
        }
    );
    const currentTrack: Track = tracks[state.track];
    const playSongLength = 1500 + (state.guesses.length * 1500);
    return (
        <div className="App">
            <h1>Guess this song</h1>
            <ul>
                {state.guesses.map((guess, index) => (
                    <li key={index}>{guess} {isCorrectAnswer(guess, currentTrack) ? '✅' : '❎'}</li>
                ))}
            </ul>
            <form onSubmit={event => {
                setState({
                    ...state,
                    guesses: [...state.guesses, inputValue]
                })
                if (isCorrectAnswer(inputValue, currentTrack)) {
                    console.log('guess correct!');
                } else {
                    console.log('guess wrong!');
                }
                setInputValue("");
                event.preventDefault();
            }
            }>
                <input className={classes.input} placeholder={"Enter your guess"} type="text" value={inputValue} onChange={event => setInputValue(event.target.value)}/>
            </form>
            <SpotifyPlayer spotifyIframeApi={props.spotifyIframeApi} uri={currentTrack.uri} stopAfterMs={playSongLength}/>
            <button onClick={() => {
                setState({track: (state.track + 1 >= tracks.length) ? 0 : state.track + 1})
            }
            }>Skip track
            </button>
        </div>
    )
}

export default App
