import {
	Button,
	Heading,
	Highlight,
	Link,
	Text,
	VStack,
} from "@chakra-ui/react";

export default function Login() {
	return (
		<VStack py={8} justify={"center"} h={"100vh"} spacing={10}>
			<Heading size={"2xl"}>
				<Highlight query={"spot"} styles={{ color: "spot.100" }}>
					welcome to spotutils
				</Highlight>
			</Heading>
			<Link href={`/login`}>
				<Button bg="bg.muted" color="white">
					get started
				</Button>
			</Link>
			<Text>developed by Mehek Jethani</Text>
		</VStack>
	);
}
