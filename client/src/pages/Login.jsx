import { Button, Flex, Text, Title } from "@mantine/core";
import { auth } from "../api";

const Login = () => {
	return (
		<Flex direction="column" align="center" justify="center" gap="lg" h="100vh">
			<Title>
				welcome to{" "}
				<Text span inherit c="spotify.6">
					spot
				</Text>
				utils
			</Title>
			<Button variant="outline" onPointerDown={auth.login}>
				get started
			</Button>
			<Text ta="center">developed by Mehek Jethani</Text>
		</Flex>
	);
};

export default Login;
