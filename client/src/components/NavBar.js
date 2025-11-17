import {
	Box,
	Button,
	Flex,
	Heading,
	Highlight,
	Stack,
	Text,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import React from "react";
import { FaBars, FaHeart } from "react-icons/fa";
import { auth } from "../api";

const NavBar = () => {
	const [isOpen, setIsOpen] = React.useState(false);

	const toggle = () => setIsOpen(!isOpen);

	return (
		<Flex as="nav" justify="space-between" wrap="wrap" w="100%" mb={8} py={8}>
			<Link to={"/"} _hover={{ textDecoration: "none" }}>
				<Heading size={"lg"} color={"white"}>
					<Highlight query={"spot"} styles={{ color: "spot.100" }}>
						spotutils
					</Highlight>
				</Heading>
			</Link>
			<Button
				display={{ base: "block", md: "none" }}
				onPointerDown={toggle}
				colorScheme="transparent"
			>
				{isOpen ? <FaHeart boxSize={5} /> : <FaBars boxSize={7} />}
			</Button>
			<Box
				display={{ base: isOpen ? "block" : "none", md: "block" }}
				flexBasis={{ base: "100%", md: "auto" }}
				bg={{ base: "gray.700", md: "transparent" }}
				py={{ base: 5, md: 0 }}
			>
				<Stack
					spacing={[5, 5, 10, 10]}
					align="center"
					justify={["center", "center", "flex-end", "flex-end"]}
					direction={["column", "column", "row", "row"]}
				>
					<Link to={"/"}>
						<Text display="block" fontWeight={"bold"}>
							home
						</Text>
					</Link>
					<Link to={"/upload"}>
						<Text display="block" fontWeight={"bold"}>
							upload
						</Text>
					</Link>
					<Button onPointerDown={auth.logout}>log out</Button>
				</Stack>
			</Box>
		</Flex>
	);
};

export default NavBar;
