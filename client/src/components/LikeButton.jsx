import { ActionIcon } from "@mantine/core";
import { useState } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { tracks } from "../api";

export default function LikeButton({ id, like, size }) {
	const [liked, setLiked] = useState(like);

	return (
		<ActionIcon
			onPointerDown={async (e) => {
				e.stopPropagation();
				await tracks.toggleLike(id, liked);
				setLiked(!liked);
			}}
			c="white"
			variant="transparent"
			classNames={{ root: "hover-green" }}
		>
			{liked ? <FaHeart size={size} /> : <FaRegHeart size={size} />}
		</ActionIcon>
	);
}
