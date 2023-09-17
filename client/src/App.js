import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { accessToken, logout } from "./spotify";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Upload from "./pages/Upload";
import NavBar from "./components/NavBar";

const App = () => {
	const [token, setToken] = useState(null);

	useEffect(() => {
		setToken(accessToken);
	}, []);

	return (
		<div>
			{token ? (
				<>
					<NavBar />
					<button onClick={logout}>log out</button>
					<Router>
						<Routes>
							<Route path="/" element={<Home />}></Route>
							<Route path="/upload" element={<Upload />}></Route>
						</Routes>
					</Router>
				</>
			) : (
				<Login />
			)}
		</div>
	);
};

export default App;
