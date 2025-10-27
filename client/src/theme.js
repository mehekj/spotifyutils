import { createSystem, defaultConfig } from "@chakra-ui/react";

export const system = createSystem(defaultConfig, {
	theme: {
		tokens: {
			colors: {
				spot: {
					100: { value: "rgb(30, 215, 96)" },
					200: { value: "rgb(30, 215, 96)" },
					300: { value: "rgb(30, 215, 96)" },
					400: { value: "rgb(30, 215, 96)" },
					500: { value: "rgb(30, 215, 96)" },
					600: { value: "rgb(30, 215, 96)" },
					700: { value: "rgb(30, 215, 96)" },
					800: { value: "rgb(30, 215, 96)" },
					900: { value: "rgb(30, 215, 96)" },
				},
			},
		},
		semanticTokens: {
			colors: {
				body: {
					value: "{colors.gray.900}",
				},
				text: {
					value: "{colors.white}",
				},
			},
		},
	},
});
