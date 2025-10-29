import {
	createSystem,
	defaultConfig,
	defineConfig,
	defineRecipe,
} from "@chakra-ui/react";

const buttonRecipe = defineRecipe({
	variants: {
		variant: {
			subtle: {
				fontWeight: "bold",
				fontSize: "md",
				bg: "gray.100/50",
				color: "white",
				borderRadius: "md",
				_hover: {
					bg: "gray.200/70",
				},
				_focus: {
					bg: "gray.200/90",
				},
			},
		},
	},
});

const customConfig = defineConfig({
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
		recipes: {
			button: buttonRecipe,
		},
	},
});

export const system = createSystem(defaultConfig, customConfig);
