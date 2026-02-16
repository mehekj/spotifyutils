import {
	Button,
	Container,
	Group,
	Image,
	Stack,
	Text,
	Title,
} from "@mantine/core";
import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { artists } from "../api";
import JSONTable from "../components/JSONTable";
import LoadingPage from "../components/LoadingPage";
import { UserContext } from "../UserContext";

export default function TrackEvent() {
	const { user } = useContext(UserContext);
	const [searchParams] = useSearchParams();
	const [artistStreams, setArtistStreams] = useState(null);
	const [following, setFollowing] = useState(false);
	const [artistInfo, setArtistInfo] = useState(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const fetchData = async () => {
			const name = searchParams.get("name");
			if (!user.id || !name) return;

			try {
				setLoading(true);
				const infoRes = await artists.getArtistInfo(name);
				setArtistInfo(infoRes);
				if (infoRes && infoRes.uri) {
					const [streamsRes, followingRes] = await Promise.all([
						artists.getStreams(name),
						artists.following(infoRes.uri),
					]);
					setArtistStreams(streamsRes);
					setFollowing(followingRes);
				}
				setLoading(false);
			} catch (error) {
				console.error("Failed to fetch artist data:", error);
			}
		};

		fetchData();
	}, [searchParams, user.id]);

	if (loading) return <LoadingPage />;

	return (
		<Container size="xl">
			<Stack gap="xl">
				{artistInfo !== null && (
					<Group align="end" my="xl" grow preventGrowOverflow={false}>
						<Image
							src={artistInfo.images[1].url}
							maw={artistInfo.images[1].width}
							mr="xl"
						/>
						<Stack>
							<Group>
								<Title mr="sm" size={48}>
									{artistInfo.name}
								</Title>
								<Button
									variant="outline"
									onPointerDown={async (e) => {
										e.stopPropagation();
										await artists.toggleFollowing(artistInfo.uri, following);
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
					<JSONTable
						data={artistStreams}
						keys={[
							"ts",
							"master_metadata_track_name",
							"master_metadata_album_album_name",
						]}
					/>
				)}
			</Stack>
		</Container>
	);
}
