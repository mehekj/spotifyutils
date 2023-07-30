import React, { useState, useEffect } from "react";
import { config } from "./constants.js";
import { accessToken, logout } from "./spotify";

const App = () => {
	const [token, setToken] = useState(null);

	useEffect(() => {
		setToken(accessToken);
	}, []);

	return (
		<div>
			<h1>spotify utils</h1>
			{token ? (
				<button onClick={logout}>log out</button>
			) : (
				<a href={`${config.server}/login`}>get started</a>
			)}
		</div>
	);
};

export default App;
