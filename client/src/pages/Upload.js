import {
	Box,
	Button,
	Heading,
	Input,
	Progress,
	Stack,
	Text,
	VStack,
} from "@chakra-ui/react";
import { useContext, useState } from "react";
import { UserContext } from "../App";
import { users } from "../api";

const Upload = () => {
	const user = useContext(UserContext);
	const [files, setFiles] = useState([]);
	const [progress, setProgress] = useState(null);
	const [currFile, setCurrFile] = useState(null);

	const onFileChange = (e) => {
		setFiles(e.target.files);
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
	};

	return (
		<VStack align={"flex-start"} spacing={5}>
			<Heading size={"2xl"} mb={3}>
				Upload
			</Heading>
			{progress === null ? (
				<VStack align={"flex-start"} spacing={5} w={"100%"}>
					<Box
						borderColor={"whiteAlpha.500"}
						borderStyle={"dashed"}
						borderWidth={3}
						_hover={{ bg: "whiteAlpha.500", borderColor: "transparent" }}
						rounded={"md"}
						transition={"all 150ms ease-in-out"}
						w={"100%"}
					>
						<Box position={"relative"} h={"100%"} w={"100%"}>
							{files.length > 0 ? (
								<Stack p={8} textAlign={"center"}>
									<Heading fontSize={"lg"}>
										{files.length} file{files.length > 1 ? "s" : ""} selected
									</Heading>
									<Text fontWeight={"light"}>
										{[...files].map(
											(file, i) => (i !== 0 ? ", " : "") + file.name
										)}
									</Text>
								</Stack>
							) : (
								<Stack p={8} textAlign={"center"}>
									<Heading fontSize={"lg"}>Drop JSON files here</Heading>
									<Text fontWeight={"light"}>or click to upload</Text>
								</Stack>
							)}
							<Input
								type={"file"}
								height={"100%"}
								width={"100%"}
								position={"absolute"}
								top={0}
								left={0}
								opacity={0}
								aria-hidden={"true"}
								accept={".json"}
								multiple={true}
								onChange={onFileChange}
								cursor={"pointer"}
							/>
						</Box>
					</Box>
					<Button onPointerDown={onFileSubmit}>upload</Button>
				</VStack>
			) : (
				<VStack spacing={5} w={"100%"}>
					<Text>
						{progress === null
							? "deleting old data"
							: progress < 100
							? `uploading ${currFile.name}`
							: "finished upload"}
					</Text>
					{progress < 100 && (
						<Text color={"red"} fontWeight={"bold"}>
							DO NOT REFRESH THE PAGE {progress}
						</Text>
					)}
				</VStack>
			)}
		</VStack>
	);
};

export default Upload;
