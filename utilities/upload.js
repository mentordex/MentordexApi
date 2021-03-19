const multer = require('multer');
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');
const config = require('config');
var hummus = require('hummus');
var isBase64 = require('is-base64');

//console.log(config.get('aws.accessKey')+':'+config.get('aws.secretKey')+':'+config.get('aws.region')+':'+config.get('aws.bucket'))
aws.config.update({
    // Your SECRET ACCESS KEY from AWS should go here,
    // Never share it!
    // Setup Env Variable, e.g: process.env.SECRET_ACCESS_KEY
    secretAccessKey: config.get('aws.secretKey'),
    // Not working key, Your ACCESS KEY ID from AWS should go here,
    // Never share it!
    // Setup Env Variable, e.g: process.env.ACCESS_KEY_ID
    accessKeyId: config.get('aws.accessKey'),
    //region: config.get('aws.region'), // region of your bucket
});

const s3 = new aws.S3();

const fileFilter = (req, file, cb) => {
    //console.log('req.body', req.body);
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png' || file.mimetype === 'image/svg+xml' || file.mimetype === 'video/mp4' || file.mimetype === 'video/quicktime' || file.mimetype === 'video/x-msvideo' || file.mimetype === 'video/webm') {
        cb(null, true);
    } else if (file.mimetype === 'application/pdf') {
        let pdfBase64String = req.body.base64StringFile;
        if (isBase64(pdfBase64String)) {
            let bufferPdf;
            try {
                bufferPdf = Buffer.from(pdfBase64String, 'base64');
                const pdfReader = hummus.createReader(new hummus.PDFRStreamForBuffer(bufferPdf));
                var pages = pdfReader.getPagesCount();
                if (pages > 0) {
                    //console.log("Seems to be a valid PDF!");
                    cb(null, true);
                } else {
                    //console.log("Unexpected outcome for number o pages: '" + pages + "'");
                    cb(new Error('The file is corrupted. Kindly choose other file.'), false);
                }
            } catch (err) {
                //console.log("ERROR while handling buffer of pdfBase64 and/or trying to parse PDF: " + err);
                cb(new Error('The file is corrupted. Kindly choose other file.'), false);
            }
        } else {
            cb(new Error('The file is corrupted. Kindly choose other file.'), false);
        }
    } else {
        cb(new Error('Invalid file type.'), false);
    }
}

const upload = multer({
    fileFilter,
    limits: { fieldSize: 25 * 1024 * 1024 },
    storage: multerS3({
        acl: 'public-read',
        s3,
        bucket: config.get('aws.bucket'),
        contentType: multerS3.AUTO_CONTENT_TYPE,

        key: function(req, file, cb) {
            const folderName = (req.body.folder) ? req.body.folder + '/' : '';
            cb(null, folderName + Date.now().toString())
        },

    })
});
module.exports = upload;