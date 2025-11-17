import { Button, Flex, Stack, Text, Title } from "@mantine/core";
import React from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { Link } from "react-router-dom";
import { auth } from "../api";

const NavBar = () => {
	const [isOpen, setIsOpen] = React.useState(false);

	const toggle = () => setIsOpen(!isOpen);

	return (
		<Flex as="nav">
			<Link to={"/"}>
				<Title>spotutils</Title>
			</Link>
			<Button onPointerDown={toggle}>
				{isOpen ? <FaTimes boxSize={5} /> : <FaBars boxSize={7} />}
			</Button>
			<Stack>
				<Link to={"/"}>
					<Text>home</Text>
				</Link>
				<Link to={"/upload"}>
					<Text>upload</Text>
				</Link>
				<Button onPointerDown={auth.logout}>log out</Button>
			</Stack>
		</Flex>
	);
};

export default NavBar;
