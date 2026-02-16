import { Container, Group, Image, Stack, Text, Title } from "@mantine/core";
import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { albums } from "../api/albums";
import ArtistLink from "../components/ArtistLink";
import JSONTable from "../components/JSONTable";
import LoadingPage from "../components/LoadingPage";
import { UserContext } from "../UserContext";

export default function AlbumPage() {
	const { user } = useContext(UserContext);
	const [searchParams] = useSearchParams();
	const [albumStreams, setAlbumStreams] = useState(null);
	const [albumInfo, setAlbumInfo] = useState(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const fetchData = async () => {
			const albumName = searchParams.get("name");
			if (!user.id || !albumName) return;

			try {
				setLoading(true);
				const infoRes = await albums.getAlbumInfo(albumName);
				setAlbumInfo(infoRes);
				if (infoRes && infoRes.uri) {
					const streamsRes = await albums.getStreams(albumName);
					setAlbumStreams(streamsRes);
				}
				setLoading(false);
			} catch (error) {
				console.error("Failed to fetch album data:", error);
			}
		};

		fetchData();
	}, [searchParams, user.id]);

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
											<ArtistLink name={artist.name} />
											{idx < albumInfo.artists.length - 1 && ", "}
										</>
									))}
								</Text>
							</Group>
						</Stack>
					</Group>
				)}
				{albumStreams !== null && (
					<JSONTable
						data={albumStreams}
						keys={[
							"ts",
							"master_metadata_track_name",
							"master_metadata_album_artist_name",
						]}
					/>
				)}
			</Stack>
		</Container>
	);
}
