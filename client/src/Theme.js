import { extendTheme } from "@chakra-ui/react";

export const theme = extendTheme({
	colors: {
		spot: {
			100: "rgb(30, 215, 96)",
			200: "rgb(30, 215, 96)",
			300: "rgb(30, 215, 96)",
			400: "rgb(30, 215, 96)",
			500: "rgb(30, 215, 96)",
			600: "rgb(30, 215, 96)",
			700: "rgb(30, 215, 96)",
			800: "rgb(30, 215, 96)",
			900: "rgb(30, 215, 96)",
		},
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
