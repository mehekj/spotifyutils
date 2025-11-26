import {
	Alert,
	Button,
	Container,
	LoadingOverlay,
	Progress,
	Stack,
	Text,
	Title,
	Tooltip,
} from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import { useContext, useState } from "react";
import { FaExclamationCircle, FaRegCheckCircle } from "react-icons/fa";
import { UserContext } from "../UserContext";
import { users } from "../api";
import useConfirm from "../components/ConfirmDialog";

const Upload = () => {
	const { user, updateUser } = useContext(UserContext);
	const [files, setFiles] = useState([]);
	const [progress, setProgress] = useState(-1);
	const [currFile, setCurrFile] = useState(null);
	const [completedTime, setCompletedTime] = useState(-1);
	const { confirm, ConfirmModal } = useConfirm();

	const inProgress = () => {
		return progress >= 0 && progress < 100;
	};

	const uploadFile = async (fileNum, uploadTime) => {
		const file = files[fileNum];
		const chunkSize = 4 * 1024 * 1024;
		const fileSize = file.size;
		const totalChunks = Math.ceil(fileSize / chunkSize);

		setCurrFile(file);

		let chunkNum = 0;
		let start = 0;
		while (start < fileSize) {
			console.log(
				`Uploading chunk ${chunkNum + 1}/${totalChunks} of file ${
					fileNum + 1
				}/${files.length}`
			);

			const end = start + chunkSize;
			const chunk = file.slice(start, end);

			const formData = new FormData();
			formData.append("chunk", chunk);
			formData.append("chunkNum", chunkNum);
			formData.append("totalChunks", totalChunks);
			formData.append("fileNum", fileNum);
			formData.append("uploadTime", uploadTime);

			await users.uploadFileChunk(formData);

			chunkNum++;
			start = end;

			const fileProgress = fileNum / files.length;
			const fileChunkProgress = chunkNum / totalChunks / files.length;

			setProgress(
				Math.min(Math.floor((fileProgress + fileChunkProgress) * 100), 99)
			);
		}
	};

	const onFileSubmit = async (e) => {
		e.preventDefault();

		const numFiles = files.length;
		if (numFiles === 0) {
			alert("No files selected");
			return;
		}

		if (user.lastUpload) {
			const confirmMsg =
				"Are you sure you would like to proceed? This will delete your previously uploaded data from " +
				new Date(user.lastUpload).toLocaleString();

			const result = await confirm(confirmMsg);
			if (!result) return;
		}

		const newUploadTime = Date.now();

		setProgress(0);
		for (let i = 0; i < numFiles; i++) {
			await uploadFile(i, newUploadTime);
		}

		await Promise.all([
			users.setLastUpload(newUploadTime),
			users.deleteOldUpload(newUploadTime),
		]);

		updateUser({ lastUpload: newUploadTime });

		setFiles([]);
		setCompletedTime(Date.now());
		setProgress(100);
	};

	return (
		<Container size="xl">
			<Stack gap="lg">
				<Title>Upload</Title>
				<Stack justify="center">
					<Dropzone
						onDrop={setFiles}
						onReject={(files) => console.error("rejected files", files)}
						maxSize={13 * 1024 * 1024}
						accept={["application/json"]}
					>
						<LoadingOverlay
							visible={inProgress()}
							zIndex={100}
							overlayProps={{ blur: 2 }}
						/>
						{files.length > 0 ? (
							<Stack align="center">
								<Title order={2}>
									{files.length} file{files.length > 1 ? "s" : ""} selected
								</Title>
								<Text ta="center">
									{[...files].map(
										(file, i) => (i !== 0 ? ", " : "") + file.name
									)}
								</Text>
							</Stack>
						) : (
							<Stack align="center">
								<Title order={2}>Drop JSON files here</Title>
								<Text>or click to upload</Text>
							</Stack>
						)}
					</Dropzone>
					<Tooltip
						arrowPosition="bottom"
						label="select files to upload"
						disabled={files.length > 0}
					>
						<Button
							onPointerDown={onFileSubmit}
							disabled={files.length === 0}
							loading={inProgress()}
						>
							upload
						</Button>
					</Tooltip>
				</Stack>
				{inProgress() && (
					<Stack>
						<Alert
							color="red"
							variant="light"
							title="DO NOT REFRESH THE PAGE"
							icon={<FaExclamationCircle />}
						>
							your upload will not complete
						</Alert>
						<Progress value={progress} />
						<Text ta="center">
							{progress === 100
								? "finished upload"
								: progress === 99
								? "wiping old data"
								: progress >= 0
								? `uploading ${currFile.name}`
								: ""}
						</Text>
					</Stack>
				)}
				{progress === 100 && (
					<Alert
						variant="light"
						title="Upload completed!"
						icon={<FaRegCheckCircle />}
						withCloseButton={true}
						onClose={() => setProgress(-1)}
					>
						{new Date(completedTime).toLocaleString()}
					</Alert>
				)}
			</Stack>
			{ConfirmModal}
		</Container>
	);
};

export default Upload;
