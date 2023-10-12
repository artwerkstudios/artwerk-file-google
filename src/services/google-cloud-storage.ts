import { AbstractFileService } from "@medusajs/medusa";
import {
  DeleteFileType,
  FileServiceGetUploadStreamResult,
  FileServiceUploadResult,
  GetUploadedFileType,
  UploadStreamDescriptorType,
} from "@medusajs/types";
import {
  Bucket,
  Storage,
  UploadResponse,
  GetSignedUrlConfig,
  File,
} from "@google-cloud/storage";
import internal, { PassThrough } from "stream";

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
      const fileKey: string = `${name}.${ext}`;
      const file = bucket.file(fileKey);
      const passthroughStream = new PassThrough();
      const promise: Promise<FileServiceUploadResult> = new Promise(
        (resolve, reject) => {
          passthroughStream
            .pipe(
              file.createWriteStream({
                resumable: false,
                gzip: true,
              })
            )
            .on("finish", () => {
              resolve({
                url: file.publicUrl(),
                key: fileKey,
              });
            })
            .on("error", (error) => {
              reject(error);
            });
        }
      );

      return {
        writeStream: passthroughStream,
        promise,
        url: file.publicUrl(),
        fileKey,
      };
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Gets the download stream.
   * @param {GetUploadedFileType} param0 - { fileKey, isPrivate = true } - The get uploaded file type parameters.
   * @returns {Promise<NodeJS.ReadableStream>} A promise that resolves with the download stream.
   * @memberof GoogleCloudStorageService
   */
  async getDownloadStream({
    fileKey,
    isPrivate = true,
  }: GetUploadedFileType): Promise<NodeJS.ReadableStream> {
    try {
      const bucket: Bucket = isPrivate
        ? this._privateBucket
        : this._publicBucket;
      const file: File = bucket.file(`${fileKey}`);
      const stream: internal.Readable = file.createReadStream();

      return stream;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Gets the presigned download URL.
   * @param {GetUploadedFileType} param0 - { fileKey, isPrivate = true } - The get uploaded file type parameters.
   * @returns {Promise<string>} A promise that resolves with the presigned download URL.
   * @memberof GoogleCloudStorageService
   */
  async getPresignedDownloadUrl({
    fileKey,
    isPrivate = true,
  }: GetUploadedFileType): Promise<string> {
    try {
      const bucket: Bucket = isPrivate
        ? this._privateBucket
        : this._publicBucket;
      const file: File = bucket.file(`${fileKey}`);
      const options: GetSignedUrlConfig = {
        version: "v4",
        action: "read",
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
      };
      return (await file.getSignedUrl(options)).toString();
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

export default GoogleCloudStorageService;
