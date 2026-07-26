import { Anchor, Container, Stack, Text, Title } from "@mantine/core";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../UserContext";
import { tracks } from "../api";
import JSONTable from "../components/JSONTable";
import LoadingPage from "../components/LoadingPage";

const Home = () => {
	const { user } = useContext(UserContext);

	const [top20, setTop20] = useState(null);
	// const [bottom20, setBottom20] = useState(null);

	useEffect(() => {
		if (!user.id || !user.lastUpload) {
			return;
		}

		let isActive = true;

		tracks
			.getTop(20)
			.then((data) => {
				if (isActive) {
					setTop20(data ?? []);
				}
			})
			.catch((err) => {
				if (!err._handled) {
					console.error("Error fetching user top tracks:", err);
				}

				if (isActive) {
					setTop20([]);
				}
			});

		return () => {
			isActive = false;
		};
	}, [user.id, user.lastUpload]);

	const isLoading = user.id && user.lastUpload && top20 === null;

	return (
		<Container size="xl">
			<Stack gap="lg">
				<Title>
					Welcome{user.display_name ? " " + user.display_name : ""}!
				</Title>
				{user.lastUpload ? (
					<Text mb="xl">
						Your last data upload:{" "}
						{user.lastUpload && new Date(user.lastUpload).toLocaleString()}
					</Text>
				) : (
					<Text mb="xl">
						Looks like you haven't uploaded any data yet. Add your files{" "}
						<Anchor to="/upload">here</Anchor>.
					</Text>
				)}
				{isLoading ? (
					<LoadingPage />
				) : (
					top20?.length > 0 && (
						<JSONTable
							data={top20}
							keys={[
								"master_metadata_track_name",
								"master_metadata_album_artist_name",
								"liked",
							]}
						/>
					)
				)}
				{/* {loading ? (
					<LoadingPage />
				) : (
					bottom20.length > 0 && (
						<JSONTable
							data={bottom20}
							keys={[
								"master_metadata_track_name",
								"master_metadata_album_artist_name",
								"liked",
							]}
						/>
					)
				)} */}
			</Stack>
		</Container>
	);
};

export default Home;
