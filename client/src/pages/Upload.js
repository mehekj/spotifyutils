import axios from "axios";
import { useContext, useState } from "react";
import { UserContext } from "../App";
import { config } from "../constants.js";

export default function Upload() {
	const { user } = useContext(UserContext);
	const [files, setFiles] = useState([]);
	const [progress, setProgress] = useState(null);

	const onFileChange = (e) => {
		setFiles(e.target.files);
	};

	const onFileUpload = async (e) => {
		e.preventDefault();
		const chunkSize = 5 * 1024 * 1024;
		let chunks = [];
		const numFiles = files.length;
		let chunksPerFile = [];

		for (let i = 0; i < numFiles; i++) {
			const file = files[i];
			let fileSize = file.size;
			let start = 0;
			let end = chunkSize;
			let numChunks = 0;

			while (start < fileSize) {
				chunks.push(file.slice(start, end));
				start = end;
				end = start + chunkSize;
				numChunks++;
			}

			chunksPerFile.push(numChunks);
		}

		await axios
			.post(`${config.server}/beginUpload`, {
				totalChunks: chunks.length,
				chunksPerFile: chunksPerFile,
				userID: user.id,
			})
			.then((res) => console.log(res))
			.catch((err) => console.error(err));

		let promises = [];
		let finished = 0;
		setProgress(0);

		chunks.forEach((chunk, index) => {
			let formData = new FormData();
			let fileName = `${index}chunk`;
			let fileData = new File([chunk], fileName);
			formData.append("chunk", fileData, fileName);
			formData.append("userID", user.id);

			promises.push(
				axios
					.post(`${config.server}/upload`, formData, {
						headers: { "Content-Type": "multipart/form-data" },
					})
					.then((res) => {
						finished++;
						setProgress(finished / chunks.length);
						console.log(res);
					})
			);
		});

		Promise.all(promises).catch((err) => {
			console.error(err);
		});
	};

	return (
		<div>
			<div>Upload</div>
			<form>
				<input type="file" multiple accept=".json" onChange={onFileChange} />
				<button onClick={onFileUpload}>Upload!</button>
				{progress && <div>{progress * 100}%</div>}
			</form>
		</div>
	);
}
