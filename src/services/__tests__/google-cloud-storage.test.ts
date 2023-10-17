// ToDo: Fix tests

import GoogleCloudStorageService from "../google-cloud-storage";

describe("GoogleCloudStorageService", () => {
  const pluginOptions = {
    keyFileName: "key.json",
    publicBucket: "public-bucket",
    privateBucket: "private-bucket",
  };

  const fileData = {
    path: "/path/to/file",
    originalname: "file.txt",
  };

  const deleteFileType = {
    fileKey: "file.txt",
  };

  const uploadStreamDescriptorType = {
    name: "file",
    ext: "txt",
    isPrivate: true,
  };

  const getUploadedFileType = {
    fileKey: "file.txt",
    isPrivate: true,
  };

  const googleCloudStorageService = new GoogleCloudStorageService(
    {},
    pluginOptions
  );

  describe("upload", () => {
    it("should upload a file to the public bucket", async () => {
      const uploadResult = {
        url: "https://storage.googleapis.com/public-bucket/file.txt",
        key: "file.txt",
      };

      const uploadSpy = jest.spyOn(
        googleCloudStorageService["_publicBucket"],
        "upload"
      );

      uploadSpy.mockResolvedValueOnce([uploadResult]);

      const result = await googleCloudStorageService.upload(fileData);

      expect(uploadSpy).toHaveBeenCalledWith("/path/to/file", {
        destination: "file.txt",
      });

      expect(result).toEqual(uploadResult);

      uploadSpy.mockRestore();
    });

    it("should reject with an error if the upload fails", async () => {
      const error = new Error("Upload failed");

      const uploadSpy = jest.spyOn(
        googleCloudStorageService["_publicBucket"],
        "upload"
      );

      uploadSpy.mockRejectedValueOnce(error);

      await expect(googleCloudStorageService.upload(fileData)).rejects.toEqual(
        error
      );

      uploadSpy.mockRestore();
    });
  });

  describe("uploadProtected", () => {
    it("should upload a file to the private bucket", async () => {
      const uploadResult = {
        url: "https://storage.googleapis.com/private-bucket/file.txt",
        key: "file.txt",
      };

      const uploadSpy = jest.spyOn(
        googleCloudStorageService["_privateBucket"],
        "upload"
      );

      uploadSpy.mockResolvedValueOnce([uploadResult]);

      const result = await googleCloudStorageService.uploadProtected(fileData);

      expect(uploadSpy).toHaveBeenCalledWith("/path/to/file", {
        destination: "file.txt",
      });

      expect(result).toEqual(uploadResult);

      uploadSpy.mockRestore();
    });

    it("should reject with an error if the upload fails", async () => {
      const error = new Error("Upload failed");

      const uploadSpy = jest.spyOn(
        googleCloudStorageService["_privateBucket"],
        "upload"
      );

      uploadSpy.mockRejectedValueOnce(error);

      await expect(
        googleCloudStorageService.uploadProtected(fileData)
      ).rejects.toEqual(error);

      uploadSpy.mockRestore();
    });
  });

  describe("delete", () => {
    it("should delete a file from the public bucket", async () => {
      const file = {
        delete: jest.fn().mockResolvedValueOnce(undefined),
      };

      const fileSpy = jest.spyOn(
        googleCloudStorageService["_publicBucket"],
        "file"
      );

      fileSpy.mockReturnValueOnce(file);

      await googleCloudStorageService.delete(deleteFileType);

      expect(fileSpy).toHaveBeenCalledWith("file.txt");
      expect(file.delete).toHaveBeenCalled();

      fileSpy.mockRestore();
    });

    it("should reject with an error if the delete fails", async () => {
      const error = new Error("Delete failed");

      const file = {
        delete: jest.fn().mockRejectedValueOnce(error),
      };

      const fileSpy = jest.spyOn(
        googleCloudStorageService["_publicBucket"],
        "file"
      );

      fileSpy.mockReturnValueOnce(file);

      await expect(
        googleCloudStorageService.delete(deleteFileType)
      ).rejects.toEqual(error);

      fileSpy.mockRestore();
    });
  });

  describe("getUploadStreamDescriptor", () => {
    it("should get the upload stream descriptor for the private bucket", async () => {
      const file = {
        createWriteStream: jest.fn().mockReturnValueOnce({
          on: jest.fn().mockImplementation((event, callback) => {
            if (event === "finish") {
              callback();
            }
          }),
        }),
        publicUrl: jest
          .fn()
          .mockReturnValueOnce(
            "https://storage.googleapis.com/private-bucket/file.txt"
          ),
      };

      const bucket = {
        file: jest.fn().mockReturnValueOnce(file),
      };

      const bucketSpy = jest.spyOn(
        googleCloudStorageService,
        "_privateBucket",
        "get"
      );

      bucketSpy.mockReturnValueOnce(bucket);

      const result = await googleCloudStorageService.getUploadStreamDescriptor(
        uploadStreamDescriptorType
      );

      expect(bucketSpy).toHaveBeenCalled();
      expect(bucket.file).toHaveBeenCalledWith("file.txt.txt");
      expect(file.createWriteStream).toHaveBeenCalledWith({
        resumable: false,
        gzip: true,
      });
      expect(result).toEqual({
        writeStream: expect.any(Object),
        promise: expect.any(Promise),
        url: "https://storage.googleapis.com/private-bucket/file.txt",
        fileKey: "file.txt.txt",
      });

      bucketSpy.mockRestore();
    });

    it("should reject with an error if getting the upload stream descriptor fails", async () => {
      const error = new Error("Get upload stream descriptor failed");

      const bucket = {
        file: jest.fn().mockRejectedValueOnce(error),
      };

      const bucketSpy = jest.spyOn(
        googleCloudStorageService,
        "_privateBucket",
        "get"
      );

      bucketSpy.mockReturnValueOnce(bucket);

      await expect(
        googleCloudStorageService.getUploadStreamDescriptor(
          uploadStreamDescriptorType
        )
      ).rejects.toEqual(error);

      bucketSpy.mockRestore();
    });
  });

  describe("getDownloadStream", () => {
    it("should get the download stream for the private bucket", async () => {
      const file = {
        createReadStream: jest.fn().mockReturnValueOnce("stream"),
      };

      const bucket = {
        file: jest.fn().mockReturnValueOnce(file),
      };

      const bucketSpy = jest.spyOn(
        googleCloudStorageService,
        "_privateBucket",
        "get"
      );

      bucketSpy.mockReturnValueOnce(bucket);

      const result = await googleCloudStorageService.getDownloadStream(
        getUploadedFileType
      );

      expect(bucketSpy).toHaveBeenCalled();
      expect(bucket.file).toHaveBeenCalledWith("file.txt");
      expect(result).toEqual("stream");

      bucketSpy.mockRestore();
    });

    it("should reject with an error if getting the download stream fails", async () => {
      const error = new Error("Get download stream failed");

      const bucket = {
        file: jest.fn().mockRejectedValueOnce(error),
      };

      const bucketSpy = jest.spyOn(
        googleCloudStorageService,
        "_privateBucket",
        "get"
      );

      bucketSpy.mockReturnValueOnce(bucket);

      await expect(
        googleCloudStorageService.getDownloadStream(getUploadedFileType)
      ).rejects.toEqual(error);

      bucketSpy.mockRestore();
    });
  });

  describe("getPresignedDownloadUrl", () => {
    it("should get the presigned download URL for the private bucket", async () => {
      const file = {
        getSignedUrl: jest.fn().mockResolvedValueOnce("url"),
      };

      const bucket = {
        file: jest.fn().mockReturnValueOnce(file),
      };

      const bucketSpy = jest.spyOn(
        googleCloudStorageService,
        "_privateBucket",
        "get"
      );

      bucketSpy.mockReturnValueOnce(bucket);

      const result = await googleCloudStorageService.getPresignedDownloadUrl(
        getUploadedFileType
      );

      expect(bucketSpy).toHaveBeenCalled();
      expect(bucket.file).toHaveBeenCalledWith("file.txt");
      expect(file.getSignedUrl).toHaveBeenCalledWith({
        version: "v4",
        action: "read",
        expires: expect.any(Number),
      });
      expect(result).toEqual("url");

      bucketSpy.mockRestore();
    });

    it("should reject with an error if getting the presigned download URL fails", async () => {
      const error = new Error("Get presigned download URL failed");

      const file = {
        getSignedUrl: jest.fn().mockRejectedValueOnce(error),
      };

      const bucket = {
        file: jest.fn().mockReturnValueOnce(file),
      };

      const bucketSpy = jest.spyOn(
        googleCloudStorageService,
        "_privateBucket",
        "get"
      );

      bucketSpy.mockReturnValueOnce(bucket);

      await expect(
        googleCloudStorageService.getPresignedDownloadUrl(getUploadedFileType)
      ).rejects.toEqual(error);

      bucketSpy.mockRestore();
    });
  });
});
