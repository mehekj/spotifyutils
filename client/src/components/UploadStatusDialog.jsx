import { Alert, Progress, Stack, Text } from "@mantine/core";
import { FaExclamationCircle, FaRegCheckCircle } from "react-icons/fa";

export default function UploadStatusDialog({
	progress,
	currFile,
	completedTime,
	onClose,
}) {
	const inProgress = () => {
		return progress >= 0 && progress < 100;
	};

	if (progress < 0 && completedTime < 0) {
		return null;
	}

	return (
		<div
			style={{
				position: "fixed",
				bottom: "2rem",
				right: "2rem",
				zIndex: 1000,
				maxWidth: "400px",
			}}
		>
			{inProgress() ? (
				<Stack
					bg="dark.8"
					p="md"
					bdrs="sm"
					style={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)" }}
				>
					<Alert
						color="red"
						variant="light"
						title="DO NOT REFRESH THE PAGE"
						icon={<FaExclamationCircle />}
					>
						your upload will not complete
					</Alert>
					<Text ta="center">
						{progress === 100
							? "finished upload"
							: progress === 99
								? "wiping old data"
								: progress >= 0
									? `uploading ${currFile?.name}`
									: ""}
					</Text>
					<Progress value={progress} />
				</Stack>
			) : completedTime > 0 ? (
				<Alert
					variant="light"
					title="Upload completed!"
					icon={<FaRegCheckCircle />}
					withCloseButton={true}
					onClose={onClose}
					style={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)" }}
				>
					{new Date(completedTime).toLocaleString()}
				</Alert>
			) : null}
		</div>
	);
}
