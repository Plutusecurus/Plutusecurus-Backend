require('dotenv').config()
const S3 = require('aws-sdk/clients/s3')
const fs = require('fs')
const { extname } = require('path')

const bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION
const accessKeyId = process.env.AWS_S3_ACCESS_KEY
const secretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY

const s3 = new S3({
    region,
    accessKeyId,
    secretAccessKey,
})

exports.uploadFile = (file) => {
    const fileStream = fs.createReadStream(file.path)
    const fileExtension = extname(file.originalname);
    const fileName = file.filename + fileExtension;

    const uploadParams = {
        Bucket: bucketName,
        Body: fileStream,
        Key: fileName
    }

    return s3.upload(uploadParams).promise()
}