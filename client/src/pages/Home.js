import { Heading, Link, Text, VStack } from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../App";
import JSONTable from "../components/JSONTable";
import { getTop20 } from "../spotify";

export default function Home() {
	const { user } = useContext(UserContext);
	const [top20, setTop20] = useState([]);

	useEffect(() => {
		if (user.id && user.lastUpload) {
			const fetchTop20 = async () => {
				getTop20(user.id).then((res) => setTop20(res));
			};
			fetchTop20().catch((err) => console.error(err));
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
}
