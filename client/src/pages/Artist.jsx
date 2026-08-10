import { Button, Container, Group, Image, Stack, Text, Title } from "@mantine/core";
import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router";
import { artists } from "../api";
import JSONTable from "../components/JSONTable";
import LoadingPage from "../components/LoadingPage";
import { UserContext } from "../UserContext";

export default function ArtistPage() {
	const { user } = useContext(UserContext);
	const { uri } = useParams();
	const [artistStreams, setArtistStreams] = useState(null);
	const [following, setFollowing] = useState(false);
	const [artistInfo, setArtistInfo] = useState(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const fetchData = async () => {
			if (!user.id || !uri) return;

			try {
				setLoading(true);
				const infoRes = await artists.getArtistInfo(uri);
				const [streamsRes, followingRes] = await Promise.all([
					artists.getStreams(uri),
					// artists.following(uri),
				]);
				setArtistStreams(streamsRes);
				// setFollowing(followingRes);
				setArtistInfo(infoRes);
				setLoading(false);
			} catch (error) {
				console.error("Failed to fetch artist data:", error);
			}
		};

		fetchData();
	}, [uri, user.id]);

	if (loading) return <LoadingPage />;

	return (
		<Container size="xl">
			<Stack gap="xl">
				{artistInfo !== null && (
					<Group align="end" my="xl" grow preventGrowOverflow={false}>
						{artistInfo.images.length > 0 && (
							<Image src={artistInfo.images[1].url} maw={artistInfo.images[1].width} mr="xl" />
						)}
						<Stack>
							<Group>
								<Title mr="sm" size={48}>
									{artistInfo.name}
								</Title>
								<Button
									variant="outline"
									onPointerDown={async (e) => {
										e.stopPropagation();
										await artists.toggleFollowing(artistInfo._id, following);
										setFollowing(!following);
									}}
								>
									{following ? "unfollow" : "follow"}
								</Button>
							</Group>
						</Stack>
					</Group>
				)}
				{artistStreams !== null && (
					<JSONTable data={artistStreams} keys={["ts", "track", "album"]} />
				)}
			</Stack>
		</Container>
	);
}
