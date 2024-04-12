import { GameMode } from "./gameStateSlice";
import { Track } from "./types/types";
import { JSX } from "react";

interface ExternalProps {
	gamemode: GameMode;
	solution: Track;
	usernames: Map<string, string>;
}

export const Solution = (props: ExternalProps): JSX.Element => {
	switch (props.gamemode) {
		case GameMode.ALBUM:
			return (
				<div>
					<p>
						The Album of the last Track was <b>{props.solution.album}</b> from{" "}
						<b>{props.solution.artists.join(" & ")}</b> and the Title was{" "}
						<b>{props.solution.title}</b> added by{" "}
						{props.usernames.get(props.solution.addedBy)}
					</p>
				</div>
			);
		case GameMode.YEAR:
			return (
				<div>
					<p>
						The year of the last Track was <b>{props.solution.release_date}</b>{" "}
						and the Title was <b>{props.solution.title}</b> added by{" "}
						{props.usernames.get(props.solution.addedBy)}
					</p>
				</div>
			);
		default:
			return (
				<div>
					<p>
						The Title of the last Track was <b>{props.solution.title}</b> and
						the Artist was <b>{props.solution.artists.join(" & ")}</b> added by{" "}
						{props.usernames.get(props.solution.addedBy)}
					</p>
				</div>
			);
	}
};
