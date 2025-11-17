import { Container, Loader, MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/dropzone/styles.css";
import { createContext, useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { users } from "./api";
import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Track from "./pages/Track";
import Upload from "./pages/Upload";

export const UserContext = createContext(null);

export default function App() {
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
		<MantineProvider>
			<Container>
				<BrowserRouter>
					{loading ? (
						<Loader />
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
				</BrowserRouter>
			</Container>
		</MantineProvider>
	);
}
