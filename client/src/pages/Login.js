import {
	Button,
	Heading,
	Highlight,
	Link,
	Text,
	VStack,
} from "@chakra-ui/react";
import { auth } from "../api";

const Login = () => {
	return (
		<VStack py={8} justify={"center"} h={"100vh"} gap={10}>
			<Heading size={"5xl"} fontWeight={"bold"}>
				<Highlight query={"spot"} styles={{ color: "spot.100" }}>
					welcome to spotutils
				</Highlight>
			</Heading>
			<Link onPointerDown={auth.login} variant={"subtle"}>
				<Button variant={"subtle"}>get started</Button>
			</Link>
			<Text>developed by Mehek Jethani</Text>
		</VStack>
	);
};

export default Login;
