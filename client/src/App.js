import React, { useEffect, useState } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Upload from "./pages/Upload";
import { accessToken, getUserData, logout } from "./spotify";
import { ChakraProvider, Button } from "@chakra-ui/react";

export const UserContext = React.createContext(null);

const App = () => {
	const [token, setToken] = useState(null);
	const [user, setUser] = useState({});

	useEffect(() => {
		setToken(accessToken);

		if (accessToken) {
			const fetchUser = async () => {
				getUserData().then((res) => setUser(res));
			};

			fetchUser().catch((err) => console.error(err));
		}
	}, []);

	return (
		<ChakraProvider>
			{token ? (
				<>
					<NavBar />
					<Button onClick={logout}>log out</Button>
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
		</ChakraProvider>
	);
};

export default App;
