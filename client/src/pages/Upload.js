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

	const uploadFile = async (fileNum) => {
		const file = files[fileNum];
		const chunkSize = 4 * 1024 * 1024;
		const fileSize = file.size;
		const totalChunks = Math.ceil(fileSize / chunkSize);

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
		}
	};

	const onFileSubmit = async (e) => {
		e.preventDefault();
		const numFiles = files.length;

		if (numFiles === 0) {
			alert("No files selected");
			return;
		}

		for (let i = 0; i < numFiles; i++) {
			await uploadFile(i);
		}
	};

	return (
		<div>
			<div>Upload</div>
			<form>
				<input type="file" multiple accept=".json" onChange={onFileChange} />
				<button onClick={onFileSubmit}>Upload!</button>
				{progress && <div>{progress * 100}%</div>}
			</form>
		</div>
	);
}
