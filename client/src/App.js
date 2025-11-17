import { ChakraProvider, Container } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { users } from "./api";
import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Track from "./pages/Track";
import { system } from "./theme";
import Upload from "./pages/Upload";

export const UserContext = React.createContext(null);

const App = () => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		users
			.getCurrentUser()
			.then(setUser)
			.catch((err) => {
				if (!err._handled) {
					console.error("Error fetching user data:", err);
				}
			})
			.then(setLoading(false));
	}, []);

	return (
		<BrowserRouter>
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
					{loading ? (
						<p>loading</p>
					) : user ? (
						<>
							<NavBar />
							<UserContext.Provider value={user}>
								<Routes>
									<Route path="/" element={<Home />}></Route>
									<Route path="/track" element={<Track />}></Route>
									<Route path="/upload" element={<Upload />}></Route>
								</Routes>
							</UserContext.Provider>
						</>
					) : (
						<Login />
					)}
				</Container>
			</ChakraProvider>
		</BrowserRouter>
	);
};

export default App;
