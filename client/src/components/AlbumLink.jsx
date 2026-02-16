import { Anchor } from "@mantine/core";

export default function AlbumLink({ name, children }) {
	return (
		<Anchor to={`/album?name=${encodeURIComponent(name)}`}>
			{children || name}
		</Anchor>
	);
}
