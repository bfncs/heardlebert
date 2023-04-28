import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import GameMenu from "./GameMenu";
import Game from "./Game";

interface Props {
	spotifyIframeApi: IframeApi;
}

function App(props: Props) {
	return (
		<Router>
			<Routes>
				<Route path="/" element={<GameMenu />} />
				<Route
					path="/game"
					element={<Game spotifyIframeApi={props.spotifyIframeApi} />}
				/>
			</Routes>
		</Router>
	);
}

export default App;
