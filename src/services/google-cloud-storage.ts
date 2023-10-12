import { AbstractFileService } from "@medusajs/medusa";
import {
  DeleteFileType,
  FileServiceGetUploadStreamResult,
  FileServiceUploadResult,
  GetUploadedFileType,
  UploadStreamDescriptorType,
} from "@medusajs/types";
import { Bucket, Storage, UploadResponse } from "@google-cloud/storage";
import stream, { Stream } from "stream";

class GoogleCloudStorageService extends AbstractFileService {
  private _keyFileName: string;
  private _storage: Storage;
  private _publicBucket: Bucket;
  private _privateBucket: Bucket;

  constructor(container, pluginOptions) {
    super(container);
    this._keyFileName = pluginOptions.keyFileName;

    this._storage = new Storage({
      keyFilename: this._keyFileName,
    });
    this._publicBucket = this._storage.bucket(pluginOptions.publicBucket);
    this._privateBucket = this._storage.bucket(pluginOptions.privateBucket);
  }

  public async upload(
    fileData: Express.Multer.File
  ): Promise<FileServiceUploadResult> {
    try {
      const uploadResponse: UploadResponse = await this._publicBucket.upload(
        fileData.path,
        {
          // gzip: true,
          destination: fileData.originalname,
        }
      );

      return {
        url: uploadResponse[0].publicUrl(),
        key: uploadResponse[0].name,
      };
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async uploadProtected(
    fileData: Express.Multer.File
  ): Promise<FileServiceUploadResult> {
    try {
      const uploadResponse: UploadResponse = await this._privateBucket.upload(
        fileData.path,
        {
          // gzip: true,
          destination: fileData.originalname,
        }
      );

      return {
        url: uploadResponse[0].publicUrl(),
        key: uploadResponse[0].name,
      };
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async delete(fileData: DeleteFileType): Promise<void> {
    try {
      const file = this._publicBucket.file(fileData.fileKey);
      await file.delete();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async getUploadStreamDescriptor({
    name,
    ext,
    isPrivate = true,
  }: UploadStreamDescriptorType): Promise<FileServiceGetUploadStreamResult> {
    try {
      const bucket = isPrivate ? this._privateBucket : this._publicBucket;
      const file = bucket.file(`${name}.${ext}`);
      const stream = file.createWriteStream({
        resumable: false,
        gzip: true,
      });

      return {
        stream,
        promise: Promise.resolve(),
        url: file.publicUrl(),
        fileKey: `${name}.${ext}`,
      };
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async getDownloadStream({
    fileKey,
    isPrivate = true,
  }: GetUploadedFileType): Promise<NodeJS.ReadableStream> {
    try {
      const bucket = isPrivate ? this._privateBucket : this._publicBucket;
      const file = bucket.file(`${fileKey}`);
      const stream = file.createReadStream();

      return stream;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async getPresignedDownloadUrl({
    fileKey,
    isPrivate = true,
  }: GetUploadedFileType): Promise<string> {
    try {
      const bucket = isPrivate ? this._privateBucket : this._publicBucket;
      const file = bucket.file(`${fileKey}`);

      return (
        await file.getSignedUrl({
          action: "read",
          expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
        })
      ).toString();
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

export default GoogleCloudStorageService;
