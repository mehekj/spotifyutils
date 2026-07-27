import {
	Anchor,
	Burger,
	Button,
	Collapse,
	Container,
	Flex,
	Stack,
	Text,
	Title,
	Group,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Link } from "react-router-dom";
import { auth } from "../api";
import Logo from "./Logo";
import { useState } from "react";

export default function Navbar() {
	const [opened, { toggle, close }] = useDisclosure(false);
	const [animateLogo, setAnimateLogo] = useState(false);

	const enableLogoAnimate = () => {
		setAnimateLogo(true);
	};

	const disableLogoAnimate = () => {
		setAnimateLogo(false);
	};

	const links = (
		<>
			<Anchor
				component={Link}
				to="/"
				onClick={close}
				fw="bold"
				underline="none"
				classNames={{ root: "hover-green" }}
			>
				home
			</Anchor>
			<Anchor
				component={Link}
				to="/upload"
				onClick={close}
				fw="bold"
				underline="none"
				classNames={{ root: "hover-green" }}
			>
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
				<Title
					component={Link}
					to="/"
					order={3}
					td="none"
					c="white"
					display="flex"
					onMouseEnter={enableLogoAnimate}
					onMouseLeave={disableLogoAnimate}
				>
					<Logo size={90} animate={animateLogo} />
					<Text span inherit ml={4}>
						decod
						<Text span inherit c="spotify.5">
							ify
						</Text>
					</Text>
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
