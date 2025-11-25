import { useDisclosure } from "@mantine/hooks";
import {
	Container,
	Flex,
	Title,
	Text,
	Burger,
	Button,
	Anchor,
	Paper,
	Stack,
	Drawer,
	Collapse,
} from "@mantine/core";
import { Link } from "react-router-dom";
import { auth } from "../api";

export default function Navbar() {
	const [opened, { toggle, close }] = useDisclosure(false);

	const links = (
		<>
			<Anchor component={Link} to="/" onClick={close} fw="bold">
				home
			</Anchor>
			<Anchor component={Link} to="/upload" onClick={close} fw="bold">
				upload
			</Anchor>
			<Button onPointerDown={auth.logout} variant="light" fw="bold">
				log out
			</Button>
		</>
	);

	return (
		<Container component="nav" size="xl">
			<Flex align="baseline" justify="space-between" py="md">
				<Title component={Link} to="/" order={3} td="none" c="white">
					<Text span inherit c="spotify.6">
						spot
					</Text>
					utils
				</Title>

				<Flex gap="lg" visibleFrom="sm" mb="lg" align="baseline">
					{links}
				</Flex>

				<Burger opened={opened} onClick={toggle} hiddenFrom="sm" />
			</Flex>
			<Collapse hiddenFrom="sm" in={opened}>
				<Stack gap="md" mt="md" align="center" py="md" mb="lg">
					{links}
				</Stack>
			</Collapse>
		</Container>
	);
}
