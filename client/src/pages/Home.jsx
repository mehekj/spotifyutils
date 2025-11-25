import { Stack, Text, Title, Container, Anchor } from "@mantine/core";
import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../App";
import { tracks } from "../api";
import JSONTable from "../components/JSONTable";

const Home = () => {
	const user = useContext(UserContext);

	const [top20, setTop20] = useState({});
	const [bottom20, setBottom20] = useState({});

	useEffect(() => {
		if (user.id && user.lastUpload) {
			tracks
				.getTop(20)
				.then(setTop20)
				.catch((err) => {
					if (!err._handled) {
						console.error("Error fetching user top tracks:", err);
					}
				});
			tracks
				.getBottom(20)
				.then(setBottom20)
				.catch((err) => {
					if (!err._handled) {
						console.error("Error fetching user bottom tracks:", err);
					}
				});
		}
	}, [user]);

	return (
		<Container size="xl">
			<Stack gap="lg">
				<Title>
					Welcome{user.display_name ? " " + user.display_name : ""}!
				</Title>
				{user.lastUpload ? (
					<Text>
						Your last data upload:{" "}
						{user.lastUpload && new Date(user.lastUpload).toLocaleString()}
					</Text>
				) : (
					<Text>
						Looks like you haven't uploaded any data yet. Add your files{" "}
						<Anchor to="/upload">here</Anchor>.
					</Text>
				)}
				{top20.length > 0 && (
					<JSONTable data={top20} keys={["track", "artist", "liked"]} />
				)}
			</Stack>
		</Container>
	);
};

export default Home;
