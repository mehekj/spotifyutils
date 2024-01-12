import { ChakraProvider, Container } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { theme } from "./Theme";
import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Upload from "./pages/Upload";
import { accessToken, getUserData } from "./spotify";

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
		<ChakraProvider theme={theme}>
			<Container maxW={"container.xl"}>
				{token ? (
					<>
						<NavBar />
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
			</Container>
		</ChakraProvider>
	);
};

export default App;
