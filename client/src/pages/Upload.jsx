import { Box, Button, Progress, Stack, Text, Title } from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import { useContext, useState } from "react";
import { UserContext } from "../UserContext";
import { users } from "../api";

const Upload = () => {
	const { user } = useContext(UserContext);
	const [files, setFiles] = useState([]);
	const [progress, setProgress] = useState(-1);
	const [currFile, setCurrFile] = useState(null);

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

			if (!window.confirm(confirmMsg)) {
				return;
			}
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
		setProgress(100);

		user.lastUpload = newUploadTime;
	};

	return (
		<Stack>
			<Title>Upload</Title>
			{progress < 0 ? (
				<Stack>
					<Box>
						<Dropzone
							onDrop={setFiles}
							onReject={(files) => console.error("rejected files", files)}
							maxSize={13 * 1024 * 1024}
							accept={["application/json"]}
						>
							{files.length > 0 ? (
								<Stack>
									<Title>
										{files.length} file{files.length > 1 ? "s" : ""} selected
									</Title>
									<Text>
										{[...files].map(
											(file, i) => (i !== 0 ? ", " : "") + file.name
										)}
									</Text>
								</Stack>
							) : (
								<Stack>
									<Title>Drop JSON files here</Title>
									<Text>or click to upload</Text>
								</Stack>
							)}
						</Dropzone>
					</Box>
					<Button onPointerDown={onFileSubmit}>upload</Button>
				</Stack>
			) : (
				<Stack>
					<Text>
						{progress === 100
							? "finished upload"
							: progress === 99
							? "wiping old data"
							: progress >= 0
							? `uploading ${currFile.name}`
							: ""}
					</Text>
					{progress >= 0 && <Progress value={progress} />}
				</Stack>
			)}
		</Stack>
	);
};

export default Upload;
