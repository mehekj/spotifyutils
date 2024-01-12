import { extendTheme } from "@chakra-ui/react";

export const theme = extendTheme({
	colors: {
		spot: "rgb(30, 215, 96)",
	},
	styles: {
		global: (props) => ({
			body: {
				bg: "gray.900",
				color: "white",
			},
		}),
	},
	components: {
		Button: {
			defaultProps: {
				colorScheme: "whiteAlpha",
			},
		},
	},
});
