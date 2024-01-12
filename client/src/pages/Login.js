import { Button, Heading, Highlight, Link, VStack } from "@chakra-ui/react";
import { config } from "../constants.js";

export default function Login() {
	return (
		<VStack py={8} justify={"center"} h={"100vh"} spacing={10}>
			<Heading size={"2xl"}>
				<Highlight query={"spot"} styles={{ color: "spot.100" }}>
					welcome to spotutils
				</Highlight>
			</Heading>
			<Link href={`${config.server}/login`}>
				<Button type="submit">get started</Button>
			</Link>
		</VStack>
	);
}
