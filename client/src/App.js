import { ChakraProvider, Container } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import { getUserData } from "./spotify_client";
import { system } from "./theme";

export const UserContext = React.createContext(null);

const App = () => {
	const [user, setUser] = useState(null);

	useEffect(() => {
		getUserData()
			.then(setUser)
			.catch((err) => {
				if (!err._handled) {
					console.error("Error fetching user data:", err);
				}
			});
	}, []);

	return (
		<ChakraProvider value={system}>
			<Container
				maxW={"container.xl"}
				bg={"body"}
				color={"text"}
				minW={"100vw"}
				minH={"100vh"}
				p={0}
				m={0}
			>
				{user ? (
					<>
						<NavBar />
						<BrowserRouter>
							<UserContext.Provider value={{ user: user }}>
								<Routes>
									<Route path="/" element={<Home />}></Route>
								</Routes>
							</UserContext.Provider>
						</BrowserRouter>
					</>
				) : (
					<Login />
				)}
			</Container>
		</ChakraProvider>
	);
};

export default App;
