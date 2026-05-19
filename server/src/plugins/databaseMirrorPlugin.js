const mirrorService = require("../services/databaseMirrorService");

const toPlainDocument = (doc) => {
    if (!doc) return null;

    if (typeof doc.toObject === "function") {
        return doc.toObject({
            depopulate: true,
            getters: false,
            virtuals: false,
            versionKey: true,
            minimize: false
        });
    }

    return doc;
};

const getCollectionNameFromDocument = (doc) => doc?.constructor?.collection?.name;
const getCollectionNameFromQuery = (query) => query?.model?.collection?.name;

const mirrorDocument = (doc) => {
    const collectionName = getCollectionNameFromDocument(doc);
    const plain = toPlainDocument(doc);

    if (!collectionName || !plain?._id) return;
    mirrorService.upsertDocument(collectionName, plain);
};

const mirrorDocuments = (docs = []) => {
    if (!Array.isArray(docs) || docs.length === 0) return;

    const collectionName = getCollectionNameFromDocument(docs[0]);
    if (!collectionName) return;

    mirrorService.upsertDocuments(
        collectionName,
        docs.map(toPlainDocument).filter(Boolean)
    );
};

const getQueryOptions = (query) => {
    if (typeof query.getOptions === "function") {
        return query.getOptions();
    }

    return query.options || {};
};

const mirrorUpdateFromQuery = (query, { multi = false } = {}) => {
    const collectionName = getCollectionNameFromQuery(query);
    const filter = query.getFilter();
    const update = query.getUpdate();
    const options = getQueryOptions(query);

    if (!collectionName || !filter || !update) return;

    mirrorService.applyUpdate(collectionName, filter, update, {
        multi,
        upsert: options.upsert
    });
};

const mirrorReplaceFromQuery = (query) => {
    const collectionName = getCollectionNameFromQuery(query);
    const filter = query.getFilter();
    const replacement = query.getUpdate();
    const options = getQueryOptions(query);

    if (!collectionName || !filter || !replacement) return;

    mirrorService.replaceOne(collectionName, filter, replacement, {
        upsert: options.upsert
    });
};

const mirrorDeleteFromQuery = (query, { multi = false } = {}) => {
    const collectionName = getCollectionNameFromQuery(query);
    const filter = query.getFilter();

    if (!collectionName || !filter) return;
    mirrorService.deleteDocuments(collectionName, filter, { multi });
};

const databaseMirrorPlugin = (schema) => {
    schema.post("save", function mirrorSave(doc) {
        mirrorDocument(doc || this);
    });

    schema.post("insertMany", function mirrorInsertMany(docs) {
        mirrorDocuments(docs);
    });

    schema.post("deleteOne", { document: true, query: false }, function mirrorDocumentDelete() {
        const collectionName = getCollectionNameFromDocument(this);
        if (!collectionName || !this._id) return;
        mirrorService.deleteDocuments(collectionName, { _id: this._id });
    });

    schema.post("updateOne", { document: false, query: true }, function mirrorUpdateOne() {
        mirrorUpdateFromQuery(this);
    });

    schema.post("updateMany", function mirrorUpdateMany() {
        mirrorUpdateFromQuery(this, { multi: true });
    });

    schema.post("findOneAndUpdate", function mirrorFindOneAndUpdate() {
        mirrorUpdateFromQuery(this);
    });

    schema.post("replaceOne", function mirrorReplaceOne() {
        mirrorReplaceFromQuery(this);
    });

    schema.post("deleteOne", { document: false, query: true }, function mirrorDeleteOne() {
        mirrorDeleteFromQuery(this);
    });

    schema.post("deleteMany", function mirrorDeleteMany() {
        mirrorDeleteFromQuery(this, { multi: true });
    });

    schema.post("findOneAndDelete", function mirrorFindOneAndDelete() {
        mirrorDeleteFromQuery(this);
    });
};

module.exports = databaseMirrorPlugin;
