import { ChakraProvider, Container } from "@chakra-ui/react";
import React, { useState, useEffect } from "react";
import { Route, BrowserRouter, Routes } from "react-router-dom";
import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import { getUserData } from "./spotify_client";
import { system } from "./theme";

export const UserContext = React.createContext(null);

const App = () => {
	const [user, setUser] = useState(null);

	useEffect(() => {
		const fetchUser = async () => {
			getUserData()
				.then((res) => {
					setUser({ display_name: res.display_name });
				})
				.catch((err) => {
					console.error("Error fetching user data:", err);
				});
		};

		fetchUser().catch((err) => console.error(err));
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
