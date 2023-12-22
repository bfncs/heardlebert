import React, { useState } from "react";
import classes from "./PlaylistSelector.module.scss";
interface Props {
	defaultPlaylists: { id: string; title: string }[];
	onPlaylistSelected: (playlistId: string) => void;
}

const SELECT_VALUE_CUSTOM = "CUSTOM";

const PlaylistSelector = ({ defaultPlaylists, onPlaylistSelected }: Props) => {
	const [selectValue, setSelectValue] = useState(defaultPlaylists[0].id);
	const [customInputValue, setCustomInputValue] = useState("");
	return (
		<div className={classes.wrapper}>
			<div>
				<h3>Choose playlist</h3>
				<select
					value={selectValue}
					onChange={(event) => {
						console.log(event.target.value);
						setSelectValue(event.target.value);
					}}
				>
					{defaultPlaylists.map(({ id, title }) => (
						<option key={id} value={id}>
							{title}
						</option>
					))}
					<option key={SELECT_VALUE_CUSTOM} value={SELECT_VALUE_CUSTOM}>
						Custom Playlist ID
					</option>
				</select>
				{selectValue === SELECT_VALUE_CUSTOM && (
					<input
						type="text"
						value={customInputValue}
						onChange={(event) => setCustomInputValue(event.target.value)}
					/>
				)}
				<button
					onClick={() => {
						onPlaylistSelected(
							selectValue === SELECT_VALUE_CUSTOM
								? customInputValue
								: selectValue
						);
					}}
				>
					Select
				</button>
			</div>
		</div>
	);
};

export default PlaylistSelector;
