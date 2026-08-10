import { Container, Group, Image, Stack, Text, Title } from "@mantine/core";
import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router";
import { tracks } from "../api";
import ArtistLink from "../components/ArtistLink";
import JSONTable from "../components/JSONTable";
import LikeButton from "../components/LikeButton";
import LoadingPage from "../components/LoadingPage";
import { UserContext } from "../UserContext";

export default function TrackPage() {
	const { user } = useContext(UserContext);
	const { uri } = useParams();
	const [trackStreams, setTrackStreams] = useState(null);
	const [liked, setLiked] = useState(false);
	const [trackInfo, setTrackInfo] = useState(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const fetchData = async () => {
			if (!user.id || !uri) return;

			try {
				setLoading(true);
				const [streamsRes, likedRes, infoRes] = await Promise.all([
					tracks.getStreams(uri),
					// tracks.isLiked(uri),
					// tracks.getTrackInfo(uri),
				]);

				setTrackStreams(streamsRes);
				// setLiked(likedRes[0]);
				setTrackInfo(streamsRes[0]);
				setLoading(false);
			} catch (error) {
				console.error("Failed to fetch track data:", error);
			}
		};

		fetchData();
	}, [uri, user.id]);

	if (loading) return <LoadingPage />;

	const imageUrl = trackInfo?.image?.medium?.url || null;
	const imageWidth = trackInfo?.image?.medium?.width || null;

	const artists = trackInfo
		? trackInfo.artistNames.map((name, idx) => {
				return { name, uri: trackInfo.artistURIs[idx] };
			})
		: [];

	return (
		<Container size="xl">
			<Stack gap="xl">
				{trackInfo !== null && (
					<Group align="end" my="xl" grow preventGrowOverflow={false}>
						{imageUrl && <Image src={imageUrl} maw={imageWidth || undefined} mr="xl" />}
						<Stack>
							<Group>
								<Title mr="sm" size={48}>
									{trackInfo.name || "Unknown track"}
								</Title>
								<LikeButton uri={uri} like={liked} size={64} />
							</Group>
							<Group align="baseline">
								<Text fz={20} ta="center">
									{artists.map((artist, idx) => (
										<span key={artist.uri || artist.name || idx}>
											<ArtistLink uri={artist.uri} name={artist.name} />
											{idx < artists.length - 1 && ", "}
										</span>
									))}
								</Text>
							</Group>
						</Stack>
					</Group>
				)}
				{trackStreams !== null && (
					<JSONTable
						data={trackStreams}
						keys={[
							"ts",
							"platform",
							"msPlayed",
							"connCountry",
							"shuffle",
							"skipped",
							"offline",
							"incognitoMode",
						]}
					/>
				)}
			</Stack>
		</Container>
	);
}
