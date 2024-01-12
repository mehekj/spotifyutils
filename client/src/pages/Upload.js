import {
	Box,
	Button,
	Heading,
	Input,
	Progress,
	Stack,
	Text,
	VStack,
	Container,
} from "@chakra-ui/react";
import axios from "axios";
import { useContext, useState } from "react";
import { UserContext } from "../App";
import { config } from "../constants.js";

export default function Upload() {
	const { user } = useContext(UserContext);
	const [files, setFiles] = useState([]);
	const [progress, setProgress] = useState(undefined);
	const [currFile, setCurrFile] = useState(undefined);

	const onFileChange = (e) => {
		setFiles(e.target.files);
	};

	const uploadFile = async (fileNum) => {
		const file = files[fileNum];
		const chunkSize = 4 * 1024 * 1024;
		const fileSize = file.size;
		const totalChunks = Math.ceil(fileSize / chunkSize);

		setCurrFile(file);

		let chunkNum = 0;
		let start = 0;
		while (start < fileSize) {
			const end = start + chunkSize;
			const chunk = file.slice(start, end);

			const formData = new FormData();
			formData.append("chunk", chunk);
			formData.append("chunkNum", chunkNum);
			formData.append("fileNum", fileNum);
			formData.append("userID", user.id);
			formData.append("totalChunks", totalChunks);

			const res = await axios({
				method: "post",
				url: `${config.server}/upload`,
				data: formData,
				headers: { "Content-Type": "multipart/form-data" },
			});
			console.log(res);

			chunkNum++;
			start = end;

			const fileProgress = fileNum / files.length;
			const fileChunkProgress = chunkNum / totalChunks / files.length;

			setProgress((fileProgress + fileChunkProgress) * 100);
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

		setProgress(null);
		let res = await axios.post(
			`${config.server}/deleteUserStreams?userID=${user.id}`
		);
		console.log(res);

		setProgress(0);
		for (let i = 0; i < numFiles; i++) {
			await uploadFile(i);
		}

		res = await axios.post(`${config.server}/setUserUpload?userID=${user.id}`);
		console.log(res);
	};

	return (
		<VStack align={"flex-start"} spacing={5}>
			<Heading size={"2xl"} mb={3}>
				Upload
			</Heading>
			{progress === undefined ? (
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
					<Progress
						isIndeterminate={progress === null}
						value={progress}
						colorScheme={"spot"}
						size={"lg"}
						w={"100%"}
					/>
					{(progress === null || progress < 100) && (
						<Text color={"red"} fontWeight={"bold"}>
							DO NOT REFRESH THE PAGE
						</Text>
					)}
				</VStack>
			)}
		</VStack>
	);
}
