import { ActionIcon, Anchor, createTheme, Image } from "@mantine/core";

import "@mantine/core/styles.css";
import "@mantine/dropzone/styles.css";
import "./styles.css";
import { Link } from "react-router-dom";

export const theme = createTheme({
	primaryColor: "spotify",
	colors: {
		spotify: [
			"#e7fdea",
			"#c5f7ca",
			"#9df1a4",
			"#6eeb7b",
			"#3fe453",
			"#1ed760",
			"#1ac454",
			"#16b049",
			"#129d3f",
			"#0f8b36",
		],
		dark: [
			"#f5f5f5", // 0
			"#e6e6e6", // 1
			"#d1d1d1", // 2
			"#bfbfbf", // 3
			"#a6a6a6", // 4
			"#8c8c8c", // 5
			"#4d4d4d", // 6
			"#2b2b2b", // 7
			"#151515", // 8
			"#0b0c10", // 9
		],
	},
	autoContrast: true,
	fontFamily: "IBM Plex Mono, monospace",
	fontFamilyMonospace: "IBM Plex Mono, monospace",
	headings: { fontFamily: "Inter, sans-serif" },
	components: {
		Anchor: Anchor.extend({
			defaultProps: {
				component: Link,
				underline: "none",
				c: "white",
				classNames: { root: "hover-green" },
			},
		}),
		Image: Image.extend({
			defaultProps: {
				radius: "sm",
			},
		}),
	},
});
