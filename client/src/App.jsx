import { MantineProvider } from "@mantine/core";
import { useContext } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Album from "./pages/Album";
import { UserContext } from "./UserContext";
import UploadProvider from "./components/UploadProvider";
import UserProvider from "./components/UserProvider";

import LoadingPage from "./components/LoadingPage";
import NavBar from "./components/NavBar";
import Artist from "./pages/Artist";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Track from "./pages/Track";
import Upload from "./pages/Upload";
import { theme } from "./theme";

function AppContent() {
	const { user, loading } = useContext(UserContext);

	if (loading) return <LoadingPage />;
	if (!user) return <Login />;

	return (
		<>
			<NavBar />
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/track" element={<Track />} />
				<Route path="/upload" element={<Upload />} />
				<Route path="/artist" element={<Artist />} />
				<Route path="/album" element={<Album />} />
			</Routes>
		</>
	);
}

export default function App() {
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
					"--mantine-primary-color-filled": theme.colors.spotify[5],
					"--mantine-primary-color-filled-hover": theme.colors.spotify[4],
				},
			})}
		>
			<BrowserRouter>
				<UserProvider>
					<UploadProvider>
						<AppContent />
					</UploadProvider>
				</UserProvider>
			</BrowserRouter>
		</MantineProvider>
	);
}
