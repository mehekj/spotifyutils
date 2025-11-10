import { ChakraProvider, Container } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { users } from "./api";
import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Track from "./pages/Track";
import { system } from "./theme";

export const UserContext = React.createContext(null);

const App = () => {
	const [user, setUser] = useState(null);

	useEffect(() => {
		users
			.getCurrentUser()
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
									<Route path="/track" element={<Track />}></Route>
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
