import { Heading, Link, Text, VStack } from "@chakra-ui/react";
import { useContext } from "react";
import { UserContext } from "../App";

const Home = () => {
	const { user } = useContext(UserContext);

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
		</VStack>
	);
};

export default Home;
