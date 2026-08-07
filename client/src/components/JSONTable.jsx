import { Table, Text } from "@mantine/core";
import AlbumLink from "./AlbumLink";
import ArtistLink from "./ArtistLink";
import LikeButton from "./LikeButton";
import TrackLink from "./TrackLink";

export default function JSONTable({ data, keys = null }) {
	const truncate = (str, n) => {
		return str.length > n ? str.slice(0, n - 1) + "..." : str;
	};

	const getTrackURI = (row) => {
		return row.spotifyTrackURI || row._id || null;
	};

	const getLiked = (row) => {
		return row.liked || false;
	};

	const getTrackName = (row) => {
		return truncate(row.name, 48) || null;
	};

	const getArtists = (row) => {
		return row.artistNames.map((name, idx) => {
			return { name, uri: row.artistURIs[idx] };
		});
	};

	const getAlbumName = (row) => {
		return truncate(row.albumName, 48) || null;
	};

	const getAlbumURI = (row) => {
		return row.albumURI || null;
	};

	const cell = (row, key) => {
		switch (key) {
			case "liked":
				return <LikeButton uri={getTrackURI(row)} like={getLiked(row)} />;
			case "track":
				return <TrackLink uri={getTrackURI(row)}>{getTrackName(row)}</TrackLink>;
			case "artist":
				return getArtists(row).map((artist, idx) => (
					<span key={artist.uri || artist.name || idx}>
						<ArtistLink uri={artist.uri} name={artist.name} />
						{idx < getArtists(row).length - 1 && ", "}
					</span>
				));
			case "album":
				return (
					<AlbumLink uri={getAlbumURI(row)} name={getAlbumName(row)}>
						{getAlbumName(row)}
					</AlbumLink>
				);
			default:
				return <Text>{row[key] != null ? String(row[key]) : ""}</Text>;
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
