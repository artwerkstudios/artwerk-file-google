import { AbstractFileService } from "@medusajs/medusa";
import {
  DeleteFileType,
  FileServiceGetUploadStreamResult,
  FileServiceUploadResult,
  GetUploadedFileType,
  UploadStreamDescriptorType,
} from "@medusajs/types";
import { Bucket, Storage, UploadResponse } from "@google-cloud/storage";

/**
 * A class representing a Google Cloud Storage service.
 * @extends AbstractFileService
 */
class GoogleCloudStorageService extends AbstractFileService {
  private _keyFileName: string;
  private _storage: Storage;
  private _publicBucket: Bucket;
  private _privateBucket: Bucket;

  /**
   * Creates an instance of GoogleCloudStorageService.
   * @param {any} container - The container.
   * @param {any} pluginOptions - The plugin options.
   * @memberof GoogleCloudStorageService
   */
  constructor(container, pluginOptions) {
    super(container);
    this._keyFileName = pluginOptions.keyFileName;

    this._storage = new Storage({
      keyFilename: this._keyFileName,
    });
    this._publicBucket = this._storage.bucket(pluginOptions.publicBucket);
    this._privateBucket = this._storage.bucket(pluginOptions.privateBucket);
  }

  /**
   * Uploads a file to the public bucket.
   * @param {Express.Multer.File} fileData - The file data.
   * @returns {Promise<FileServiceUploadResult>} A promise that resolves with the upload result.
   * @memberof GoogleCloudStorageService
   */
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

  /**
   * Uploads a file to the private bucket.
   * @param {Express.Multer.File} fileData - The file data.
   * @returns {Promise<FileServiceUploadResult>} A promise that resolves with the upload result.
   * @memberof GoogleCloudStorageService
   */
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

  /**
   * Deletes a file from the public bucket.
   * @param {DeleteFileType} fileData - The file data.
   * @returns {Promise<void>} A promise that resolves when the file is deleted.
   * @memberof GoogleCloudStorageService
   */
  async delete(fileData: DeleteFileType): Promise<void> {
    try {
      const file = this._publicBucket.file(fileData.fileKey);
      await file.delete();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Gets the upload stream descriptor.
   * @param {UploadStreamDescriptorType} param0 - { name, ext, isPrivate = true } - The upload stream descriptor parameters.
   * @returns {Promise<FileServiceGetUploadStreamResult>} A promise that resolves with the upload stream descriptor result.
   * @memberof GoogleCloudStorageService
   */
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

  /**
   * Gets the download stream.
   * @param {GetUploadedFileType} param0 - The get uploaded file type parameters.
   * @returns {Promise<NodeJS.ReadableStream>} A promise that resolves with the download stream.
   * @memberof GoogleCloudStorageService
   */
  async getDownloadStream({
    fileKey,
    isPrivate = true,
  }: GetUploadedFileType): Promise<NodeJS.ReadableStream> {
    try {
      const bucket = isPrivate ? this._privateBucket : this._publicBucket;
      const file = bucket.file(`${fileKey}`);

      // ToDo check requirement of node stream package
      // const passthroughStream = new stream.PassThrough()

      const stream = file.createReadStream();

      return stream;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Gets the presigned download URL.
   * @param {GetUploadedFileType} param0 - The get uploaded file type parameters.
   * @returns {Promise<string>} A promise that resolves with the presigned download URL.
   * @memberof GoogleCloudStorageService
   */
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
