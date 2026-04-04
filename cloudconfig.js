const fs = require("fs");
const path = require("path");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

const uploadsDir = path.join(__dirname, "uploads");
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const CLOUDINARY_FOLDER = "wonderlust_DEV";

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY || process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET || process.env.CLOUD_SECRET,
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname || "").toLowerCase() || ".jpg";
        const baseName = path
            .basename(file.originalname || "listing-image", extension)
            .replace(/[^a-z0-9_-]/gi, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 40) || "listing-image";

        cb(null, `${Date.now()}-${baseName}${extension}`);
    },
});

const upload = multer({
    storage,
    limits: {
        fileSize: MAX_IMAGE_SIZE_BYTES,
    },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype || !file.mimetype.startsWith("image/")) {
            return cb(new Error("Only image files are allowed."));
        }

        cb(null, true);
    },
});

function isCloudinaryConfigured() {
    return Boolean(
        (process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME) &&
        (process.env.CLOUDINARY_API_KEY || process.env.CLOUD_API_KEY) &&
        (process.env.CLOUDINARY_API_SECRET || process.env.CLOUD_SECRET)
    );
}

function getLocalImageUrl(filePath) {
    if (!filePath) {
        return "";
    }

    return `/uploads/${path.basename(filePath)}`;
}

function getLocalImagePathFromUrl(imageUrl) {
    if (typeof imageUrl !== "string" || !imageUrl.startsWith("/uploads/")) {
        return null;
    }

    return path.join(uploadsDir, path.basename(imageUrl));
}

async function removeLocalFile(filePath) {
    if (!filePath) {
        return;
    }

    try {
        await fs.promises.unlink(filePath);
    } catch (error) {
        if (error.code !== "ENOENT") {
            console.error("Failed to remove local file:", error.message);
        }
    }
}

async function uploadImageToCloudinary(filePath) {
    if (!filePath || !isCloudinaryConfigured()) {
        return null;
    }

    const uploadPromise = cloudinary.uploader.upload(filePath, {
        folder: CLOUDINARY_FOLDER,
        resource_type: "image",
    });

    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error("Cloudinary upload timed out."));
        }, 12000);
    });

    const result = await Promise.race([uploadPromise, timeoutPromise]);

    return {
        imageUrl: result.secure_url || result.url,
        imageFilename: result.public_id,
    };
}

async function destroyStoredImage(imageUrl, imageFilename) {
    if (imageFilename) {
        try {
            await cloudinary.uploader.destroy(imageFilename);
        } catch (error) {
            console.error("Failed to remove Cloudinary image:", error.message);
        }
        return;
    }

    const localImagePath = getLocalImagePathFromUrl(imageUrl);
    if (localImagePath) {
        await removeLocalFile(localImagePath);
    }
}

module.exports = {
    cloudinary,
    destroyStoredImage,
    getLocalImageUrl,
    isCloudinaryConfigured,
    MAX_IMAGE_SIZE_BYTES,
    removeLocalFile,
    upload,
    uploadImageToCloudinary,
};
