import { AbstractFileService } from "@medusajs/medusa";
import {
  DeleteFileType,
  FileServiceGetUploadStreamResult,
  FileServiceUploadResult,
  GetUploadedFileType,
  UploadStreamDescriptorType,
} from "@medusajs/types";
import { Bucket, Storage, UploadResponse } from "@google-cloud/storage";

class GoogleCloudStorageService extends AbstractFileService {
  private _publicBucket: string;
  private _privateBucket: string;
  private _keyFileName: string;
  private _storage: Storage;
  private _bucket: Bucket;

  constructor(container, pluginOptions) {
    super(container);
    this._publicBucket = pluginOptions.publicBucket;
    this._privateBucket = pluginOptions.privateBucket;
    this._keyFileName = pluginOptions.keyFileName;

    this._storage = new Storage({
      keyFilename: this._keyFileName,
    });
    this._bucket = this._storage.bucket(this._publicBucket);
  }

  public async upload(
    fileData: Express.Multer.File
  ): Promise<FileServiceUploadResult> {
    console.debug("fileData for upload", fileData);

    const uploadResponse: UploadResponse = await this._bucket.upload(
      fileData.path,
      {
        // gzip: true,
        destination: fileData.originalname,
      }
    );

    console.debug("uploadResponse", uploadResponse);

    return {
      url: uploadResponse[0].publicUrl(),
      key: uploadResponse[0].name,
    };
  }

  async uploadProtected(
    fileData: Express.Multer.File
  ): Promise<FileServiceUploadResult> {
    return await this.upload(fileData);
  }

  async delete(fileData: DeleteFileType): Promise<void> {
    const file = this._bucket.file(fileData.fileKey);
    await file.delete();
  }

  async getUploadStreamDescriptor(
    fileData: UploadStreamDescriptorType
  ): Promise<FileServiceGetUploadStreamResult> {
    throw new Error("Method not implemented.");
  }

  async getDownloadStream(
    fileData: GetUploadedFileType
  ): Promise<NodeJS.ReadableStream> {
    throw new Error("Method not implemented.");
  }

  async getPresignedDownloadUrl(
    fileData: GetUploadedFileType
  ): Promise<string> {
    throw new Error("Method not implemented.");
  }
}

export default GoogleCloudStorageService;
