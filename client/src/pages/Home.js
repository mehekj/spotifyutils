import { Heading, VStack } from "@chakra-ui/react";
import { useContext } from "react";
import { UserContext } from "../App";

const Home = () => {
	const { user } = useContext(UserContext);

	return (
		<VStack align={"flex-start"} spacing={5}>
			<Heading size={"2xl"}>
				Welcome{user.display_name ? " " + user.display_name : ""}!
			</Heading>
		</VStack>
	);
};

export default Home;
