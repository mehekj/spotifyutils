import { Table, Text } from "@mantine/core";
import AlbumLink from "./AlbumLink";
import ArtistLink from "./ArtistLink";
import LikeButton from "./LikeButton";
import TrackLink from "./TrackLink";

export default function JSONTable({ data, keys = null }) {
	const cell = (row, key) => {
		switch (key) {
			case "liked":
				return (
					<LikeButton uri={row["spotify_track_uri"]} like={row["liked"]} />
				);
			case "track":
				return (
					<TrackLink uri={row["spotify_track_uri"]}>{row["name"]}</TrackLink>
				);
			case "artist":
				return row["artists"].map((artist, idx) => (
					<span key={artist.uri || artist.name || idx}>
						<ArtistLink uri={artist.uri} name={artist.name} />
						{idx < row["artists"].length - 1 && ", "}
					</span>
				));
			case "album":
				return (
					<AlbumLink uri={row["album_uri"]} name={row["album"]}>
						{row["album"]}
					</AlbumLink>
				);
			default:
				return <Text>{row[key] ?? ""}</Text>;
		}
	};

	return (
		<Table tabularNums>
			<Table.Thead>
				<Table.Tr>
					{keys.map((col, i) => (
						<Table.Th key={`col${i}`}>{col}</Table.Th>
					))}
				</Table.Tr>
			</Table.Thead>
			<Table.Tbody>
				{data &&
					data.length > 0 &&
					[...data].map((row, i) => (
						<Table.Tr key={`row${i}`}>
							{keys.map((key, j) => (
								<Table.Td key={`cell${j}`}>{cell(row, key, j)}</Table.Td>
							))}
						</Table.Tr>
					))}
			</Table.Tbody>
		</Table>
	);
}
