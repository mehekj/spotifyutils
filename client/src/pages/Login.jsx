import { Button, Stack, Text, Title } from "@mantine/core";
import { auth } from "../api";

const Login = () => {
	return (
		<Stack>
			<Title>spotutils</Title>
			<Button onPointerDown={auth.login}>get started</Button>
			<Text>developed by Mehek Jethani</Text>
		</Stack>
	);
};

export default Login;
