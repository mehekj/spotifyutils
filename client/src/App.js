import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { accessToken, logout } from "./spotify";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Upload from "./pages/Upload";
import NavBar from "./components/NavBar";
import { getUserData } from "./spotify";

export const UserContext = React.createContext(null);

const App = () => {
	const [token, setToken] = useState(null);
	const [user, setUser] = useState({});

	useEffect(() => {
		setToken(accessToken);

		if (accessToken) {
			const fetchUser = async () => {
				getUserData().then((res) => setUser(res.data));
			};

			fetchUser().catch((err) => console.error(err));
		}
	}, []);

	return (
		<div>
			{token ? (
				<>
					<NavBar />
					<button onClick={logout}>log out</button>
					<Router>
						<UserContext.Provider value={{ user: user }}>
							<Routes>
								<Route path="/" element={<Home />}></Route>
								<Route path="/upload" element={<Upload />}></Route>
							</Routes>
						</UserContext.Provider>
					</Router>
				</>
			) : (
				<Login />
			)}
		</div>
	);
};

export default App;
