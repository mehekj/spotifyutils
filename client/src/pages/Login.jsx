import { Button, Flex, Text, Title } from "@mantine/core";
import { auth } from "../api";
import Logo from "../components/Logo";

const Login = () => {
	return (
		<Flex direction="column" align="center" justify="center" gap="lg" h="100vh">
			<Logo size={200} animate={true} />
			<Title>
				welcome to decod
				<Text span inherit c="spotify.5">
					ify
				</Text>
			</Title>
			<Text ta="center">your spotify data, decoded</Text>
			<Button variant="outline" onPointerDown={auth.login}>
				get started
			</Button>
		</Flex>
	);
};

export default Login;
