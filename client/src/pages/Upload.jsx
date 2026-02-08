import {
	Alert,
	Button,
	Container,
	Dialog,
	Group,
	LoadingOverlay,
	Progress,
	Stack,
	Text,
	Title,
	Tooltip,
} from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import { useContext, useState } from "react";
import {
	FaCheckCircle,
	FaExclamationCircle,
	FaRegCheckCircle,
	FaTimes,
} from "react-icons/fa";
import { UserContext } from "../UserContext";
import { users } from "../api";
import useConfirm from "../components/ConfirmDialog";
import { validateFiles } from "../utils/validation";

const Upload = () => {
	const { user, updateUser } = useContext(UserContext);
	const [files, setFiles] = useState([]);
	const [validationResults, setValidationResults] = useState([]);
	const [progress, setProgress] = useState(-1);
	const [currFile, setCurrFile] = useState(null);
	const [completedTime, setCompletedTime] = useState(-1);
	const [validationError, setValidationError] = useState(null);
	const { confirm, ConfirmModal } = useConfirm();

	const inProgress = () => {
		return progress >= 0 && progress < 100;
	};

	const removeFile = (indexToRemove) => {
		setFiles(files.filter((_, idx) => idx !== indexToRemove));
		setValidationResults(
			validationResults.filter((_, idx) => idx !== indexToRemove),
		);
		if (validationResults[indexToRemove]?.valid === false) {
			const remainingErrors = validationResults
				.filter(
					(_, idx) => idx !== indexToRemove && !validationResults[idx].valid,
				)
				.map((r) => `${r.fileName}: ${r.error}`)
				.join(", ");
			setValidationError(remainingErrors || null);
		}
	};

	const onDropAccepted = async (acceptedFiles) => {
		setValidationError(null);
		setValidationResults([]);

		const results = await validateFiles(acceptedFiles);
		setValidationResults(results);

		setFiles(acceptedFiles);
	};

	const onDropRejected = (rejectedFiles) => {
		const rejectionReasons = rejectedFiles
			.map(
				(file) =>
					`${file.file.name}: ${file.errors.map((e) => e.code).join(", ")}`,
			)
			.join("; ");
		setValidationError(`Files rejected: ${rejectionReasons}`);
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
				}/${files.length}`,
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
				Math.min(Math.floor((fileProgress + fileChunkProgress) * 100), 99),
			);
		}
	};

	const onFileSubmit = async (e) => {
		e.preventDefault();

		if (files.length === 0 || inProgress()) {
			return;
		}

		const results = await validateFiles(files);
		const allValid = results.every((result) => result.valid);

		if (!allValid) {
			const failedFiles = results
				.filter((r) => !r.valid)
				.map(
					(r) =>
						`${r.fileName}: ${r.error}${r.details ? ` - ${r.details}` : ""}`,
				)
				.join("; ");
			setValidationError(failedFiles);
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
		for (let i = 0; i < files.length; i++) {
			await uploadFile(i, newUploadTime);
		}

		await Promise.all([
			users.setLastUpload(newUploadTime),
			users.deleteOldUpload(newUploadTime),
		]);

		updateUser({ lastUpload: newUploadTime });

		setFiles([]);
		setValidationResults([]);
		setValidationError(null);
		setCompletedTime(Date.now());
		setProgress(100);
	};

	return (
		<Container size="xl" bg="dark.8">
			<Stack gap="lg">
				<Title>Upload</Title>

				{validationError && (
					<Alert
						color="red"
						variant="light"
						title="Validation Error"
						icon={<FaExclamationCircle />}
						withCloseButton={true}
						onClose={() => setValidationError(null)}
					>
						{validationError}
					</Alert>
				)}

				<Stack justify="center">
					<Dropzone
						onDrop={onDropAccepted}
						onReject={onDropRejected}
						maxSize={13 * 1024 * 1024}
						accept={["application/json"]}
						disabled={inProgress()}
					>
						<LoadingOverlay
							visible={inProgress()}
							zIndex={100}
							overlayProps={{ blur: 1 }}
						/>
						{files.length > 0 ? (
							<Stack align="center">
								<Title order={2}>
									{files.length} file{files.length > 1 ? "s" : ""} selected
								</Title>
								{validationResults.length > 0 && (
									<Stack gap="xs" w="100%" mt="md">
										{validationResults.map((result, idx) => (
											<Stack gap="xs" key={idx}>
												<Group
													bg={result.valid ? "spotify" : "red"}
													p="xs"
													bdrs="sm"
												>
													{result.valid ? (
														<FaCheckCircle size={16} />
													) : (
														<FaExclamationCircle size={16} />
													)}
													<Stack gap={0} flex={1}>
														<Text size="sm" fw={500}>
															{result.fileName}
														</Text>
														{result.valid ? (
															<Group gap="xs">
																<Text size="xs">
																	{result.summary.totalRecords} track records
																</Text>
																{result.filteredCount > 0 && (
																	<Text size="xs" c="dimmed">
																		({result.filteredCount} filtered)
																	</Text>
																)}
															</Group>
														) : (
															<Text size="xs" c="red">
																{result.error}
																{result.details && ` - ${result.details}`}
															</Text>
														)}
													</Stack>
													<div style={{ pointerEvents: "auto" }}>
														<Button
															size="xs"
															variant="transparent"
															color="gray"
															onClick={(e) => {
																e.stopPropagation();
																removeFile(idx);
															}}
														>
															<FaTimes size={14} />
														</Button>
													</div>
												</Group>
											</Stack>
										))}
									</Stack>
								)}
							</Stack>
						) : (
							<Stack align="center">
								<Title order={2}>Click to upload</Title>
								<Text>or drop JSON files here</Text>
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
				<Dialog opened={progress >= 0 && progress <= 100} justify="flex-end">
					{inProgress() ? (
						<Stack bg="dark.8" p="md" bdrs="sm">
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
											? `uploading ${currFile.name}`
											: ""}
							</Text>
							<Progress value={progress} />
						</Stack>
					) : (
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
				</Dialog>
			</Stack>
			{ConfirmModal}
		</Container>
	);
};

export default Upload;
