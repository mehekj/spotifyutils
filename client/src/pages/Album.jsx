import { Container, Group, Image, Stack, Text, Title } from "@mantine/core";
import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router";
import { albums } from "../api/albums";
import ArtistLink from "../components/ArtistLink";
import JSONTable from "../components/JSONTable";
import LoadingPage from "../components/LoadingPage";
import { UserContext } from "../UserContext";

export default function AlbumPage() {
	const { user } = useContext(UserContext);
	const { uri } = useParams();
	const [albumStreams, setAlbumStreams] = useState(null);
	const [albumInfo, setAlbumInfo] = useState(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const fetchData = async () => {
			if (!user.id || !uri) return;

			try {
				setLoading(true);
				const infoRes = await albums.getAlbumInfo(uri);
				setAlbumInfo(infoRes);
				const streamsRes = await albums.getStreams(uri);
				setAlbumStreams(streamsRes);
				setLoading(false);
			} catch (error) {
				console.error("Failed to fetch album data:", error);
			}
		};

		fetchData();
	}, [uri, user.id]);

	if (loading) return <LoadingPage />;

	return (
		<Container size="xl">
			<Stack gap="xl">
				{albumInfo !== null && (
					<Group align="end" my="xl" grow preventGrowOverflow={false}>
						<Image
							src={albumInfo.images[1].url}
							maw={albumInfo.images[1].width}
							mr="xl"
						/>
						<Stack>
							<Group>
								<Title mr="sm" size={48}>
									{albumInfo.name}
								</Title>
							</Group>
							<Group align="baseline">
								<Text fz={20} ta="center">
									{albumInfo.artists.map((artist, idx) => (
										<>
											<ArtistLink uri={artist.uri} name={artist.name} />
											{idx < albumInfo.artists.length - 1 && ", "}
										</>
									))}
								</Text>
							</Group>
						</Stack>
					</Group>
				)}
				{albumStreams !== null && (
					<JSONTable data={albumStreams} keys={["ts", "track", "artist"]} />
				)}
			</Stack>
		</Container>
	);
}
