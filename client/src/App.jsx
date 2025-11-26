import { Loader, MantineProvider } from "@mantine/core";
import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { users } from "./api";
import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Track from "./pages/Track";
import Upload from "./pages/Upload";
import "./styles.css";
import { theme } from "./theme";
import { UserContext } from "./UserContext";

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
			.then(() => setLoading(false));
	}, []);

	return (
		<MantineProvider
			theme={theme}
			defaultColorScheme="dark"
			cssVariablesResolver={(theme) => ({
				dark: {
					"--mantine-color-body": theme.colors.dark[9],
					"--mantine-color-text": theme.white,
					"--mantine-color-bright": theme.white,
				},
				variables: {
					"--mantine-primary-color-filled": theme.colors.spotify[6],
					"--mantine-primary-color-filled-hover": theme.colors.spotify[5],
				},
			})}
		>
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
		</MantineProvider>
	);
}
