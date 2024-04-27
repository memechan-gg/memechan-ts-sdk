import { CoinAPI } from "@avernikoz/memechan-ts-sdk";
import { useState } from "react";
import { BE_URL } from "../constants";

const api = new CoinAPI(BE_URL);

export const FileUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files ? event.target.files[0] : null;
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (file) {
      console.log("Uploading file:", file.name);
      await api.uploadFile(file);
      console.log("File uploaded");
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!file}>
        Upload File
      </button>
      {file && <p>File ready to upload: {file.name}</p>}
    </div>
  );
};
