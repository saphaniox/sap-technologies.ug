require("dotenv").config();

const axios = require("axios");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { pipeline } = require("node:stream/promises");
const { Transform } = require("node:stream");
const mongoose = require("mongoose");
const { prepareTargetUri } = require("./copy-database-to-vps");

const { MongoClient } = mongoose.mongo;
const uploadsDirectory = path.resolve(__dirname, "../uploads");
const mediaDirectory = path.join(uploadsDirectory, "cloudinary-migrated");
const databaseUri = process.env.MONGODB_MEDIA_MIGRATION_URI;
const databaseName = (process.env.MONGODB_DB_NAME || "sap-technologies").trim();
const dryRun = process.argv.includes("--dry-run");
const MAX_MEDIA_BYTES = 100 * 1024 * 1024;
const isPlainObject = (value) => {
    if (!value || typeof value !== "object") return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
};
const MIME_EXTENSIONS = {
    "image/avif": ".avif",
    "image/gif": ".gif",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/svg+xml": ".svg",
    "image/webp": ".webp",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
    "application/pdf": ".pdf",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "text/plain": ".txt"
};

const isCloudinaryUrl = (value) => {
    if (typeof value !== "string") return false;

    try {
        const hostname = new URL(value).hostname.toLowerCase();
        return hostname === "cloudinary.com" || hostname.endsWith(".cloudinary.com");
    } catch {
        return false;
    }
};

const collectCloudinaryUrls = (value, urls = new Set()) => {
    if (typeof value === "string") {
        if (isCloudinaryUrl(value)) urls.add(value);
        return urls;
    }

    if (Array.isArray(value)) {
        value.forEach((item) => collectCloudinaryUrls(item, urls));
    } else if (isPlainObject(value)) {
        Object.values(value).forEach((item) => collectCloudinaryUrls(item, urls));
    }

    return urls;
};

const replaceCloudinaryUrls = (value, replacements) => {
    if (typeof value === "string") return replacements.get(value) || value;

    if (Array.isArray(value)) {
        return value.map((item) => replaceCloudinaryUrls(item, replacements));
    }

    if (isPlainObject(value)) {
        return Object.fromEntries(
            Object.entries(value).map(([key, item]) => [key, replaceCloudinaryUrls(item, replacements)])
        );
    }

    return value;
};

const getExtension = (contentType, url) => {
    const mimeType = (contentType || "").split(";")[0].trim().toLowerCase();
    if (MIME_EXTENSIONS[mimeType]) return MIME_EXTENSIONS[mimeType];

    const urlExtension = path.extname(new URL(url).pathname).toLowerCase();
    return /^\.[a-z0-9]{1,8}$/.test(urlExtension) ? urlExtension : ".bin";
};

const downloadMedia = async (url) => {
    const response = await axios.get(url, {
        responseType: "stream",
        timeout: 120000,
        maxRedirects: 5,
        maxContentLength: MAX_MEDIA_BYTES,
        validateStatus: (status) => status >= 200 && status < 300
    });

    const contentLength = Number(response.headers["content-length"]);
    if (Number.isFinite(contentLength) && contentLength > MAX_MEDIA_BYTES) {
        response.data.destroy();
        throw new Error(`Media exceeds the ${MAX_MEDIA_BYTES / 1024 / 1024} MB migration limit`);
    }

    const extension = getExtension(response.headers["content-type"], url);
    const fileName = `${crypto.createHash("sha256").update(url).digest("hex")}${extension}`;
    const destination = path.join(mediaDirectory, fileName);

    if (!fs.existsSync(destination)) {
        const temporaryPath = `${destination}.${process.pid}.tmp`;
        let receivedBytes = 0;
        const sizeLimit = new Transform({
            transform(chunk, encoding, callback) {
                receivedBytes += chunk.length;
                if (receivedBytes > MAX_MEDIA_BYTES) {
                    callback(new Error(`Media exceeds the ${MAX_MEDIA_BYTES / 1024 / 1024} MB migration limit`));
                    return;
                }
                callback(null, chunk);
            }
        });
        try {
            await pipeline(
                response.data,
                sizeLimit,
                fs.createWriteStream(temporaryPath, { flags: "wx", mode: 0o644 })
            );
            fs.renameSync(temporaryPath, destination);
        } catch (error) {
            fs.rmSync(temporaryPath, { force: true });
            throw error;
        }
    } else {
        response.data.destroy();
    }

    return `/uploads/cloudinary-migrated/${fileName}`;
};

const main = async () => {
    if (!databaseUri) {
        throw new Error("Set MONGODB_MEDIA_MIGRATION_URI to the database that should be updated");
    }
    if (!databaseName) {
        throw new Error("MONGODB_DB_NAME must be a non-empty database name");
    }

    const targetTls = prepareTargetUri(databaseUri);
    const usesSrvUri = targetTls.uri.startsWith("mongodb+srv://");
    const tlsEnabled = process.env.DB_TLS
        ? process.env.DB_TLS === "true"
        : usesSrvUri;
    const validateTls = process.env.DB_SSL_VALIDATE !== "false";
    const client = new MongoClient(targetTls.uri, {
        tls: tlsEnabled,
        tlsAllowInvalidCertificates: tlsEnabled && !validateTls,
        authSource: process.env.DB_AUTH_SOURCE || "admin",
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 120000
    });

    try {
        await client.connect();
        const database = client.db(databaseName);
        const collections = (await database.listCollections().toArray())
            .filter(({ name, type }) => !name.startsWith("system.") && type !== "view");
        let documentsFound = 0;
        let urlsFound = 0;
        let documentsUpdated = 0;

        if (!dryRun) fs.mkdirSync(mediaDirectory, { recursive: true });
        console.log(`${dryRun ? "Scanning" : "Migrating"} Cloudinary media in "${databaseName}".`);

        for (const { name, type } of collections) {
            const collection = database.collection(name);
            const cursor = collection.find({});
            let collectionUpdated = 0;

            for await (const document of cursor) {
                const urls = [...collectCloudinaryUrls(document)];
                if (urls.length === 0) continue;

                if (type !== "collection") {
                    throw new Error(
                        `Found Cloudinary media in unsupported "${type}" collection "${name}". ` +
                        "No document in this collection was changed."
                    );
                }

                documentsFound += 1;
                urlsFound += urls.length;
                if (dryRun) continue;

                const replacements = new Map();
                for (const url of urls) {
                    replacements.set(url, await downloadMedia(url));
                }

                const migratedDocument = replaceCloudinaryUrls(document, replacements);
                const result = await collection.replaceOne({ _id: document._id }, migratedDocument);
                if (result.modifiedCount !== 1) {
                    throw new Error(`Could not update ${name} document ${String(document._id)}`);
                }
                documentsUpdated += 1;
                collectionUpdated += 1;
            }

            console.log(`${name}: ${collectionUpdated} document(s) updated.`);
        }

        console.log(
            `${dryRun ? "Dry run found" : "Migration copied"} ${urlsFound} media URL(s) in ` +
            `${documentsFound} document(s)${dryRun ? "." : `; ${documentsUpdated} document(s) updated.`}`
        );
        if (dryRun) {
            console.log("Run without --dry-run to download files and replace database URLs.");
        }
    } finally {
        try {
            await client.close();
        } finally {
            if (targetTls.temporaryDirectory) {
                fs.rmSync(targetTls.temporaryDirectory, { recursive: true, force: true });
            }
        }
    }
};

if (require.main === module) {
    main().catch((error) => {
        console.error(`Cloudinary media migration failed: ${error.message}`);
        process.exitCode = 1;
    });
}

module.exports = {
    collectCloudinaryUrls,
    isCloudinaryUrl,
    replaceCloudinaryUrls
};
