import { CloseIcon, HamburgerIcon } from "@chakra-ui/icons";
import {
	Box,
	Button,
	Flex,
	Heading,
	Highlight,
	Link,
	Stack,
	Text,
} from "@chakra-ui/react";
import React from "react";
import { logout } from "../spotify";

const NavBar = (props) => {
	const [open, setopen] = React.useState(false);

	const toggle = () => setopen(!open);

	return (
		<Flex as="nav" justify="space-between" wrap="wrap" w="100%" mb={8} py={8}>
			<Link href={"/"} _hover={{ textDecoration: "none" }}>
				<Heading size={"lg"}>
					<Highlight query={"spot"} styles={{ color: "spot" }}>
						spotutils
					</Highlight>
				</Heading>
			</Link>
			<Button
				display={{ base: "block", md: "none" }}
				onPointerDown={toggle}
				colorScheme="transparent"
			>
				{open ? <CloseIcon boxSize={5} /> : <HamburgerIcon boxSize={7} />}
			</Button>
			<Box
				display={{ base: open ? "block" : "none", md: "block" }}
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
					<Link href={"/"}>
						<Text display="block" fontWeight={"bold"}>
							home
						</Text>
					</Link>
					<Link href={"/upload"}>
						<Text display="block" fontWeight={"bold"}>
							upload
						</Text>
					</Link>
					<Button onPointerDown={logout}>log out</Button>
				</Stack>
			</Box>
		</Flex>
	);
};

export default NavBar;
