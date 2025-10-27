import { ChakraProvider, Container } from "@chakra-ui/react";
import React from "react";
import Login from "./pages/Login";
import { system } from "./theme";

export const UserContext = React.createContext(null);

const App = () => {
	return (
		<ChakraProvider value={system}>
			<Container maxW={"container.xl"} bg={"body"} color={"text"}>
				<Login />
			</Container>
		</ChakraProvider>
	);
};

export default App;
