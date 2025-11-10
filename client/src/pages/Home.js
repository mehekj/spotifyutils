import { Heading, Link, Text, VStack } from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../App";
import { getTop20, getBottom20 } from "../spotify_client";
import JSONTable from "../components/JSONTable";

const Home = () => {
	const { user } = useContext(UserContext);

	const [top20, setTop20] = useState({});
	const [bottom20, setBottom20] = useState({});

	useEffect(() => {
		if (user.id && user.lastUpload) {
			getTop20()
				.then(setTop20)
				.catch((err) => {
					if (!err._handled) {
						console.error("Error fetching user top 20:", err);
					}
				});
			getBottom20()
				.then(setBottom20)
				.catch((err) => {
					if (!err._handled) {
						console.error("Error fetching user bottom 20:", err);
					}
				});
		}
	}, [user]);

	return (
		<VStack align={"flex-start"} spacing={5}>
			<Heading size={"2xl"}>
				Welcome{user.display_name ? " " + user.display_name : ""}!
			</Heading>
			{user.lastUpload ? (
				<Text>
					Your last data upload:{" "}
					{user.lastUpload && new Date(user.lastUpload).toLocaleString()}
				</Text>
			) : (
				<Text>
					Looks like you haven't uploaded any data yet. Add your files{" "}
					<Link href="/upload">here</Link>.
				</Text>
			)}
			{top20.length > 0 && (
				<JSONTable data={top20} keys={["track", "artist", "liked"]} />
			)}
		</VStack>
	);
};

export default Home;
