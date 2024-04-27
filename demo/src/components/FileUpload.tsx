import { CoinAPI } from "@avernikoz/memechan-ts-sdk";
import { useState } from "react";
import { BE_URL } from "../constants";

const api = new CoinAPI(BE_URL);

export const FileUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadedFileCid, setUploadedFileCid] = useState<string | null>(
    "QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH",
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files ? event.target.files[0] : null;
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (file) {
      console.log("Uploading file:", file.name);
      const response = await api.uploadFile(file);
      const { IpfsHash } = await response.json();
      console.log("File uploaded", IpfsHash);
      setUploadedFileCid(IpfsHash);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!file}>
        Upload File
      </button>
      {uploadedFileCid && (
        <img
          src={`https://lavender-gentle-primate-223.mypinata.cloud/ipfs/${uploadedFileCid}?pinataGatewayToken=M45Jh03NicrVqTZJJhQIwDtl7G6fGS90bjJiIQrmyaQXC_xXj4BgRqjjBNyGV7q2`}
        />
      )}
      {file && <p>File ready to upload: {file.name}</p>}
    </div>
  );
};
